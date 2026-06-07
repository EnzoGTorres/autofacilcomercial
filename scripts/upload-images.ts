/**
 * upload-images.ts
 *
 * Sube las 19 carpetas de imágenes pendientes al bucket `vehicles` de Supabase Storage.
 * El Ford Focus ya está subido — se omite automáticamente.
 *
 * Requisito: agregar en .env.local
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role key desde Supabase Dashboard > Settings > API>
 *
 * Uso: npx tsx scripts/upload-images.ts
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// ─── Cargar .env.local ────────────────────────────────────────────────────────

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
const IMAGES_ROOT = path.join(__dirname, "..", "..", "Autofacil", "imagenes_web");
const BUCKET = "vehicles";

// Carpetas ya en Storage — no re-subir
const SKIP_FOLDERS = ["ford_focus_2008"];

// ─── Validación ───────────────────────────────────────────────────────────────

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith("REPLACE_")) {
  console.error("\n❌ Falta SUPABASE_SERVICE_ROLE_KEY en .env.local");
  console.error(
    "   Obtenerla en: Supabase Dashboard > Project Settings > API > service_role\n"
  );
  process.exit(1);
}

// ─── Cliente con service_role (bypass RLS) ────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

async function uploadFile(
  folder: string,
  filename: string
): Promise<{ ok: boolean; error?: string }> {
  const localPath = path.join(IMAGES_ROOT, folder, filename);
  const storagePath = `${folder}/${filename}`;
  const fileBuffer = fs.readFileSync(localPath);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: getMimeType(filename),
      upsert: true,
    });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Iniciando upload de imágenes a Supabase Storage...");
  console.log(`   Bucket  : ${BUCKET}`);
  console.log(`   Proyecto: ${SUPABASE_URL}\n`);

  const folders = fs
    .readdirSync(IMAGES_ROOT)
    .filter((f) => fs.statSync(path.join(IMAGES_ROOT, f)).isDirectory())
    .filter((f) => !SKIP_FOLDERS.includes(f))
    .sort();

  console.log(`   Carpetas a subir: ${folders.length}`);
  SKIP_FOLDERS.forEach((f) => console.log(`   ⏭  Omitiendo (ya en Storage): ${f}`));
  console.log();

  let totalFiles = 0;
  let totalErrors = 0;

  for (const folder of folders) {
    const files = fs
      .readdirSync(path.join(IMAGES_ROOT, folder))
      .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
      .sort();

    console.log(`📁 ${folder} (${files.length} archivos)`);

    for (const file of files) {
      const result = await uploadFile(folder, file);
      if (result.ok) {
        console.log(`   ✅ ${file}`);
        totalFiles++;
      } else {
        console.error(`   ❌ ${file} — ${result.error}`);
        totalErrors++;
      }
    }
    console.log();
  }

  console.log("─────────────────────────────────────────────");
  console.log(`✅ Upload completado`);
  console.log(`   Subidos : ${totalFiles} archivos`);
  if (totalErrors > 0) {
    console.log(`   Errores : ${totalErrors} archivos`);
  }
  console.log("\n▶  Siguiente paso: npx tsx scripts/generate-vehicles.ts");
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
