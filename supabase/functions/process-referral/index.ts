import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { referrer_id } = await req.json();

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
            throw new Error("Missing environment variables");
        }

        // Initialize Supabase Admin Client
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 1. Get the authenticated user (Referred User) from the request context
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('No authorization header')
        }
        const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

        // Note: getUser with Service Token usually works if passing the JWT properly, 
        // but here we are passing the client's JWT to verify identity.
        // However, we need to create a client with the USER token for auth.
        // Actually simpler: pass the user's JWT to getUser, OR perform getSession.
        // Let's use the standard pattern for verifying user in Edge Functions.
        const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
            global: { headers: { Authorization: authHeader } }
        });
        const { data: { user: authUser }, error: authError } = await userClient.auth.getUser();

        if (authError || !authUser) {
            return new Response(JSON.stringify({ error: "Unauthorized", details: authError }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const new_user_id = authUser.id;

        // 2. Validation
        if (new_user_id === referrer_id) {
            return new Response(JSON.stringify({ success: false, error: "self_referral" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 3. Check for existing referral (Idempotency)
        const { data: existingReferral } = await supabase
            .from('referrals')
            .select('id')
            .eq('referred_user_id', new_user_id)
            .single();

        if (existingReferral) {
            // Already referred, just return success to avoid client error
            return new Response(JSON.stringify({ success: true, message: "already_referred" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 4. Record Referral
        const { error: insertError } = await supabase
            .from('referrals')
            .insert({
                referrer_id: referrer_id,
                referred_user_id: new_user_id,
                status: 'completed',
                completed_at: new Date().toISOString()
            });

        if (insertError) {
            throw new Error("Failed to insert referral: " + insertError.message);
        }

        // 5. Reward Referrer (+3 Credits)
        // Assuming 'profiles' table has 'credits' column.
        // We use 'rpc' call if 'increment' is needed to be atomic, OR simply fetch-and-update.
        // Best practice is RPC 'increment_credits'. But if not exists, we can do manual update for MVP 
        // since concurrency on single user profile is low risk here.
        // Actually, SQL `process_referral` used `update profiles set credits = credits + 3`.
        // We can run that query via an RPC helper OR just direct update if we first read.
        // Let's use the RPC logic if we can, or pure SQL via admin client if we installed pg_net? No.

        // Simplest approach: Read, Add, Update.
        const { data: profile } = await supabase.from('profiles').select('credits').eq('id', referrer_id).single();
        const newCredits = (profile?.credits || 0) + 3;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', referrer_id);

        if (updateError) {
            console.error("Failed to update credits:", updateError);
            // Continue to send email anyway
        }

        // 6. Get Referrer's Email
        // We can't always get email from 'profiles' if it's not stored there.
        // We can use the Admin Auth API to get user by ID.
        const { data: referrerUser, error: referrerError } = await supabase.auth.admin.getUserById(referrer_id);

        if (referrerError || !referrerUser.user || !referrerUser.user.email) {
            console.error("Could not find referrer email:", referrerError);
            return new Response(JSON.stringify({ success: true, warning: "referrer_email_not_found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const referrerEmail = referrerUser.user.email;

        // 7. Send Email via Resend
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Career Match <contact@careermatch.fr>",
                to: [referrerEmail],
                subject: "🎉 Un nouvel inscrit grâce à vous ! (+3 crédits)",
                html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #4f46e5;">Bravo ! 🚀</h1>
                <p>Un ami vient de s'inscrire sur Career Match grâce à votre lien.</p>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #1f2937;">+3 crédits ajoutés à votre compte</p>
                </div>
                <p>Votre solde a été mis à jour automatiquement.</p>
                <p>Continuez à partager votre lien pour gagner plus de crédits !</p>
                <a href="https://careermatch.fr" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Voir mon solde</a>
            </div>
        `,
            }),
        });

        const emailResult = await res.json();
        console.log("Referral email sent:", emailResult);

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Process Referral Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
