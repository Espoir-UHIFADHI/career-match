
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
    // 1. Only allow POST
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 })
    }

    try {
        const formData = await req.formData()
        const data = Object.fromEntries(formData.entries())
        console.log("🔔 Gumroad Webhook received:", JSON.stringify(data))

        const userId = data['custom_user_id'] as string
        const permalink = data['permalink'] as string

        if (!userId) {
            console.log("⚠️ No User ID found (Test?)")
            return new Response('Missing User ID', { status: 200 })
        }

        let creditsToAdd = 0
        if (permalink?.includes('pack-booster') || permalink === 'ezocca') creditsToAdd = 20
        else if (permalink?.includes('career-coach') || permalink === 'kyhjbx') creditsToAdd = 100

        if (creditsToAdd === 0) return new Response('Product not recognized', { status: 200 })

        // 2. Add Credits securely
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        const { data: profile } = await supabaseAdmin.from('profiles').select('credits').eq('id', userId).single()
        const newBalance = (profile?.credits || 0) + creditsToAdd

        await supabaseAdmin.from('profiles').update({ credits: newBalance, is_premium: true }).eq('id', userId)

        console.log(`✅ Success: +${creditsToAdd} for ${userId} -> ${newBalance}`)
        return new Response(`Credits added: ${newBalance}`, { status: 200 })

    } catch (error) {
        console.error("Webhook Error:", error)
        return new Response(error.message, { status: 500 })
    }
})

