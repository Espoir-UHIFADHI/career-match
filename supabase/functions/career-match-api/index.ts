
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
    // Handle CORS Preflight completely
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    try {
        // 1. Verify User Authentication (JWT)
        // 1. Verify User Authentication (JWT)
        // We use the token to query the DB. If the token is valid (signed by Clerk and accepted by Supabase config),
        // RLS will allow us to read our own profile.
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Decode JWT to get User ID (sub) without verifying signature yet (the DB query will verify it via RLS/Auth)
        // Decode JWT to get User ID (sub) without verifying signature yet (the DB query will verify it via RLS/Auth)
        const authHeader = req.headers.get('Authorization')!;
        const token = authHeader.replace('Bearer ', '');
        const authPayload = JSON.parse(atob(token.split('.')[1]));
        const userId = authPayload.sub;

        // Verify validity by trying to fetch the user's profile
        // If the token is invalid or signature wrong, this query will fail (401 from PostgREST) or return null
        const { data: profile, error: authError } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .single();

        if (authError || !profile) {
            console.error("Auth Failed:", authError);
            return new Response(JSON.stringify({ error: 'Unauthorized', details: authError }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        const user = { id: userId }; // Mock user object for downstream use

        // 2. Parse Request
        const { action, payload } = await req.json()
        console.log(`🚀 API Request: ${action} by ${user.id}`)

        // 3. Handle Actions
        if (action === 'gemini-generate') {
            return await handleGeminiGenerate(payload)
        } else if (action === 'serper-search') {
            return await handleSerperSearch(payload)
        } else {
            throw new Error(`Unknown action: ${action}`)
        }

    } catch (error) {
        console.error("🔥 API Error:", error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})

// --- HANDLERS (Native Fetch - No SDKs) ---

async function handleGeminiGenerate(payload: any) {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY")

    // Fallback to 1.5-flash if model is weird 2.5 version
    // Or keep it if user really has access to a beta
    const model = payload.model || "gemini-1.5-flash"
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    // Normalize structure for REST API
    // SDK uses { inlineData: { mimeType: ... } }
    // REST uses { inline_data: { mime_type: ... } }
    const rawParts = Array.isArray(payload.prompt) ? payload.prompt : [{ text: payload.prompt }]

    const parts = rawParts.map((p: any) => {
        if (typeof p === 'string') return { text: p }
        if (p.text) return { text: p.text }
        if (p.inlineData) {
            return {
                inline_data: {
                    mime_type: p.inlineData.mimeType,
                    data: p.inlineData.data
                }
            }
        }
        return p
    })

    // Normalize Config
    // SDK: responseMimeType -> REST: response_mime_type
    const config = payload.config ? {
        temperature: payload.config.temperature,
        response_mime_type: payload.config.responseMimeType,
        candidate_count: payload.config.candidateCount
    } : undefined

    const body = {
        contents: [{ parts }],
        generationConfig: config
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })

    if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Gemini API Error: ${response.status} ${errText}`)
    }

    const data = await response.json()
    // Extract text from REST response structure
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    return new Response(JSON.stringify({ text }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    })
}

async function handleSerperSearch(payload: any) {
    const apiKey = Deno.env.get('SERPER_API_KEY')
    if (!apiKey) throw new Error("Missing SERPER_API_KEY")

    const myHeaders = new Headers()
    myHeaders.append("X-API-KEY", apiKey)
    myHeaders.append("Content-Type", "application/json")

    const response = await fetch("https://google.serper.dev/search", {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error(`Serper API Invalid Response: ${response.statusText}`)
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    })
}
