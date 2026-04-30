#!/usr/bin/env node
/**
 * Postbuild: stamp the service worker with a per-deploy build ID.
 *
 * The browser only treats a service worker as "new" when its bytes
 * differ from the cached one. If we ship app changes without touching
 * /sw.js, users keep the old assets in cache forever. This script
 * replaces the __BION_BUILD__ placeholder in dist/sw.js with a hash
 * derived from package.json version + current git short SHA + epoch
 * minute, guaranteeing every deploy produces a different SW.
 *
 * Run automatically via the `build` script in package.json:
 *   "build": "vite build && node scripts/inject-sw-version.mjs"
 *
 * If running outside git (e.g. CI without history), falls back to
 * version + timestamp so deploys still differ.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SW_PATH = join(ROOT, "dist", "sw.js");

if (!existsSync(SW_PATH)) {
  console.error("[sw-version] dist/sw.js not found — run after `vite build`.");
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const version = pkg.version ?? "0.0.0";

let sha = "nogit";
try {
  sha = execSync("git rev-parse --short HEAD", { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] })
    .toString()
    .trim();
} catch {
  // Not a git checkout (e.g. some CI environments) — degrade to timestamp.
  sha = String(Math.floor(Date.now() / 60_000));
}

const buildId = `${version}-${sha}`;
const sw = readFileSync(SW_PATH, "utf8");

if (!sw.includes("__BION_BUILD__")) {
  console.error("[sw-version] __BION_BUILD__ placeholder missing from sw.js — refusing to ship a non-versioned SW.");
  process.exit(1);
}

const stamped = sw.replaceAll("__BION_BUILD__", buildId);
writeFileSync(SW_PATH, stamped);
console.log(`[sw-version] stamped dist/sw.js with build ID: ${buildId}`);
