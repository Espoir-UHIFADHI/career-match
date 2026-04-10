/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Optionnel : scripts / outils locaux uniquement ; la prod utilise les secrets Supabase pour Gemini. */
  readonly VITE_GEMINI_API_KEY?: string;
  /** Comma-separated emails with credit bypass (UI). If omitted, a default dev email applies; set to empty to disable. */
  readonly VITE_ADMIN_EMAILS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
