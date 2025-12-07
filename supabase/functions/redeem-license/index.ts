import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { license_key, user_id } = await req.json()

        if (!license_key || !user_id) {
            return new Response(JSON.stringify({ error: 'Missing license_key or user_id' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 1. Initialize Supabase Admin Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // 2. Check if license already used
        const { data: existingLicense } = await supabaseAdmin
            .from('used_licenses')
            .select('id')
            .eq('license_key', license_key)
            .single()

        if (existingLicense) {
            return new Response(JSON.stringify({ error: 'Ce code a déjà été utilisé.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 3. Verify with Gumroad
        // We try known products. If we have many, we might iterate or try to deduce.
        // Major products: 'pack-booster' (20), 'career-coach' (100)

        let verificationData = null
        let validPermalink = ''

        const products = ['pack-booster', 'career-coach']

        for (const permalink of products) {
            console.log(`Verifying against ${permalink}...`)
            const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_permalink: permalink,
                    license_key: license_key
                })
            })

            const data = await response.json()
            if (data.success && !data.purchase.refunded && !data.purchase.chargebacked) {
                verificationData = data
                validPermalink = permalink
                break
            }
        }

        if (!verificationData) {
            return new Response(JSON.stringify({ error: 'Code invalide ou expiré.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 4. Determine Credits
        let creditsToAdd = 0
        if (validPermalink === 'pack-booster') creditsToAdd = 20
        if (validPermalink === 'career-coach') creditsToAdd = 100

        if (creditsToAdd === 0) {
            // Fallback or error if permalink matched but no credits defined (unlikely)
            return new Response(JSON.stringify({ error: 'Produit non reconnu pour les crédits.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 5. Atomic Transaction: Record usage + Add Credits
        // We do them sequentially, if one fails we monitor. Ideally use RPC for atomicity, but JS logic is fine for now if we insert first.

        // A. Insert usage
        const { error: insertError } = await supabaseAdmin.from('used_licenses').insert({
            license_key: license_key,
            user_id: user_id,
            product_permalink: validPermalink,
            variant: verificationData.purchase.variants || ''
        })

        if (insertError) {
            throw insertError
        }

        // B. Add Credits (using profile RPC or Upsert)
        // We reuse the logic from webhook: fetch -> add -> upsert
        const { data: profile } = await supabaseAdmin.from('profiles').select('credits').eq('id', user_id).single()
        const newBalance = (profile?.credits || 0) + creditsToAdd

        const { error: updateError } = await supabaseAdmin.from('profiles').upsert({
            id: user_id,
            credits: newBalance
        })

        if (updateError) throw updateError

        console.log(`✅ License redeemed: ${license_key} for ${user_id} (+${creditsToAdd})`)

        return new Response(JSON.stringify({
            success: true,
            creditsAdded: creditsToAdd,
            newBalance: newBalance,
            product: validPermalink
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error("Redeem Error:", error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
