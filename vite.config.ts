import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Bibliothèques lourdes vraiment isolées — pas de dépendances circulaires possibles
            if (id.includes('pdfjs-dist') || id.includes('@react-pdf/renderer')) return 'pdf-vendor';
            if (id.includes('xlsx')) return 'xlsx-vendor';
            // React et toutes ses dépendances (react-dom, react-router, lucide, clerk)
            // restent dans le bundle principal — les séparer crée des TDZ errors au runtime
          },
        },
      },
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY),
    },
  }
})
