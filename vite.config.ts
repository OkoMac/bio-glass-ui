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
          // ── Vendor splits ──────────────────────────────────────────────
          if (id.includes("node_modules")) {
            if (id.includes("react-dom") || id.includes("/react/") || id.includes("react-router")) {
              return "vendor-react";
            }
            if (id.includes("framer-motion")) return "vendor-motion";
            if (id.includes("@supabase")) return "vendor-supabase";
            if (id.includes("@tanstack")) return "vendor-tanstack";
            if (id.includes("@radix-ui")) return "vendor-radix";
            if (id.includes("@stripe")) return "vendor-stripe";
            if (id.includes("lucide-react")) return "vendor-icons";
            // Catch-all for remaining node_modules — prevents them leaking into main chunk
            return "vendor-misc";
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
