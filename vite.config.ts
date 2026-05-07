import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Custom plugin for non-blocking build logging.
// IMPORTANTE: nunca lançar erro aqui — qualquer throw quebra o pipeline de publish.
const buildLogger = (envStatus: { mode: string; command: string; missing: string[] }) => ({
  name: 'build-logger',
  buildStart() {
    console.log(`🚀 Iniciando ${envStatus.command} em modo ${envStatus.mode}...`);
    if (envStatus.command === 'build' && envStatus.missing.length > 0) {
      console.warn(
        `⚠️ Variáveis VITE não detectadas no ambiente do build: ${envStatus.missing.join(', ')}. ` +
        `O build seguirá; o cliente Supabase usa fallback em runtime.`
      );
    }
  },
  async closeBundle() {
    console.log('✅ Build finalizado.');
    try {
      const { execSync } = await import('child_process');
      const size = execSync('du -sh dist').toString().split('\t')[0];
      console.log(`📦 Tamanho total do diretório dist: ${size}`);
    } catch (e) {
      // Ignora erro se du não estiver disponível
    }
  },
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
    chunkSizeWarningLimit: 2000,
    reportCompressedSize: false,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined, // Let Vite handle it to avoid context duplication issues
      },
    },
  },
});
});
