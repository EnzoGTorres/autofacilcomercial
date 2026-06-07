/**
 * generate-vehicles.ts
 *
 * Lee vehicles.csv + estructura de imagenes_web/
 * Genera scripts/vehicles-output.json con todos los datos listos para el seed.
 *
 * Uso: npx tsx scripts/generate-vehicles.ts
 */

import * as fs from "fs";
import * as path from "path";

// ─── Rutas ───────────────────────────────────────────────────────────────────

const CSV_PATH = path.join(__dirname, "..", "..", "Autofacil", "vehicles.csv");
const IMAGES_ROOT = path.join(__dirname, "..", "..", "Autofacil", "imagenes_web");
const OUTPUT_PATH = path.join(__dirname, "vehicles-output.json");

// ─── Constantes Supabase ─────────────────────────────────────────────────────

const SUPABASE_URL = "https://aftfwihzltrayxmslery.supabase.co";
const BUCKET = "vehicles";

// ─── ID del Ford Focus existente en DB ───────────────────────────────────────

const FORD_FOCUS_EXISTING_ID = "ea6beda7-9859-4c56-ab6c-344ccaa3857b";

// ─── Vehículos a excluir ─────────────────────────────────────────────────────

const EXCLUDE_BRANDS = ["HONDA", "REGNICOLI"];

// ─── Correcciones sobre datos del CSV ────────────────────────────────────────
// Clave: `${brand}|${model}` en MAYÚSCULAS tal como aparece en el CSV.

interface Correction {
  brand?: string;
  year?: number;
  is_available?: boolean;
}

const CORRECTIONS: Record<string, Correction> = {
  // El CSV tiene "FORD" pero es un Peugeot 308
  "FORD|308 2.0 FELINE": { brand: "PEUGEOT" },
  // La carpeta dice 2010_2011; año definitivo: 2011
  "CHEVROLET|CORSA CLASSIC 1.4": { year: 2011 },
  // Incluir como no disponible
  "RENAULT|DUSTER": { is_available: false },
};

// ─── Mapeo CSV → carpeta de imágenes ─────────────────────────────────────────
// Clave: `${brand_corregida}|${model}|${year_corregido}` (MAYÚSCULAS)

