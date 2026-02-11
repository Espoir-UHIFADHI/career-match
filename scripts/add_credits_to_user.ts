
import fs from 'fs';
import path from 'path';
import { createClient } from "@supabase/supabase-js";

async function addCredits() {
    try {
        console.log("🚀 Starting Add Credits Script...");

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

        const SUPABASE_URL = getEnv("VITE_SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");
        const CLERK_SECRET_KEY = getEnv("CLERK_SECRET_KEY");

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !CLERK_SECRET_KEY) {
            console.error("❌ Missing environment variables in .env");
            return;
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const targetEmail = "dorcaselisekinnou@gmail.com";
        console.log(`🔍 Looking for user with email: ${targetEmail}`);

        // 2. Fetch Users from Clerk to find the ID
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
        const user = clerkUsers.find((u: any) =>
            u.email_addresses.some((e: any) => e.email_address === targetEmail)
        );

        if (!user) {
            console.error(`❌ User not found in Clerk with email: ${targetEmail}`);
            // Check if there are more than 500 users? 
            // For now, assuming <500 users.
            return;
        }

        const userId = user.id;
        console.log(`✅ Found User ID: ${userId}`);

        // 3. Get current credits
        const { data: profile, error: fetchError } = await supabase
            .from("profiles")
            .select("credits")
            .eq("id", userId)
            .single();

        if (fetchError) {
            console.error("❌ Error fetching profile:", fetchError.message);
            // If profile doesn't exist, maybe create it? 
            // But usually it should exist if they signed up.
            return;
        }

        const currentCredits = profile ? profile.credits : 0;
        const newCredits = currentCredits + 100;

        console.log(`   Current Credits: ${currentCredits}`);
        console.log(`   Adding 100 credits...`);

        // 4. Update credits
        const { error: updateError } = await supabase
            .from("profiles")
            .update({ credits: newCredits })
            .eq("id", userId);

        if (updateError) {
            console.error("❌ Error updating credits:", updateError.message);
        } else {
            console.log(`✅ Successfully updated credits to ${newCredits}`);
        }

    } catch (e: any) {
        console.error("FATAL:", e.message);
    }
}

addCredits();
