import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Build-time version stamp shown in the in-app pill. The runtime constant
// previously hard-coded "2.5.0" so every deploy looked identical even
// though the bundle changed — users saw the update toast fire and "Update"
// but the pill stayed v2.5.0, making it look like nothing happened.
function buildVersionStamp(): string {
  const pkg = JSON.parse(readFileSync(path.resolve(__dirname, "package.json"), "utf8")) as { version?: string };
  const v = pkg.version ?? "0.0.0";
  let sha = "";
  try {
    sha = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    sha = String(Math.floor(Date.now() / 60_000));
  }
  return `${v}-${sha}`;
}

export default defineConfig(() => ({
  define: {
    __BION_BUILD_ID__: JSON.stringify(buildVersionStamp()),
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react({ jsxRuntime: "automatic" })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Pin transpile target so older Safari (14+) parses the bundle.
    // Vite's default (`'modules'` → essentially esnext) ships syntax
    // like top-level await, class private fields, and Array.at() that
    // some Safari versions can't parse — bundle fails to evaluate,
    // React never mounts, user sees a blank page on bionhealth.co.za.
    target: ["es2020", "safari14"],
    rollupOptions: {
      // 🚫 Capacitor native plugins can't run on Vercel's Node.js server.
      // The only Capacitor import in runtime code is a `await import(...)` in
      // auth.ts's signInWithApple, which never fires on web. Externalising it
      // here prevents Rollup from erroring at build time.
      external: [/@capacitor-community\/apple-sign-in/],
      output: {
        manualChunks(id: string) {
          // ── Vendor splits (only large, self-contained libs) ────────────
          if (id.includes("node_modules")) {
            if (id.includes("react-dom") || id.includes("/react/") || id.includes("react-router")) {
              return "vendor-react";
            }
            if (id.includes("framer-motion")) return "vendor-motion";
            if (id.includes("@supabase")) return "vendor-supabase";
            // No catch-all — other node_modules stay with their importing chunk
            // to avoid load-order issues (e.g. libs that call React.createContext
            // at module init must load after React).
          }

          // ── Large data files into their own chunks ─────────────────────
          if (id.includes("bion_johannesburg_data")) return "data-jhb";
          if (id.includes("bion_pretoria_data")) return "data-pta";
          if (id.includes("providerImageUrlsData")) return "data-provider-images";
        },
      },
    },
  },
}));
