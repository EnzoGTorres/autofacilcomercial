/**
 * seed-vehicles.ts
 *
 * Lee vehicles-output.json y ejecuta las operaciones en Supabase:
 *   - 1 UPDATE  : Ford Focus (actualiza slug)
 *   - 18 INSERTs: vehículos activos nuevos
 *   -  1 INSERT : Renault Duster (is_available = false)
 *
 * IMPORTANTE: Muestra el resumen completo y pide confirmación antes de tocar la DB.
 *
 * Requisito: agregar en .env.local
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role key desde Supabase Dashboard > Settings > API>
 *
 * Uso: npx tsx scripts/seed-vehicles.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { createClient } from "@supabase/supabase-js";
import type { VehicleOutput } from "./generate-vehicles";

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
const OUTPUT_PATH = path.join(__dirname, "vehicles-output.json");

// ─── Validación ───────────────────────────────────────────────────────────────

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith("REPLACE_")) {
  console.error("\n❌ Falta SUPABASE_SERVICE_ROLE_KEY en .env.local");
  console.error(
    "   Obtenerla en: Supabase Dashboard > Project Settings > API > service_role\n"
  );
  process.exit(1);
}

if (!fs.existsSync(OUTPUT_PATH)) {
  console.error("\n❌ vehicles-output.json no encontrado.");
  console.error("   Ejecutar primero: npx tsx scripts/generate-vehicles.ts\n");
  process.exit(1);
}

// ─── Supabase client con service_role ────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ─── Prompt helper ────────────────────────────────────────────────────────────

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const vehicles: VehicleOutput[] = JSON.parse(
    fs.readFileSync(OUTPUT_PATH, "utf-8")
  );

  const inserts = vehicles.filter((v) => v.operation === "INSERT");
  const updates = vehicles.filter((v) => v.operation === "UPDATE");
  const inactive = inserts.filter((v) => !v.is_available);
  const active = inserts.filter((v) => v.is_available);

  // ─── RESUMEN FINAL ────────────────────────────────────────────────────────

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  RESUMEN FINAL — operaciones sobre Supabase");
  console.log("══════════════════════════════════════════════════════════\n");

  console.log(`  Total operaciones : ${vehicles.length}`);
  console.log(`  INSERTs activos   : ${active.length}`);
  console.log(`  INSERTs inactivos : ${inactive.length}`);
  console.log(`  UPDATEs           : ${updates.length}`);
  console.log();

  // Header de tabla
  const col = (s: string, w: number) => s.slice(0, w).padEnd(w);

  console.log(
    `  ${"OP".padEnd(6)} ${"BRAND".padEnd(10)} ${"MODEL".padEnd(32)} ${"YEAR".padEnd(4)}  ${"SLUG".padEnd(40)} ${"IMGS".padEnd(4)} ${"AVAIL"}`
  );
  console.log("  " + "─".repeat(115));

  for (const v of vehicles) {
    const op = v.operation === "UPDATE" ? "UPDATE" : v.is_available ? "INSERT" : "INSERT!";
    console.log(
      `  ${col(op, 6)} ${col(v.brand, 10)} ${col(v.model, 32)} ${String(v.year).padEnd(4)}  ${col(v.slug, 40)} ${String(v.image_count).padEnd(4)} ${v.is_available ? "✓" : "✗ (no disponible)"}`
    );
  }

  console.log();
  console.log("  Slugs generados:");
  for (const v of vehicles) {
    const marker = v.operation === "UPDATE" ? "[UPDATE]" : "[INSERT]";
    console.log(`    ${marker.padEnd(9)} ${v.slug}`);
  }

  console.log();
  console.log("  Imágenes por vehículo:");
  for (const v of vehicles) {
    console.log(`    ${String(v.image_count).padStart(2)} imgs  ${v.brand} ${v.model} ${v.year}`);
  }

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  ⚠️  NINGUNA operación fue ejecutada todavía.");
  console.log("══════════════════════════════════════════════════════════\n");

  // ─── CONFIRMACIÓN ─────────────────────────────────────────────────────────

  const answer = await prompt(
    `  ¿Confirmar ${vehicles.length} operaciones en Supabase? (escribir "SI" para confirmar): `
  );

  if (answer !== "SI") {
    console.log("\n  ❌ Operación cancelada. No se modificó la base de datos.\n");
    process.exit(0);
  }

  // ─── EJECUTAR ─────────────────────────────────────────────────────────────

  console.log("\n  ▶ Ejecutando...\n");
  let ok = 0;
  let errors = 0;

  for (const v of vehicles) {
    if (v.operation === "UPDATE") {
      // Solo actualizar slug (images ya están, mileage ya es null)
      const { error } = await supabase
        .from("vehicles")
        .update({ slug: v.slug })
        .eq("id", v.existing_id!);

      if (error) {
        console.error(`  ❌ UPDATE ${v.brand} ${v.model}: ${error.message}`);
        errors++;
      } else {
        console.log(`  ✅ UPDATE  ${v.brand} ${v.model} → slug: ${v.slug}`);
        ok++;
      }
    } else {
      // INSERT
      const { error } = await supabase.from("vehicles").insert({
        brand: v.brand,
        model: v.model,
        year: v.year,
        price: v.price,
        fuel_type: v.fuel_type,
        description: v.description,
        is_available: v.is_available,
        mileage: null,
        slug: v.slug,
        images: v.images,
      });

      if (error) {
        console.error(`  ❌ INSERT ${v.brand} ${v.model}: ${error.message}`);
        errors++;
      } else {
        console.log(
          `  ✅ INSERT  ${v.brand} ${v.model} ${v.year}${!v.is_available ? " (no disponible)" : ""}`
        );
        ok++;
      }
    }
  }

  console.log("\n══════════════════════════════════════════════════════════");
  console.log(`  ✅ Completado: ${ok} exitosos, ${errors} errores`);
  console.log("══════════════════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
