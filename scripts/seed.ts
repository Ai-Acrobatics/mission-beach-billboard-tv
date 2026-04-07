#!/usr/bin/env npx tsx
/**
 * Seed the Supabase database with sample billboard data.
 * Usage: npx tsx scripts/seed.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

// Load .env.local
config({ path: resolve(__dirname, "../.env.local") });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function runSQL(filename: string) {
  const sql = readFileSync(resolve(__dirname, filename), "utf-8");
  const { error } = await supabase.rpc("exec_sql", { sql_text: sql }).single();
  if (error) {
    // RPC may not exist — fall back to running via REST
    console.warn(`⚠ rpc exec_sql not available. Run ${filename} manually in the Supabase SQL Editor.`);
    console.warn(`  File: scripts/${filename}`);
    return false;
  }
  return true;
}

async function seedViaInserts() {
  console.log("Seeding via direct inserts...\n");

  // --- Clients ---
  const clients = [
    { id: "c1000000-0000-0000-0000-000000000001", name: "Sarah Chen", business_name: "Belmont Park", email: "sarah@belmontpark.com", phone: "619-555-0101" },
    { id: "c1000000-0000-0000-0000-000000000002", name: "Mike Torres", business_name: "Mission Beach Surf Shop", email: "mike@mbsurf.com", phone: "619-555-0102" },
    { id: "c1000000-0000-0000-0000-000000000003", name: "Lisa Nguyen", business_name: "Pacific Beach Fish Shop", email: "lisa@pbfishshop.com", phone: "619-555-0103" },
    { id: "c1000000-0000-0000-0000-000000000004", name: "James Kim", business_name: "SD Bay Adventures", email: "james@sdbay.com", phone: "619-555-0104" },
    { id: "c1000000-0000-0000-0000-000000000005", name: "Maria Rodriguez", business_name: "Coastline Yoga", email: "maria@coastlineyoga.com", phone: "619-555-0105" },
  ];

  const { error: clientErr } = await supabase.from("clients").upsert(clients, { onConflict: "id" });
  if (clientErr) {
    console.error("❌ Failed to seed clients:", clientErr.message);
    return;
  }
  console.log(`✅ Seeded ${clients.length} clients`);

  // --- Ads ---
  const ads = [
    { id: "a1000000-0000-0000-0000-000000000001", title: "Belmont Park — Summer Fun Awaits", client_id: "c1000000-0000-0000-0000-000000000001", client_name: "Belmont Park", media_url: "", media_type: "image", duration_seconds: 15, active: true, priority: "premium", qr_code_url: "https://www.belmontpark.com" },
    { id: "a1000000-0000-0000-0000-000000000002", title: "Board Rentals from $25/day", client_id: "c1000000-0000-0000-0000-000000000002", client_name: "Mission Beach Surf Shop", media_url: "", media_type: "image", duration_seconds: 15, active: true, priority: "standard" },
    { id: "a1000000-0000-0000-0000-000000000003", title: "Fresh Catch Daily — Fish Tacos $12", client_id: "c1000000-0000-0000-0000-000000000003", client_name: "Pacific Beach Fish Shop", media_url: "", media_type: "image", duration_seconds: 15, active: true, priority: "standard" },
    { id: "a1000000-0000-0000-0000-000000000004", title: "Jet Ski & Kayak Rentals", client_id: "c1000000-0000-0000-0000-000000000004", client_name: "SD Bay Adventures", media_url: "", media_type: "video", duration_seconds: 30, active: true, priority: "premium", qr_code_url: "https://sdbay.com" },
    { id: "a1000000-0000-0000-0000-000000000005", title: "Sunrise Beach Yoga — $15 Drop-In", client_id: "c1000000-0000-0000-0000-000000000005", client_name: "Coastline Yoga", media_url: "", media_type: "image", duration_seconds: 15, active: true, priority: "standard" },
    { id: "a1000000-0000-0000-0000-000000000006", title: "Belmont Park After Dark", client_id: "c1000000-0000-0000-0000-000000000001", client_name: "Belmont Park", media_url: "", media_type: "video", duration_seconds: 30, active: true, priority: "takeover", qr_code_url: "https://www.belmontpark.com/afterdark" },
  ];

  const { error: adErr } = await supabase.from("ads").upsert(ads, { onConflict: "id" });
  if (adErr) {
    console.error("❌ Failed to seed ads:", adErr.message);
    return;
  }
  console.log(`✅ Seeded ${ads.length} ads`);

  // --- Schedule Assignments ---
  const schedules = [
    // Belmont Park morning weekdays
    ...([1, 2, 3, 4, 5].map((d) => ({ ad_id: "a1000000-0000-0000-0000-000000000001", time_slot_id: "morning", day_of_week: d, active: true }))),
    // SD Bay Adventures midday weekends
    { ad_id: "a1000000-0000-0000-0000-000000000004", time_slot_id: "midday", day_of_week: 0, active: true },
    { ad_id: "a1000000-0000-0000-0000-000000000004", time_slot_id: "midday", day_of_week: 6, active: true },
    // Belmont Park After Dark evening Fri-Sat
    { ad_id: "a1000000-0000-0000-0000-000000000006", time_slot_id: "evening", day_of_week: 5, active: true },
    { ad_id: "a1000000-0000-0000-0000-000000000006", time_slot_id: "evening", day_of_week: 6, active: true },
    // Coastline Yoga morning weekends
    { ad_id: "a1000000-0000-0000-0000-000000000005", time_slot_id: "morning", day_of_week: 0, active: true },
    { ad_id: "a1000000-0000-0000-0000-000000000005", time_slot_id: "morning", day_of_week: 6, active: true },
  ];

  const { error: schedErr } = await supabase
    .from("schedule_assignments")
    .upsert(schedules, { onConflict: "time_slot_id,day_of_week" });
  if (schedErr) {
    console.error("❌ Failed to seed schedules:", schedErr.message);
    return;
  }
  console.log(`✅ Seeded ${schedules.length} schedule assignments`);

  // --- Bookings ---
  const bookings = [
    { id: "b1000000-0000-0000-0000-000000000001", client_id: "c1000000-0000-0000-0000-000000000001", business_name: "Belmont Park", contact_name: "Sarah Chen", contact_email: "sarah@belmontpark.com", contact_phone: "619-555-0101", time_slot_id: "morning", duration_value: 4, duration_unit: "weeks", start_date: "2026-04-01", end_date: "2026-04-28", pricing_tier: "Growth", total_price: 2396, status: "live" },
    { id: "b1000000-0000-0000-0000-000000000002", client_id: "c1000000-0000-0000-0000-000000000004", business_name: "SD Bay Adventures", contact_name: "James Kim", contact_email: "james@sdbay.com", contact_phone: "619-555-0104", time_slot_id: "midday", duration_value: 2, duration_unit: "weeks", start_date: "2026-04-01", end_date: "2026-04-14", pricing_tier: "Growth", total_price: 1198, status: "live" },
    { id: "b1000000-0000-0000-0000-000000000003", client_id: "c1000000-0000-0000-0000-000000000001", business_name: "Belmont Park", contact_name: "Sarah Chen", contact_email: "sarah@belmontpark.com", contact_phone: "619-555-0101", time_slot_id: "evening", duration_value: 4, duration_unit: "weeks", start_date: "2026-04-01", end_date: "2026-04-28", pricing_tier: "Takeover", total_price: 5996, status: "live" },
  ];

  const { error: bookErr } = await supabase.from("bookings").upsert(bookings, { onConflict: "id" });
  if (bookErr) {
    console.error("❌ Failed to seed bookings:", bookErr.message);
    return;
  }
  console.log(`✅ Seeded ${bookings.length} bookings`);

  // --- Impressions ---
  const now = new Date();
  const impressions = [
    { ad_id: "a1000000-0000-0000-0000-000000000001", played_at: new Date(now.getTime() - 1 * 3600000).toISOString(), duration_seconds: 15, time_slot_id: "evening", day_of_week: now.getDay() },
    { ad_id: "a1000000-0000-0000-0000-000000000002", played_at: new Date(now.getTime() - 2 * 3600000).toISOString(), duration_seconds: 15, time_slot_id: "evening", day_of_week: now.getDay() },
    { ad_id: "a1000000-0000-0000-0000-000000000004", played_at: new Date(now.getTime() - 3 * 3600000).toISOString(), duration_seconds: 30, time_slot_id: "midday", day_of_week: now.getDay() },
    { ad_id: "a1000000-0000-0000-0000-000000000001", played_at: new Date(now.getTime() - 5 * 3600000).toISOString(), duration_seconds: 15, time_slot_id: "midday", day_of_week: now.getDay() },
    { ad_id: "a1000000-0000-0000-0000-000000000003", played_at: new Date(now.getTime() - 6 * 3600000).toISOString(), duration_seconds: 15, time_slot_id: "midday", day_of_week: now.getDay() },
    { ad_id: "a1000000-0000-0000-0000-000000000005", played_at: new Date(now.getTime() - 10 * 3600000).toISOString(), duration_seconds: 15, time_slot_id: "morning", day_of_week: now.getDay() },
    { ad_id: "a1000000-0000-0000-0000-000000000006", played_at: new Date(now.getTime() - 20 * 3600000).toISOString(), duration_seconds: 30, time_slot_id: "evening", day_of_week: now.getDay() },
  ];

  const { error: impErr } = await supabase.from("impressions").insert(impressions);
  if (impErr) {
    console.error("❌ Failed to seed impressions:", impErr.message);
    return;
  }
  console.log(`✅ Seeded ${impressions.length} impressions`);

  console.log("\n🎉 Database seeded successfully!");
}

async function main() {
  console.log("🌱 Mission Beach Billboard TV — Database Seeder\n");
  console.log(`Supabase URL: ${url}\n`);

  // Try running the setup SQL first
  console.log("Step 1: Running schema setup...");
  const schemaOk = await runSQL("setup-supabase.sql");
  if (!schemaOk) {
    console.log("⚠ Run scripts/setup-supabase.sql manually first, then re-run this script.\n");
  }

  console.log("\nStep 2: Inserting seed data...");
  await seedViaInserts();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
