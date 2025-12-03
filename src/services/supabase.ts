
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL: Missing Supabase environment variables. Please check your .env file or deployment settings.');
}

console.log("Supabase URL:", supabaseUrl); // Debug: Check if URL is loaded

// Fallback to prevent crash if env vars are missing
// This allows the app to load and show a UI, even if auth fails
const validUrl = supabaseUrl || "https://placeholder.supabase.co";
const validKey = supabaseAnonKey || "placeholder-key";

// Debug logging to help identify Vercel issues
console.log("🔍 Supabase Config Check:");
console.log("- VITE_SUPABASE_URL:", supabaseUrl ? "Defined (Starts with " + supabaseUrl.substring(0, 8) + "...)" : "MISSING");
console.log("- VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? "Defined (Length: " + supabaseAnonKey.length + ")" : "MISSING");
console.log("- isSupabaseConfigured:", !!supabaseUrl && !!supabaseAnonKey);

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

export const supabase = createClient(validUrl, validKey);
