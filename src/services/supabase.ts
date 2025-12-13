
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL: Missing Supabase environment variables. Please check your .env file or deployment settings.');
}

// Logs removed for security

// Fallback to prevent crash if env vars are missing
// This allows the app to load and show a UI, even if auth fails
const validUrl = supabaseUrl || "https://placeholder.supabase.co";
const validKey = supabaseAnonKey || "placeholder-key";

// Config check removed

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

export const supabase = createClient(validUrl, validKey);

export const createClerkSupabaseClient = (clerkToken: string) => {
    return createClient(validUrl, validKey, {
        global: {
            headers: {
                Authorization: `Bearer ${clerkToken}`,
            },
        },
    });
};
