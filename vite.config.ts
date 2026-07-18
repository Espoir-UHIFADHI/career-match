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
            if (id.includes('pdfjs-dist') || id.includes('@react-pdf/renderer')) return 'pdf-vendor';
            if (id.includes('xlsx')) return 'xlsx-vendor';
            if (id.includes('@clerk/clerk-react') || id.includes('@clerk/localizations')) return 'clerk-vendor';
            if (id.includes('@supabase/')) return 'supabase-vendor';
            if (id.includes('@google/generative-ai')) return 'ai-vendor';
            if (id.includes('react') && id.includes('node_modules')) return 'react-vendor';
            if (id.includes('node_modules')) return 'vendor';
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
