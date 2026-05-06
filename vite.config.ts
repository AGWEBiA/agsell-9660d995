import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Custom plugin for detailed build logging
const buildLogger = (envStatus: { mode: string; command: string; missing: string[] }) => ({
  name: 'build-logger',
  buildStart() {
    console.log(`🚀 Iniciando ${envStatus.command} em modo ${envStatus.mode}...`);
    if (envStatus.command === 'build') {
      if (envStatus.missing.length > 0) {
        throw new Error(`Variáveis VITE ausentes no build: ${envStatus.missing.join(', ')}`);
      }
      console.log('🔐 Variáveis VITE obrigatórias encontradas para o build.');
    }
  },
  resolveId(source) {
    if (source.includes('jspdf') || source.includes('recharts')) {
      // Log heavy dependencies when they are resolved
    }
    return null;
  },
  generateBundle(options, bundle) {
    console.log('📦 Bundle gerado. Analisando arquivos...');
    const chunks = Object.values(bundle).filter(b => b.type === 'chunk');
    chunks.sort((a, b) => (b as any).code.length - (a as any).code.length);
    console.log('Top 5 maiores chunks:');
    chunks.slice(0, 5).forEach(chunk => {
      console.log(` - ${chunk.fileName}: ${(chunk as any).code.length / 1024} KB`);
    });
  },
  closeBundle() {
    console.log('✅ Build finalizado com sucesso!');
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const requiredEnv = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'];
  const missing = requiredEnv.filter((key) => !env[key] && !process.env[key]);

  return ({
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
    buildLogger({ mode, command, missing }),
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
    chunkSizeWarningLimit: 800, // Reduced warning limit to encourage smaller chunks
    reportCompressedSize: true, // Re-enabled to see sizes in logs
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-core';
            }
            if (id.includes('@radix-ui') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-pdf';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('zod') || id.includes('react-hook-form')) {
              return 'vendor-forms';
            }
            if (id.includes('date-fns') || id.includes('lodash')) {
              return 'vendor-utils';
            }
            return 'vendor-others';
          }
          // Split large pages/components
          if (id.includes('/pages/Inbox/')) return 'page-inbox';
          if (id.includes('/pages/Dashboard/')) return 'page-dashboard';
          if (id.includes('/pages/Admin/')) return 'page-admin';
          if (id.includes('/components/flow-builder/')) return 'comp-flowbuilder';
        },
      },
    },
  },
});
});
