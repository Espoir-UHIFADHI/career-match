
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
    // 1. Method verification
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 })
    }

    try {
        // 2. Fetch data from Gumroad
        const formData = await req.formData()
        const data = Object.fromEntries(formData.entries())

        console.log("🔔 Gumroad Webhook received:", data)

        // 3. Extract critical info
        // Gumroad sends custom fields as 'custom_user_id' if passed in the URL
        // We expect the link to be: https://gumroad.com/l/xxx?custom_user_id=CLK_123
        const userId = data['custom_user_id'] as string
        const resourceName = data['resource_name'] as string
        const permalink = data['permalink'] as string // The product slug

        if (!userId) {
            console.error("❌ No user_id found in webhook")
            return new Response('Missing custom_user_id', { status: 400 })
        }

        // 4. Determine credits to add
        let creditsToAdd = 0
        let isPremium = false

        // Using the real slugs from the Gumroad products created by the user
        // Pack Booster (20 credits) -> https://careermatch.gumroad.com/l/pack-booster
        // Career Coach (100 credits) -> https://careermatch.gumroad.com/l/career-coach

        if (permalink === 'pack-booster' || permalink === 'ezocca') { // 'ezocca' was the ID in previous screenshot, supporting both just in case
            creditsToAdd = 20
            isPremium = true
            console.log("✅ Product identified: Pack Booster (20 credits)")
        } else if (permalink === 'career-coach' || permalink === 'kyhjbx') {
            creditsToAdd = 100
            isPremium = true
            console.log("✅ Product identified: Career Coach (100 credits)")
        } else {
            console.warn(`⚠️ Unknown permalink: ${permalink}. Defaulting to 0 credits.`)
            // Safe default: don't add credits for unknown products
            creditsToAdd = 0
        }

        if (creditsToAdd === 0) {
            return new Response('No credits to add for this product', { status: 200 })
        }

        // 5. Connect to Supabase with ADMIN rights (Service Role)
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error("❌ Missing Supabase Environment Variables")
            return new Response('Server Configuration Error', { status: 500 })
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // 6. Update user balance (Atomic increment via RPC is better, but this works for now)
        // First, get current credits
        const { data: profile, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single()

        if (fetchError) {
            console.error("❌ Error fetching user profile:", fetchError)
            throw fetchError
        }

        const newBalance = (profile?.credits || 0) + creditsToAdd

        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
                credits: newBalance,
                is_premium: true // Upgrade user status
            })
            .eq('id', userId)

        if (updateError) {
            console.error("❌ Error updating credits:", updateError)
            throw updateError
        }

        console.log(`✅ Success: ${creditsToAdd} credits added to ${userId}. New balance: ${newBalance}`)

        return new Response(JSON.stringify({ success: true, new_balance: newBalance }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        })

    } catch (error) {
        console.error("❌ Webhook Error:", error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
