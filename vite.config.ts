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
        manualChunks: {
          // Core framework — cached across all pages
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // UI libraries
          "vendor-motion": ["framer-motion"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-tanstack": ["@tanstack/react-query"],
          // Radix UI primitives (used by shadcn)
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-popover",
            "@radix-ui/react-accordion",
            "@radix-ui/react-switch",
            "@radix-ui/react-slot",
            "@radix-ui/react-label",
          ],
          // Stripe (only loaded on payment pages)
          "vendor-stripe": ["@stripe/stripe-js", "@stripe/react-stripe-js"],
        },
      },
    },
  },
}));
