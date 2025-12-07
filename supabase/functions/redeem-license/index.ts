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
                status: 200,
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
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 3. Verify with Gumroad
        let verificationData = null
        let validPermalink = ''

        // ID for pack-booster retrieved from error logs: JaME0YDDkp7O5KZd31sBxg==
        // FIXED: The 4th character is a ZERO ('0'), not the letter 'O'.
        const productIds: Record<string, string> = {
            'pack-booster': 'JaME0YDDkp7O5KZd31sBxg==',
            'career-coach': 'X3PD34MHCfnQjE2qgpkycg==', // Updated ID for 100 credits pack
            'career-match': 'JaME0YDDkp7O5KZd31sBxg==', // Default parent to pack-booster ID
            'careermatch': 'JaME0YDDkp7O5KZd31sBxg==',
            'uhifadhi': 'JaME0YDDkp7O5KZd31sBxg=='
        }

        // Expanded list of potential permalinks to check
        const products = [
            ...Object.keys(productIds),
            'career-match',
            'careermatch',
            'career-match-app',
            'uhifadhi'
        ]
        const debugLogs: string[] = []

        // Sanitize Key
        const cleanKey = license_key.trim()
        console.log(`Received Key: ${cleanKey.substring(0, 4)}... (Length: ${cleanKey.length})`)

        for (const permalink of products) {
            const rawId = productIds[permalink]?.trim()
            let found = false

            // Strategy Group A: ID-based Variations (Only if we have an ID)
            if (rawId) {
                const idVariants = [
                    { name: 'Standard', id: rawId, uses: undefined },
                    { name: 'NoPadding', id: rawId.replace(/=+$/, ''), uses: undefined },
                    { name: 'NoIncrement', id: rawId, uses: "false" }
                ]

                for (const variant of idVariants) {
                    if (found) break; // Stop if already found in inner loop

                    try {
                        const payload: any = {
                            product_id: variant.id,
                            license_key: cleanKey
                        }
                        if (variant.uses) payload.increment_uses_count = variant.uses

                        const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        })
                        const data = await response.json()

                        const logKey = `[${permalink}][${variant.name}]`
                        debugLogs.push(`${logKey}: ${data.success} (${data.message || 'N/A'})`);

                        if (data.success && !data.purchase.refunded && !data.purchase.chargebacked) {
                            verificationData = data
                            validPermalink = permalink
                            found = true
                            break
                        }
                    } catch (err) {
                        debugLogs.push(`[${permalink}][${variant.name}]: Err (${err.message})`)
                    }
                }
            }

            if (found) break; // Stop outer loop

            // Fallback: Link Strategy (just to log it)
            try {
                const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        product_permalink: permalink,
                        license_key: cleanKey
                    })
                })
                const data = await response.json()
                if (!data.success) {
                    debugLogs.push(`[${permalink}][Link]: ${data.success} (${data.message || 'N/A'})`);
                }
                if (data.success && !data.purchase.refunded && !data.purchase.chargebacked) {
                    verificationData = data
                    validPermalink = permalink
                    break
                }
            } catch (err) {
                debugLogs.push(`[${permalink}][Link]: Err (${err.message})`)
            }
        }

        if (!verificationData) {
            return new Response(JSON.stringify({ error: `Echec validation. Détails: ${debugLogs.join(', ')}` }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 4. Determine Credits
        let creditsToAdd = 0
        const variantName = verificationData.purchase.variants || ''

        if (validPermalink === 'pack-booster') creditsToAdd = 20
        if (validPermalink === 'career-coach') creditsToAdd = 100

        // Variant match (if permalink is generic like 'career-match')
        if (creditsToAdd === 0) {
            if (variantName.includes('Booster') || variantName.includes('20')) creditsToAdd = 20
            if (variantName.includes('Coach') || variantName.includes('100')) creditsToAdd = 100

            // Fallback for generic 'career-match' if no variant text matches but it verified
            if (creditsToAdd === 0 && (validPermalink === 'career-match' || validPermalink === 'uhifadhi')) {
                creditsToAdd = 20 // Default safe assumption
            }
        }

        if (creditsToAdd === 0) {
            return new Response(JSON.stringify({ error: `Produit vérifié (${validPermalink}) mais crédits indéterminés. Variant: ${variantName}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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
        // RETURN 200 to ensure the client receives the error message body
        return new Response(JSON.stringify({ error: `Server Error: ${error.message}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }
})
