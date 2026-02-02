import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("Missing environment variables");
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 1. Fetch all profiles (credits)
        // Using simple pagination loop if needed, but for now getting first 1000 is likely enough for MVP
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, credits");

        if (profilesError) throw profilesError;

        // 2. Fetch all users (emails) from Auth Admin
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({
            perPage: 1000
        });

        if (usersError) throw usersError;

        // 3. Map IDs to Emails
        // 3. Map IDs to Profiles (for easy lookup)
        const profileMap = new Map(profiles.map(p => [p.id, p]));

        // 4. Batch Sync to Resend
        // Step 4.0: Get or Create Audience
        let audienceId = null;
        const audRes = await fetch("https://api.resend.com/audiences", {
            headers: { Authorization: `Bearer ${RESEND_API_KEY}` }
        });

        if (audRes.ok) {
            const audData = await audRes.json();
            const main = audData.data?.find((a: any) => a.name === "Career Match Users");
            if (main) {
                audienceId = main.id;
            } else if (audData.data && audData.data.length > 0) {
                audienceId = audData.data[0].id;
            }
        }

        if (!audienceId) {
            const createAud = await fetch("https://api.resend.com/audiences", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${RESEND_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name: "Career Match Users" })
            });
            const createData = await createAud.json();
            audienceId = createData.id;
        }

        console.log(`Using Audience ID: ${audienceId}`);

        // Step 4.1: Loop Auth Users (Source of Truth) and upsert
        let successCount = 0;
        const errors = [];

        // Process sequentially to respect Resend Rate Limit (2 req/sec)
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        for (const user of users) {
            const profile: any = profileMap.get(user.id);
            // Default credits to 0 if profile missing
            const credits = profile ? profile.credits : 0;

            try {
                const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${RESEND_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: user.email,
                        unsubscribed: false,
                        data: {
                            credits: credits,
                            user_id: user.id
                        }
                    })
                });
                if (res.ok) successCount++;
                else {
                    const err = await res.text();
                    errors.push({ email: user.email, err });
                }
            } catch (e) {
                errors.push({ email: user.email, err: e.message });
            }

            // Wait 500ms between requests (max 2 req/sec)
            await delay(500);
        }

        return new Response(JSON.stringify({
            success: true,
            synced: successCount,
            skipped: 0, // No longer skipping, we sync all Auth users
            total_db_profiles: profiles.length,
            total_auth_users: users.length,
            audience_id: audienceId,
            errors: errors.slice(0, 5)
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
