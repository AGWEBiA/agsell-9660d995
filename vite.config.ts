import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    allowedHosts: true,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    minify: "esbuild",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 3000,
    reportCompressedSize: false,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          // React core SEMPRE no mesmo chunk (evita createContext undefined)
          if (/node_modules[\\/](react|react-dom|scheduler|react-is)[\\/]/.test(id)) {
            return "vendor-react";
          }
          if (id.includes("react-router")) {
            return "vendor-router";
          }
          if (id.includes("@radix-ui") || id.includes("lucide-react")) {
            return "vendor-ui";
          }
          if (id.includes("@supabase") || id.includes("@tanstack")) {
            return "vendor-data";
          }
          return "vendor";
        },
      },
    },
  },
}));
