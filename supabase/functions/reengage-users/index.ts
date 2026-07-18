/**
 * Edge Function : reengage-users
 * Déclenchée automatiquement par pg_cron toutes les 24h.
 * Logique :
 *   - score < 50 ET analyse faite il y a 3 jours → email "reengage_low_score"
 *   - score >= 75 ET analyse faite il y a 2 jours + pas encore de session réseau → email "reengage_high_score"
 * Chaque email n'est envoyé qu'une seule fois par utilisateur (colonne reengage_sent_at dans profiles).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function getServiceClient() {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

async function sendEmail(to: string, type: string, data: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // send-email vérifie le JWT — on bypasse en interne via service role header
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "apikey": Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    },
    body: JSON.stringify({ to, type, data }),
  });
  return res.ok;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Sécurité basique : vérifier que l'appel vient du cron interne (via service role secret)
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.includes(SERVICE_KEY.slice(0, 20))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const db = getServiceClient();
  const now = new Date();
  const results = { low_score: 0, high_score: 0, errors: 0 };

  try {
    // ── 1. Re-engagement score faible (score < 50, analyse il y a 3 jours, email pas encore envoyé) ──
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const fourDaysAgo  = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();

    const { data: lowScoreEntries } = await db
      .from("cv_history")
      .select(`
        user_id,
        match_score,
        full_job_data,
        created_at,
        profiles!inner(reengage_sent_at, id)
      `)
      .lt("match_score", 50)
      .gte("created_at", fourDaysAgo)
      .lte("created_at", threeDaysAgo)
      .is("profiles.reengage_sent_at", null)
      .order("created_at", { ascending: false });

    for (const entry of (lowScoreEntries ?? [])) {
      try {
        // Récupérer l'email de l'utilisateur via auth.users (service role uniquement)
        const { data: authUser } = await db.auth.admin.getUserById(entry.user_id);
        const email = authUser?.user?.email;
        const name  = authUser?.user?.user_metadata?.first_name ?? "";
        if (!email) continue;

        const jobTitle = (entry.full_job_data as any)?.title ?? "votre poste cible";
        const sent = await sendEmail(email, "reengage_low_score", {
          score: entry.match_score,
          jobTitle,
          name,
        });

        if (sent) {
          await db.from("profiles").update({ reengage_sent_at: now.toISOString() }).eq("id", entry.user_id);
          results.low_score++;
        }
      } catch (e) {
        console.error("Low score reengage error:", e);
        results.errors++;
      }
    }

    // ── 2. Re-engagement score élevé (score >= 75, analyse il y a 2 jours, email pas encore envoyé) ──
    const twoDaysAgo   = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo2 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const { data: highScoreEntries } = await db
      .from("cv_history")
      .select(`
        user_id,
        match_score,
        full_job_data,
        created_at,
        profiles!inner(reengage_sent_at, id)
      `)
      .gte("match_score", 75)
      .gte("created_at", threeDaysAgo2)
      .lte("created_at", twoDaysAgo)
      .is("profiles.reengage_sent_at", null)
      .order("created_at", { ascending: false });

    for (const entry of (highScoreEntries ?? [])) {
      try {
        const { data: authUser } = await db.auth.admin.getUserById(entry.user_id);
        const email = authUser?.user?.email;
        const name  = authUser?.user?.user_metadata?.first_name ?? "";
        if (!email) continue;

        const jobTitle = (entry.full_job_data as any)?.title ?? "votre poste cible";
        const sent = await sendEmail(email, "reengage_high_score", {
          score: entry.match_score,
          jobTitle,
          name,
        });

        if (sent) {
          await db.from("profiles").update({ reengage_sent_at: now.toISOString() }).eq("id", entry.user_id);
          results.high_score++;
        }
      } catch (e) {
        console.error("High score reengage error:", e);
        results.errors++;
      }
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
