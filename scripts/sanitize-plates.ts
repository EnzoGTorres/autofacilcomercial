/**
 * sanitize-plates.ts
 *
 * Recorre todas las imágenes del bucket `vehicles` en Supabase Storage,
 * detecta patentes/matrículas visibles mediante OCR (Google Cloud Vision)
 * y genera una copia "sanitizada" con la patente pixelada — preservando
 * dimensiones, formato y calidad del resto de la imagen.
 *
 * Las copias se guardan en `<carpeta>/sanitized/<archivo>` dentro del
 * MISMO bucket. Los originales NO se modifican ni se eliminan: esto permite
 * revisar el resultado antes de promoverlo a producción (ver sección
 * "Promoción a producción" en la documentación entregada).
 *
 * Requisitos en .env.local:
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role key, Dashboard > Settings > API>
 *   GOOGLE_APPLICATION_CREDENTIALS=<ruta absoluta al JSON de la cuenta de servicio
 *                                   de Google Cloud con el rol "Cloud Vision API User">
 *
 * Uso:
 *   npx tsx scripts/sanitize-plates.ts                    → procesa TODO el bucket
 *   npx tsx scripts/sanitize-plates.ts ford_focus_2008    → procesa solo una carpeta
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import vision from "@google-cloud/vision";
import sharp from "sharp";

// ─── Cargar .env.local (mismo helper que upload-images.ts) ──────────────────

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(__dirname, "..", ".env.local"));

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "vehicles";
const SANITIZED_SUBFOLDER = "sanitized";

// Pixelado: factor de reducción antes de reescalar (más bajo = bloques más grandes/ilegibles)
const PIXELATION_FACTOR = 0.06;
// Margen extra alrededor del recuadro detectado, como % de su tamaño
// (cubre bordes de la patente que el OCR no encuadró del todo)
const PADDING_RATIO = 0.18;

// ─── Validaciones de entorno ─────────────────────────────────────────────────

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith("REPLACE_")) {
  console.error("\n❌ Falta SUPABASE_SERVICE_ROLE_KEY en .env.local");
  console.error("   Obtenerla en: Supabase Dashboard > Project Settings > API > service_role\n");
  process.exit(1);
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("\n❌ Falta GOOGLE_APPLICATION_CREDENTIALS en .env.local");
  console.error("   Debe apuntar a la ruta absoluta del JSON de credenciales de la");
  console.error("   cuenta de servicio de Google Cloud Vision (ver documentación entregada).\n");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const visionClient = new vision.ImageAnnotatorClient();

// ─── Patrones de patente argentina ────────────────────────────────────────────
// Formato viejo    (pre-2016): 3 letras + 3 números   → ABC123 / ABC 123
// Formato Mercosur (2016+)   : 2 letras + 3 números + 2 letras → AB123CD / AB 123 CD

const PLATE_PATTERNS = [/^[A-Z]{3}\d{3}$/, /^[A-Z]{2}\d{3}[A-Z]{2}$/];

function normalizePlateText(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function looksLikePlate(raw: string): boolean {
  const normalized = normalizePlateText(raw);
  if (normalized.length < 6 || normalized.length > 7) return false;
  return PLATE_PATTERNS.some((re) => re.test(normalized));
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface BoundingBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface PlateCandidate {
  text: string;
  box: BoundingBox;
}

interface ProcessResult {
  ok: boolean;
  vehicle: string;
  image: string;
  platesDetected: string[];
  error?: string;
  skipped?: boolean;
}

// ─── Detección de patentes con Google Cloud Vision (OCR) ─────────────────────
//
// Se usa TEXT_DETECTION (no un detector de "objetos patente" dedicado, que
// Google/Azure/AWS no ofrecen como categoría estándar). Cada palabra detectada
// se valida contra el formato de patente argentino + heurísticas de geometría,
// lo que reduce drásticamente los falsos positivos de otros textos en la foto
// (carteles, capot, etc).

async function detectPlates(
  imageBuffer: Buffer,
  imgWidth: number,
  imgHeight: number
): Promise<PlateCandidate[]> {
  const [result] = await visionClient.textDetection({ image: { content: imageBuffer } });
  const annotations = result.textAnnotations ?? [];
  // El elemento [0] es el bloque de texto completo de la imagen; desde [1] son tokens individuales
  const tokens = annotations.slice(1);

  const candidates: PlateCandidate[] = [];

  for (const token of tokens) {
    const text = token.description ?? "";
    const vertices = (token.boundingPoly?.vertices ?? []) as Array<{ x?: number | null; y?: number | null }>;
    if (vertices.length < 4 || !looksLikePlate(text)) continue;

    const xs = vertices.map((v) => v.x ?? 0);
    const ys = vertices.map((v) => v.y ?? 0);
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    const width = Math.max(...xs) - left;
    const height = Math.max(...ys) - top;

    // Relación de aspecto típica de una patente legible (ancho:alto ≈ 2:1 a 5:1)
    const aspect = width / Math.max(height, 1);
    if (aspect < 1.5 || aspect > 6) continue;

    // Una patente real no ocupa la imagen entera (filtra falsos positivos grandes)
    if (width > imgWidth * 0.6 || height > imgHeight * 0.4) continue;

    candidates.push({ text: normalizePlateText(text), box: { left, top, width, height } });
  }

  return candidates;
}

// ─── Pixelado de una región, preservando intacto el resto de la imagen ───────

async function pixelateRegion(
  imageBuffer: Buffer,
  box: BoundingBox,
  imgWidth: number,
  imgHeight: number
): Promise<Buffer> {
  const padX = Math.round(box.width * PADDING_RATIO);
  const padY = Math.round(box.height * PADDING_RATIO);

  const left = Math.max(0, Math.round(box.left) - padX);
  const top = Math.max(0, Math.round(box.top) - padY);
  const width = Math.min(imgWidth - left, Math.round(box.width) + padX * 2);
  const height = Math.min(imgHeight - top, Math.round(box.height) + padY * 2);

  // 1. Extraer SOLO la región de la patente (con margen)
  const region = sharp(imageBuffer).extract({ left, top, width, height });

  // 2. Pixelar: reducir agresivamente y reescalar con interpolación "nearest"
  //    (esto produce el efecto de "bloques" sin introducir artefactos de blur/ruido)
  const smallW = Math.max(1, Math.round(width * PIXELATION_FACTOR));
  const smallH = Math.max(1, Math.round(height * PIXELATION_FACTOR));
  const pixelated = await region
    .resize(smallW, smallH, { kernel: "nearest" })
    .resize(width, height, { kernel: "nearest" })
    .toBuffer();

  // 3. Recomponer: pegar el bloque pixelado exactamente sobre su posición original.
  //    El resto de los píxeles de la imagen permanece sin tocar.
  return sharp(imageBuffer).composite([{ input: pixelated, left, top }]).toBuffer();
}

// ─── Procesar una imagen individual ──────────────────────────────────────────

async function processImage(folder: string, filename: string): Promise<ProcessResult> {
  const storagePath = `${folder}/${filename}`;
  const sanitizedPath = `${folder}/${SANITIZED_SUBFOLDER}/${filename}`;

  try {
    const { data, error: downloadError } = await supabase.storage.from(BUCKET).download(storagePath);
    if (downloadError || !data) {
      return {
        ok: false,
        vehicle: folder,
        image: filename,
        platesDetected: [],
        error: downloadError?.message ?? "no se pudo descargar el original",
      };
    }

    const originalBuffer = Buffer.from(await data.arrayBuffer());
    const meta = await sharp(originalBuffer).metadata();
    const imgWidth = meta.width ?? 0;
    const imgHeight = meta.height ?? 0;

    if (!imgWidth || !imgHeight) {
      return { ok: false, vehicle: folder, image: filename, platesDetected: [], error: "no se pudieron leer las dimensiones" };
    }

    const candidates = await detectPlates(originalBuffer, imgWidth, imgHeight);

    if (candidates.length === 0) {
      return { ok: true, vehicle: folder, image: filename, platesDetected: [], skipped: true };
    }

    // Pixelar cada patente detectada de forma acumulativa sobre el mismo buffer
    let workingBuffer: Buffer = originalBuffer;
    for (const candidate of candidates) {
      workingBuffer = await pixelateRegion(workingBuffer, candidate.box, imgWidth, imgHeight);
    }

    // Verificación de seguridad: las dimensiones deben permanecer idénticas
    const finalMeta = await sharp(workingBuffer).metadata();
    if (finalMeta.width !== imgWidth || finalMeta.height !== imgHeight) {
      return {
        ok: false,
        vehicle: folder,
        image: filename,
        platesDetected: candidates.map((c) => c.text),
        error: "las dimensiones cambiaron tras procesar — se abortó el guardado",
      };
    }

    // Re-codificar manteniendo formato y una calidad equivalente a la original
    const ext = path.extname(filename).toLowerCase();
    let outputBuffer: Buffer;
    let contentType: string;
    if (ext === ".png") {
      outputBuffer = await sharp(workingBuffer).png({ quality: 100, compressionLevel: 6 }).toBuffer();
      contentType = "image/png";
    } else if (ext === ".webp") {
      outputBuffer = await sharp(workingBuffer).webp({ quality: 95 }).toBuffer();
      contentType = "image/webp";
    } else {
      outputBuffer = await sharp(workingBuffer).jpeg({ quality: 95, mozjpeg: true }).toBuffer();
      contentType = "image/jpeg";
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(sanitizedPath, outputBuffer, { contentType, upsert: true });

    if (uploadError) {
      return {
        ok: false,
        vehicle: folder,
        image: filename,
        platesDetected: candidates.map((c) => c.text),
        error: uploadError.message,
      };
    }

    return { ok: true, vehicle: folder, image: filename, platesDetected: candidates.map((c) => c.text) };
  } catch (err) {
    return {
      ok: false,
      vehicle: folder,
      image: filename,
      platesDetected: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const onlyFolder = process.argv[2]; // opcional: limitar a una sola carpeta de vehículo

  console.log("🚗  Sanitización automática de patentes — Auto Fácil MZA");
  console.log(`    Bucket    : ${BUCKET}`);
  console.log(`    Detección : Google Cloud Vision (TEXT_DETECTION) + validación de formato AR`);
  console.log(`    Salida    : <carpeta>/${SANITIZED_SUBFOLDER}/<archivo>  (originales intactos)\n`);

  const { data: rootEntries, error: listError } = await supabase.storage.from(BUCKET).list("", { limit: 1000 });
  if (listError || !rootEntries) {
    console.error("❌ No se pudo listar el bucket:", listError?.message);
    process.exit(1);
  }

  // En Supabase Storage, las "carpetas" aparecen como entradas sin id/metadata
  let folders = rootEntries.filter((e) => e.id === null).map((e) => e.name);
  if (onlyFolder) {
    folders = folders.filter((f) => f === onlyFolder);
    if (folders.length === 0) {
      console.error(`❌ No existe la carpeta "${onlyFolder}" en el bucket "${BUCKET}"`);
      process.exit(1);
    }
  }

  console.log(`    Carpetas a procesar: ${folders.length}\n`);

  const results: ProcessResult[] = [];

  for (const folder of folders) {
    const { data: files, error: filesError } = await supabase.storage.from(BUCKET).list(folder, { limit: 1000 });
    if (filesError || !files) {
      console.error(`❌ ${folder}: no se pudo listar — ${filesError?.message}`);
      continue;
    }

    const images = files
      .filter((f) => /\.(png|jpe?g|webp)$/i.test(f.name))
      .filter((f) => f.name !== SANITIZED_SUBFOLDER)
      .sort((a, b) => a.name.localeCompare(b.name));

    console.log(`📁 ${folder}  (${images.length} imágenes)`);

    for (const file of images) {
      const result = await processImage(folder, file.name);
      results.push(result);

      if (result.error) {
        console.log(`   ❌ ERROR  ${file.name} — ${result.error}`);
      } else if (result.skipped) {
        console.log(`   ⏭  OK     ${file.name} — sin patente detectada (no se generó copia)`);
      } else {
        console.log(`   ✅ OK     ${file.name} — patente detectada: [${result.platesDetected.join(", ")}] → pixelada y guardada en ${SANITIZED_SUBFOLDER}/`);
      }
    }
    console.log();
  }

  // ─── Resumen final ──────────────────────────────────────────────────────────
  const processed = results.filter((r) => r.ok && !r.skipped);
  const skipped = results.filter((r) => r.skipped);
  const errors = results.filter((r) => !r.ok);

  console.log("─────────────────────────────────────────────");
  console.log("📊 Resumen");
  console.log(`   Imágenes analizadas           : ${results.length}`);
  console.log(`   Patentes detectadas y pixeladas: ${processed.length}`);
  console.log(`   Sin patente visible (omitidas) : ${skipped.length}`);
  console.log(`   Errores                        : ${errors.length}`);

  if (errors.length > 0) {
    console.log("\n   Detalle de errores:");
    errors.forEach((e) => console.log(`   - ${e.vehicle}/${e.image}: ${e.error}`));
  }

  console.log("\n▶  Próximo paso: revisar manualmente las imágenes en <carpeta>/sanitized/");
  console.log("   antes de promoverlas a producción (reemplazo de originales o actualización");
  console.log("   del campo `images` en la tabla `vehicles`).");
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
  console.error("Error fatal:", err);
  process.exit(1);
});
