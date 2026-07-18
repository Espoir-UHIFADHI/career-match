import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Fonction keep-alive — appelée toutes les 48h par pg_cron
// Effectue une requête légère sur la base pour maintenir le projet Supabase actif
// et éviter la mise en pause automatique du plan gratuit.

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Requête minimale — lit 1 ligne de profiles pour maintenir la connexion active
  const { error } = await supabase
    .from("profiles")
    .select("id")
    .limit(1);

  const status = error ? "error" : "ok";
  const ts = new Date().toISOString();

  return new Response(
    JSON.stringify({ status, ts, error: error?.message ?? null }),
    { headers: { "Content-Type": "application/json" }, status: 200 }
  );
});
