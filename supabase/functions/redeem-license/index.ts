import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type GumroadVerification = {
    success?: boolean
    message?: string
    purchase?: {
        id?: string
        refunded?: boolean
        chargebacked?: boolean
        variants?: string
    }
}

const gumroadProducts = [
    {
        label: 'career-coach',
        credits: 100,
        productId: 'X3PD34MHCfnQjE2qgpkycg==',
        permalinks: ['career-coach', 'kyhjbx'],
    },
    {
        label: 'pack-booster',
        credits: 20,
        productId: 'JaME0YDDkp7O5KZd31sBxg==',
        permalinks: ['pack-booster', 'ezocca'],
    },
]

async function getAuthenticatedUserId(req: Request): Promise<string> {
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) throw new Error('Missing bearer token')

    const url = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    if (!url || !anonKey) throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY')

    const payloadPart = token.split('.')[1]
    if (!payloadPart) throw new Error('Invalid bearer token')

    const payload = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'))) as {
        sub?: string
        exp?: number
    }

    if (!payload.sub) throw new Error('Invalid bearer token')
    if (payload.exp && payload.exp * 1000 < Date.now()) throw new Error('Expired bearer token')

    const client = createClient(url, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { error } = await client.rpc('get_user_credits', { p_user_id: payload.sub })
    if (error) throw new Error('Invalid or expired bearer token')

    return payload.sub
}

async function verifyGumroadLicense(params: Record<string, string>): Promise<GumroadVerification> {
    const body = new URLSearchParams({
        ...params,
        increment_uses_count: 'false',
    })

    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    })

    const text = await response.text()
    try {
        return JSON.parse(text)
    } catch {
        return {
            success: false,
            message: `Gumroad returned ${response.status}: ${text.slice(0, 120)}`,
        }
    }
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const user_id = await getAuthenticatedUserId(req)
        const { license_key } = await req.json()

        if (!license_key) {
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
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 3. Verify with Gumroad
        let verificationData: GumroadVerification | null = null
        let validProduct = ''
        let creditsToAdd = 0
        const debugLogs: string[] = []

        // Sanitize Key
        const cleanKey = String(license_key).trim().replace(/[‐‑‒–—−]/g, '-').toUpperCase()
        console.log(`Received Key: ${cleanKey.substring(0, 4)}... (Length: ${cleanKey.length})`)

        for (const product of gumroadProducts) {
            const checks = [{ label: `${product.label}:id`, params: { product_id: product.productId, license_key: cleanKey } }]

            for (const check of checks) {
                const data = await verifyGumroadLicense(check.params)
                debugLogs.push(`${check.label}: ${data.success === true} (${data.message || 'N/A'})`)

                if (data.success && data.purchase && !data.purchase.refunded && !data.purchase.chargebacked) {
                    verificationData = data
                    validProduct = product.label
                    creditsToAdd = product.credits
                    break
                }
            }

            if (verificationData) break
        }

        if (!verificationData) {
            return new Response(JSON.stringify({ error: `Code licence non reconnu par Gumroad pour les produits configurés. Détails: ${debugLogs.join(', ')}` }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const { data: newBalance, error: grantError } = await supabaseAdmin.rpc('grant_user_credits_once', {
            p_user_id: user_id,
            p_amount: creditsToAdd,
            p_source: 'gumroad-license',
            p_reference: cleanKey,
            p_meta: {
                product: validProduct,
                variant: verificationData.purchase.variants || '',
                gumroad_purchase_id: verificationData.purchase.id || null,
            }
        })

        if (grantError) throw grantError

        await supabaseAdmin.from('used_licenses').upsert({
            license_key: cleanKey,
            user_id,
            product_permalink: validProduct,
            variant: verificationData.purchase.variants || ''
        }, { onConflict: 'license_key' })

        console.log(`✅ License redeemed: ${cleanKey.substring(0, 4)}... for ${user_id} (+${creditsToAdd})`)

        return new Response(JSON.stringify({
            success: true,
            creditsAdded: creditsToAdd,
            newBalance: newBalance,
            product: validProduct
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })


    } catch (error) {
        console.error("Redeem Error:", error)
        return new Response(JSON.stringify({ error: `Server Error: ${error.message}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
