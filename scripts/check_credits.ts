
import fs from 'fs';
import path from 'path';
import { createClient } from "@supabase/supabase-js";

async function checkCredits() {
    try {
        console.log("🔍 Checking Credits...");

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

        const SUPABASE_URL = getEnv("VITE_SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");
        const CLERK_SECRET_KEY = getEnv("CLERK_SECRET_KEY");

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !CLERK_SECRET_KEY) {
            console.error("❌ Missing environment variables");
            return;
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const targetEmail = "dorcaselisekinnou@gmail.com";

        const clerkRes = await fetch("https://api.clerk.com/v1/users?limit=500", {
            headers: {
                "Authorization": `Bearer ${CLERK_SECRET_KEY}`,
                "Content-Type": "application/json"
            }
        });

        if (!clerkRes.ok) {
            console.error("❌ Clerk API Error");
            return;
        }

        const clerkUsers = await clerkRes.json();
        const user = clerkUsers.find((u: any) =>
            u.email_addresses.some((e: any) => e.email_address === targetEmail)
        );

        if (!user) {
            console.error(`❌ User not found: ${targetEmail}`);
            return;
        }

        const userId = user.id;

        const { data: profile, error: fetchError } = await supabase
            .from("profiles")
            .select("credits")
            .eq("id", userId)
            .single();

        if (fetchError) {
            console.error("❌ Error fetching profile:", fetchError.message);
            return;
        }

        console.log(`✅ Current Credits for ${targetEmail}: ${profile.credits}`);

    } catch (e: any) {
        console.error("FATAL:", e.message);
    }
}

checkCredits();
