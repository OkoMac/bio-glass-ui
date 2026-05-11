#!/usr/bin/env node
/**
 * Provider data enrichment via Google Places Details API.
 *
 * Pulls real per-provider content (editorial summary, opening hours,
 * up-to-date reviews + photos, website) for records that have a
 * google_place_id. Writes the result back into the bundled
 * bion_*_data.json files so the SSR provider pages have real content
 * — currently they fall back to "Professional X provider in Y" which
 * hits Google's duplicate filter even with v2.0 SSR shipping unique
 * titles + H1s.
 *
 * Why this matters: SEO. The 14k provider pages are indexed but
 * thin-content. Editorial summary + hours per provider is what tips
 * them over the duplicate-detection threshold and unlocks long-tail
 * search traffic.
 *
 * Usage:
 *   GOOGLE_PLACES_API_KEY=... node scripts/enrich-providers.mjs --dry-run
 *   GOOGLE_PLACES_API_KEY=... node scripts/enrich-providers.mjs --batch=50
 *
 *   --dry-run     report what would be enriched without making API calls
 *   --batch=N     enrich N providers per run (default 50, max 200)
 *   --city=jhb    only process Johannesburg providers (default both)
 *
 * Cost: Google Places Details billed per request. Editorial summary
 * field requires the Place Details (Pro) SKU. At time of writing:
 *   - $0.017 / Place Details (Basic)
 *   - $0.005 / additional field per request (atmosphere, contacts, etc.)
 * Full enrichment of 13k records: ~$220 if done in one pass. Don't.
 * Run in batches; spot-check first 50; iterate.
 *
 * The script preserves all existing fields and only writes NEW fields
 * we add (description, opening_hours when missing, business_status,
 * rating + reviewCount refresh). It NEVER overwrites a non-empty field
 * unless --force is passed.
 *
 * Idempotency: tracks which providers have been enriched via a
 * sidecar file `src/data/enrichment-state.json`. Re-runs skip already
 * processed providers unless --force.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA_FILES = [
  path.join(ROOT, "src/data/bion_pretoria_data.json"),
  path.join(ROOT, "src/data/bion_johannesburg_data.json"),
];
const STATE_FILE = path.join(ROOT, "src/data/enrichment-state.json");

const API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isForce  = args.includes("--force");
const batchArg = args.find(a => a.startsWith("--batch="));
const batchSize = Math.min(200, Math.max(1, parseInt(batchArg?.split("=")[1] ?? "50", 10) || 50));
const cityArg  = args.find(a => a.startsWith("--city="));
const cityFilter = cityArg?.split("=")[1] ?? null; // 'jhb' | 'pta' | null

if (!isDryRun && !API_KEY) {
  console.error("✗ GOOGLE_PLACES_API_KEY env var required (or pass --dry-run)");
  process.exit(1);
}

// ── Load state ──────────────────────────────────────────────────────
let state = { enriched_ids: [], last_run: null, total_cost_usd: 0 };
if (existsSync(STATE_FILE)) {
  state = JSON.parse(readFileSync(STATE_FILE, "utf8"));
}
const enrichedSet = new Set(state.enriched_ids);

// ── Pick candidates ─────────────────────────────────────────────────
function pickCandidates() {
  const candidates = [];
  for (const file of DATA_FILES) {
    if (cityFilter === "pta" && !file.includes("pretoria")) continue;
    if (cityFilter === "jhb" && !file.includes("johannesburg")) continue;
    const data = JSON.parse(readFileSync(file, "utf8"));
    for (const p of data.providers ?? []) {
      if (!p.google_place_id) continue;
      if (!isForce && enrichedSet.has(p.id)) continue;
      // Skip if already has description AND opening_hours (already enriched manually)
      const hasDesc = (p.description ?? "").trim().length > 50;
      const hasHours = Array.isArray(p.opening_hours) && p.opening_hours.length > 0;
      if (!isForce && hasDesc && hasHours) {
        enrichedSet.add(p.id);
        continue;
      }
      candidates.push({ provider: p, file });
      if (candidates.length >= batchSize) return candidates;
    }
  }
  return candidates;
}

const candidates = pickCandidates();
console.log(`📊 candidates: ${candidates.length}  (batch=${batchSize}, dry=${isDryRun}, force=${isForce}, city=${cityFilter ?? "all"})`);

if (candidates.length === 0) {
  console.log("✓ nothing to enrich");
  process.exit(0);
}

// ── Dry-run summary ─────────────────────────────────────────────────
if (isDryRun) {
  console.log();
  for (const { provider } of candidates.slice(0, 10)) {
    console.log(`  ${provider.id.padEnd(28)} ${provider.name.slice(0, 50)}  →  ${provider.google_place_id.slice(0, 20)}…`);
  }
  if (candidates.length > 10) console.log(`  …and ${candidates.length - 10} more`);
  console.log();
  console.log(`Cost estimate (Places Details Pro, ~$0.017 + atmosphere ~$0.005):`);
  console.log(`  ~$${(candidates.length * 0.022).toFixed(2)} for this batch`);
  console.log(`  Total in state file so far: $${state.total_cost_usd.toFixed(2)}`);
  process.exit(0);
}

// ── Live enrichment ─────────────────────────────────────────────────
const PLACES_ENDPOINT = "https://maps.googleapis.com/maps/api/place/details/json";
const FIELDS = [
  "editorial_summary",
  "opening_hours",
  "current_opening_hours",
  "website",
  "international_phone_number",
  "rating",
  "user_ratings_total",
  "business_status",
  "url",
].join(",");

async function enrichOne(provider) {
  const url = `${PLACES_ENDPOINT}?place_id=${encodeURIComponent(provider.google_place_id)}&fields=${FIELDS}&key=${API_KEY}`;
  const res = await fetch(url);
  const j = await res.json();
  if (j.status !== "OK") {
    return { ok: false, reason: j.status, error: j.error_message };
  }
  return { ok: true, result: j.result };
}

function applyEnrichment(provider, places) {
  // Editorial summary → description (only set if empty or short)
  if (places.editorial_summary?.overview && (!provider.description || provider.description.length < 50)) {
    provider.description = places.editorial_summary.overview;
  }
  // Opening hours
  if (Array.isArray(places.opening_hours?.weekday_text) && (!provider.opening_hours || provider.opening_hours.length === 0)) {
    provider.opening_hours = places.opening_hours.weekday_text;
  }
  // Website (don't overwrite an existing one)
  if (places.website && !provider.website) {
    provider.website = places.website;
  }
  // Phone (don't overwrite)
  if (places.international_phone_number && !provider.phone) {
    provider.phone = places.international_phone_number;
  }
  // Refresh rating + reviewCount (Google's are most current)
  if (typeof places.rating === "number") {
    provider.rating = places.rating;
  }
  if (typeof places.user_ratings_total === "number") {
    provider.reviewCount = places.user_ratings_total;
  }
  if (places.business_status) {
    provider.business_status = places.business_status;
  }
  return provider;
}

// Group candidates by source file so we write each file once at the end.
const byFile = new Map();
for (const c of candidates) {
  if (!byFile.has(c.file)) {
    byFile.set(c.file, { data: JSON.parse(readFileSync(c.file, "utf8")), changed: [] });
  }
}

let okCount = 0, failCount = 0;
for (const { provider, file } of candidates) {
  const result = await enrichOne(provider);
  if (!result.ok) {
    console.log(`  ✗ ${provider.id}: ${result.reason} ${result.error ?? ""}`);
    failCount++;
    continue;
  }
  // Mutate the loaded data — find the matching entry by id and apply.
  const bundle = byFile.get(file);
  const idx = bundle.data.providers.findIndex(p => p.id === provider.id);
  if (idx >= 0) {
    bundle.data.providers[idx] = applyEnrichment(bundle.data.providers[idx], result.result);
    bundle.changed.push(provider.id);
  }
  enrichedSet.add(provider.id);
  okCount++;
  process.stdout.write(`  ✓ ${provider.id}\n`);
  // Mild throttle — Places allows 10 QPS but we don't need to push.
  await new Promise(r => setTimeout(r, 100));
}

// Write back.
for (const [file, bundle] of byFile) {
  if (bundle.changed.length === 0) continue;
  writeFileSync(file, JSON.stringify(bundle.data, null, 2));
  console.log(`📝 wrote ${bundle.changed.length} updates to ${path.relative(ROOT, file)}`);
}

// Update state.
state.enriched_ids = Array.from(enrichedSet);
state.last_run = new Date().toISOString();
state.total_cost_usd += okCount * 0.022; // best-effort estimate
writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

console.log();
console.log(`✓ enriched: ${okCount}  failed: ${failCount}  est cost: $${(okCount * 0.022).toFixed(2)}  cumulative: $${state.total_cost_usd.toFixed(2)}`);
