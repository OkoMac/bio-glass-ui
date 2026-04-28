#!/usr/bin/env node
/**
 * BION Pricing Drift Detector — frontend scope.
 *
 * Scans every frontend-owned surface (landing pages, onboarding flows,
 * NudgePopup, BookingSheet, cancel modals, Help FAQ, legal Terms) for
 * hardcoded prices that don't match the canonical config in
 * src/config/pricing.ts (which mirrors backend/src/config/pricing.ts).
 *
 * Run:  node scripts/check-pricing-drift.mjs
 * Or:   npm run drift:check
 *
 * Exit codes: 0 = clean, 1 = drift detected.
 *
 * Wire as a Vercel pre-build step (vercel.json `buildCommand`) so any
 * deploy that ships stale pricing fails fast.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const MCQ_DISTRACTOR = /"isCorrect"\s*:\s*false/;

const STALE_RULES = [
  { pattern: /\bR\s*299\b\s*(?:\/|per)\s*(?:mo|month)/gi, name: "Provider Basic R299/mo (REMOVED — use Free or Pro R499)" },
  { pattern: /\bR\s*699\b\s*(?:\/|per)\s*(?:mo|month)/gi, name: "Provider Pro R699/mo (DEPRECATED — canonical is R499)" },
  { pattern: /R\s*59\.\s*80\b/gi,  name: "Ranger commission R59.80 (was 20% of R299 — old)" },
  { pattern: /R\s*139\.\s*80\b/gi, name: "Ranger commission R139.80 (was 20% of R699 — old)" },
  { pattern: /\bR\s*299\b/gi, name: "Bare R299 reference (legacy tier — use R499)", skipIfMcqDistractor: true },
  { pattern: /\bR\s*699\b/gi, name: "Bare R699 reference (legacy tier — use R999)", skipIfMcqDistractor: true },
];

const SCAN_DIRS = [
  "src/pages/landing",
  "src/pages/onboarding",
  "src/pages/legal/Terms.tsx",
  "src/pages/Help.tsx",
  "src/pages/Schedule.tsx",
  "src/components/NudgePopup.tsx",
  "src/components/BookingSheet.tsx",
  "src/components/DeeperDive.tsx",
  // QA audit pass-2 follow-up (2026-04-28): subscription.ts had drifted
  // to R299/R699 ("Basic"/"Pro") while the canonical config was
  // R499/R999 ("Pro"/"Elite"). Drift checker missed it because this
  // path wasn't in scope. Now it is.
  "src/lib/subscription.ts",
  "src/config/pricing.ts",
];

const SKIP_PATTERNS = [/node_modules/, /\.git\//, /dist\//, /build\//];
const FILE_EXTENSIONS = /\.(md|ts|tsx|sql|html)$/;

const shouldSkip = (p) => SKIP_PATTERNS.some(r => r.test(p));

function walkDir(dir, files = []) {
  if (!statSync(dir, { throwIfNoEntry: false })) return files;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (shouldSkip(full)) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) walkDir(full, files);
    else if (FILE_EXTENSIONS.test(full)) files.push(full);
  }
  return files;
}

function collectFiles() {
  const files = [];
  for (const target of SCAN_DIRS) {
    const full = join(ROOT, target);
    if (!statSync(full, { throwIfNoEntry: false })) continue;
    if (statSync(full).isDirectory()) walkDir(full, files);
    else files.push(full);
  }
  return files;
}

function scanFile(filePath) {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const issues = [];
  for (const rule of STALE_RULES) {
    rule.pattern.lastIndex = 0;
    for (const m of content.matchAll(rule.pattern)) {
      const lineNum = content.slice(0, m.index).split("\n").length;
      const lineText = lines[lineNum - 1] ?? "";
      if (rule.skipIfMcqDistractor && MCQ_DISTRACTOR.test(lineText)) continue;
      issues.push({ line: lineNum, match: m[0], rule: rule.name });
    }
  }
  return issues;
}

function main() {
  const files = collectFiles();
  let total = 0;
  const report = {};

  for (const file of files) {
    const issues = scanFile(file);
    if (issues.length === 0) continue;
    report[relative(ROOT, file)] = issues;
    total += issues.length;
  }

  console.log("\n🔍 BION Pricing Drift Detector (frontend)");
  console.log("════════════════════════════════════════════");
  console.log(`Scanned ${files.length} files in ${SCAN_DIRS.length} locations.`);

  if (total === 0) {
    console.log("✅ No drift detected. All pricing matches the canonical config.\n");
    process.exit(0);
  }

  console.log(`⚠️  ${total} stale pricing reference${total > 1 ? "s" : ""} found:\n`);
  for (const [file, issues] of Object.entries(report)) {
    console.log(`📄 ${file}`);
    for (const issue of issues) {
      console.log(`   line ${issue.line}: "${issue.match.trim()}"`);
      console.log(`              → ${issue.rule}`);
    }
    console.log("");
  }
  console.log("Canonical source: src/config/pricing.ts (mirrors backend canonical)");
  console.log("Run sync: edit each file above to match the canonical values.\n");
  process.exit(1);
}

main();
