
import fs from 'fs';
import path from 'path';
import { createClient } from "@supabase/supabase-js";

async function sync() {
    try {
        // 1. Load Environment Variables manually
        const envPath = path.join(process.cwd(), '.env');
        if (!fs.existsSync(envPath)) {
            console.error("❌ .env file not found");
            return;
        }
        const envContent = fs.readFileSync(envPath, 'utf-8');

        const getEnv = (key: string) => {
            const match = envContent.match(new RegExp(`${key}=["']?([^"']+)["']?`));
            return match ? match[1].trim() : null;
        };

        const RESEND_API_KEY = getEnv("RESEND_API_KEY");
        const SUPABASE_URL = getEnv("VITE_SUPABASE_URL");
        const SUPABASE_ANON_KEY = getEnv("VITE_SUPABASE_ANON_KEY");
        const SUPABASE_SERVICE_ROLE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");
        const CLERK_SECRET_KEY = getEnv("CLERK_SECRET_KEY");

        // Prefer Service Role Key for Admin Access (Bypass RLS), otherwise fall back to Anon
        const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

        if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_KEY || !CLERK_SECRET_KEY) {
            console.error("❌ Missing environment variables in .env");
            console.log({
                HAS_RESEND_KEY: !!RESEND_API_KEY,
                HAS_SUPABASE_URL: !!SUPABASE_URL,
                HAS_SUPABASE_KEY: !!SUPABASE_KEY,
                HAS_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY,
                HAS_CLERK_KEY: !!CLERK_SECRET_KEY
            });
            if (!SUPABASE_SERVICE_ROLE_KEY) console.warn("⚠️  Hint: You might need SUPABASE_SERVICE_ROLE_KEY to see all profiles.");
            return;
        }

        console.log("🚀 Starting Sync (Local Mode)...");
        console.log("   - Supabase:", SUPABASE_URL);
        console.log("   - Using Key:", SUPABASE_SERVICE_ROLE_KEY ? "Service Role (Admin)" : "Anon (Public)");

        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // 2. Fetch Profiles from Supabase
        console.log("📥 Fetching Profiles...");
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, credits");

        if (profilesError) {
            console.error("❌ Error fetching profiles:", profilesError.message);
        } else {
            console.log(`   ✅ Got ${profiles?.length || 0} profiles`);
        }

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

        // 3. Fetch Users from Clerk
        console.log("📥 Fetching Clerk Users...");
        const clerkRes = await fetch("https://api.clerk.com/v1/users?limit=500", {
            headers: {
                "Authorization": `Bearer ${CLERK_SECRET_KEY}`,
                "Content-Type": "application/json"
            }
        });

        if (!clerkRes.ok) {
            console.error("❌ Clerk API Error:", await clerkRes.text());
            return;
        }

        const clerkUsers = await clerkRes.json();
        console.log(`   ✅ Got ${clerkUsers.length} users from Clerk`);

        // 4. Setup Resend Audience
        console.log("⚙️  Checking Resend Audience...");
        let audienceId = null;
        const audRes = await fetch("https://api.resend.com/audiences", {
            headers: { Authorization: `Bearer ${RESEND_API_KEY}` }
        });

        if (audRes.ok) {
            const audData = await audRes.json();
            const main = audData.data?.find((a: any) => a.name === "Career Match Users");
            if (main) audienceId = main.id;
            else if (audData.data?.length > 0) audienceId = audData.data[0].id;
        }

        if (!audienceId) {
            console.log("   - Creating new Audience...");
            const createRes = await fetch("https://api.resend.com/audiences", {
                method: "POST",
                headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({ name: "Career Match Users" })
            });
            const createData = await createRes.json();
            audienceId = createData.id;
        }
        console.log(`   ✅ Audience ID: ${audienceId}`);

        // 5. Sync Loop
        console.log("🔄 Syncing Contacts...");
        let synced = 0;
        let errors = 0;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        for (const user of clerkUsers) {
            const primary = user.email_addresses.find((e: any) => e.id === user.primary_email_address_id);
            const email = primary ? primary.email_address : user.email_addresses[0]?.email_address;

            if (!email) continue;

            // Normalize Profile ID check for Clerk ID
            const profile: any = profileMap.get(user.id);
            const credits = profile ? profile.credits : 0; // Default to 0 if not found

            process.stdout.write(`   👉 ${email} (Credits: ${credits})... `);

            try {
                const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${RESEND_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        unsubscribed: false,
                        data: {
                            credits: credits,
                            user_id: user.id
                        }
                    })
                });

                if (res.ok) {
                    process.stdout.write("✅ OK\n");
                    synced++;
                } else {
                    const txt = await res.text();
                    process.stdout.write(`❌ ERR\n`);
                    errors++;
                }
            } catch (e: any) {
                process.stdout.write(`❌ EXC\n`);
                errors++;
            }

            await delay(500); // 2 req/sec limit
        }

        console.log("\n🏁 Synchronization Complete!");
        console.log(`   Synced: ${synced}`);
        console.log(`   Errors: ${errors}`);

    } catch (e: any) {
        console.error("FATAL:", e.message);
    }
}

sync();
