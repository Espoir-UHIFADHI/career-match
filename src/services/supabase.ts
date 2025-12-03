
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL: Missing Supabase environment variables. Please check your .env file or deployment settings.');
}

console.log("Supabase URL:", supabaseUrl); // Debug: Check if URL is loaded
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