const FOLDER_MAP: Record<string, string> = {
  "CITROEN|C4 1.6 X PACK PLUS|2014": "citroen_c4_2014",
  "CITROEN|C3 1.6|2013": "citroen_c3_2013",
  "CHEVROLET|CORSA CLASSIC 1.4|2011": "chevrolet_corsa_2010_2011",
  "FIAT|FIORINO 1.3 ACTIVE|2013": "fiat_fiorino_2013",
  "FIAT|PUNTO 1.4 ATTRACTIVE|2015": "fiat_punto_2015",
  "VOLKSWAGEN|BORA TDI 1.9|2010": "vw_bora_2010",
  "VOLKSWAGEN|GOL POWER 1.6 AA/PC|2011": "vw_gol_2011",
  "VOLKSWAGEN|UP HIGH 1.0|2014": "vw_up_2014",
  "RENAULT|CAPTUR 2.0 ZEN|2018": "renault_captur_2018",
  "RENAULT|CLIO MIO CONFORT PLUS 1.2|2016": "renault_clio_2016",
  "RENAULT|DUSTER|2015": "renault_duster",
  "RENAULT|FLUENCE CONFORT|2018": "renault_fluence_2018",
  "PEUGEOT|208 1.6 ACTIVE|2018": "peugeot_208_2018",
  "PEUGEOT|207 1.4 HDI|2013": "peugeot_207_2013",
  "PEUGEOT|206 1.9 XTD|2005": "peugeot_206_2005",
  "PEUGEOT|308 2.0 FELINE|2008": "peugeot_308_2008",
  "FORD|FOCUS 1.6 AMBIENTE 5P|2008": "ford_focus_2008",
  "FORD|KA FLY PLUS 1.0|2013": "ford_ka_2013",
  "FORD|FALCON 3.6 SPRINT|1973": "ford_falcon_1973",
  "TOYOTA|HILUX SW4 3.0 SRV 4X4|2005": "toyota_sw4_2005",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateSlug(brand: string, model: string, year: number): string {
  return `${brand} ${model} ${year}`
    .toLowerCase()
    .replace(/\./g, "-")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getImageUrls(folder: string): string[] {
  const dir = path.join(IMAGES_ROOT, folder);
  if (!fs.existsSync(dir)) {
    console.warn(`  ⚠️  Carpeta no encontrada: ${dir}`);
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .sort()
    .map((f) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${folder}/${f}`);
}

function parseCSV(filePath: string): Record<string, string>[] {
  const content = fs
    .readFileSync(filePath, "latin1")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const lines = content.split("\n").filter((l) => l.trim());
  const headers = lines[0].split(";").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(";");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? "").trim();
    });
    return row;
  });
}

// ─── Tipos de salida ──────────────────────────────────────────────────────────

export interface VehicleOutput {
  operation: "INSERT" | "UPDATE";
  existing_id?: string; // solo para UPDATE
  brand: string;
  model: string;
  year: number;
  price: number;
  fuel_type: string | null;
  description: string | null;
  is_available: boolean;
  mileage: null;
  slug: string;
  images: string[];
  storage_folder: string;
  image_count: number;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log("📂 Leyendo CSV...");
  const rows = parseCSV(CSV_PATH);
  console.log(`   ${rows.length} filas encontradas\n`);

  const output: VehicleOutput[] = [];
  let skipped = 0;

  for (const row of rows) {
    const csvBrand = row["brand"]?.toUpperCase();
    const csvModel = row["model"];
    const csvYear = parseInt(row["year"], 10);

    // Excluir
    if (EXCLUDE_BRANDS.includes(csvBrand)) {
      console.log(`   ⏭  Excluido: ${csvBrand} ${csvModel}`);
      skipped++;
      continue;
    }

    // Aplicar correcciones
    const corrKey = `${csvBrand}|${csvModel}`;
    const corr = CORRECTIONS[corrKey] ?? {};

    const brand = (corr.brand ?? csvBrand) as string;
    const year = corr.year ?? csvYear;
    const is_available =
      corr.is_available !== undefined
        ? corr.is_available
        : row["is_available"] === "true";

    // Determinar carpeta de imágenes
    const folderKey = `${brand}|${csvModel}|${year}`;
    const folder = FOLDER_MAP[folderKey];

    if (!folder) {
      console.warn(`   ⚠️  Sin mapeo de carpeta: ${folderKey}`);
      continue;
    }

    const images = getImageUrls(folder);
    const slug = generateSlug(brand, csvModel, year);

    const isFordFocus = csvBrand === "FORD" && csvModel.includes("FOCUS");

    const entry: VehicleOutput = {
      operation: isFordFocus ? "UPDATE" : "INSERT",
      ...(isFordFocus ? { existing_id: FORD_FOCUS_EXISTING_ID } : {}),
      brand,
      model: csvModel,
      year,
      price: parseInt(row["price"], 10),
      fuel_type: row["tipo_combustible"] || null,
      description: row["description"] || null,
      is_available,
      mileage: null,
      slug,
      images,
      storage_folder: folder,
      image_count: images.length,
    };

    output.push(entry);
    console.log(
      `   ✅ ${entry.operation.padEnd(6)} ${brand} ${csvModel} ${year}` +
        (corr.brand ? " [brand corregido]" : "") +
        (corr.year ? " [year corregido]" : "") +
        ` → ${images.length} imágenes`
    );
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf-8");

  const inserts = output.filter((v) => v.operation === "INSERT");
  const updates = output.filter((v) => v.operation === "UPDATE");

  console.log("\n─────────────────────────────────────────────");
  console.log(`✅ vehicles-output.json generado`);
  console.log(`   INSERTs : ${inserts.length}`);
  console.log(`   UPDATEs : ${updates.length}`);
  console.log(`   Omitidos: ${skipped}`);
  console.log(`   Total DB: ${output.length} operaciones`);
  console.log(`   Archivo : ${OUTPUT_PATH}`);
}

main();
