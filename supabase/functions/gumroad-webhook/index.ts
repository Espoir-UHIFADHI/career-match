
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

function assertWebhookSecret(req: Request, data: Record<string, FormDataEntryValue>) {
    const expected = Deno.env.get('GUMROAD_WEBHOOK_SECRET')
    if (!expected) throw new Error('Missing GUMROAD_WEBHOOK_SECRET')

    const provided =
        req.headers.get('x-career-match-webhook-secret') ||
        req.headers.get('x-webhook-secret') ||
        String(data['webhook_secret'] || '')

    if (provided !== expected) {
        throw new Error('Invalid webhook secret')
    }
}

serve(async (req) => {
    // 1. Only allow POST
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 })
    }

    try {
        const formData = await req.formData()
        const data = Object.fromEntries(formData.entries())
        assertWebhookSecret(req, data)

        const userId = data['custom_user_id'] as string
        const permalink = data['permalink'] as string
        const reference = String(data['sale_id'] || data['order_number'] || data['license_key'] || '')

        if (!userId) {
            console.log("⚠️ No User ID found (Test?)")
            return new Response('Missing User ID', { status: 200 })
        }

        if (!reference) {
            return new Response('Missing purchase reference', { status: 400 })
        }

        let creditsToAdd = 0
        if (permalink?.includes('pack-booster') || permalink === 'ezocca') creditsToAdd = 20
        else if (permalink?.includes('career-coach') || permalink === 'kyhjbx') creditsToAdd = 100

        if (creditsToAdd === 0) return new Response('Product not recognized', { status: 200 })

        // 2. Add Credits securely
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        const { data: newBalance, error: grantError } = await supabaseAdmin.rpc('grant_user_credits_once', {
            p_user_id: userId,
            p_amount: creditsToAdd,
            p_source: 'gumroad-webhook',
            p_reference: reference,
            p_meta: {
                permalink,
                email: data['email'] || null,
                product_name: data['product_name'] || null,
            }
        })

        if (grantError) throw grantError

        console.log(`✅ Gumroad credits processed: +${creditsToAdd} for ${userId} -> ${newBalance}`)
        return new Response(`Credits added: ${newBalance}`, { status: 200 })

    } catch (error) {
        console.error("Webhook Error:", error)
        const message = error instanceof Error ? error.message : String(error)
        return new Response(message, { status: 500 })
    }
})

