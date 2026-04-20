import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
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
