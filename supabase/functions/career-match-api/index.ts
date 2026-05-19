/// <reference path="./deno-shims.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

type LlmTextResponse = { text: string; provider: "gemini" | "openrouter" };

type LlmProvider = "gemini" | "openrouter";

type JwtHeader = {
    alg?: string;
    kid?: string;
};

type JwtClaims = {
    sub?: string;
    iss?: string;
    exp?: number;
    nbf?: number;
};

class HttpError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

const BILLABLE_ACTION_COSTS: Record<string, number> = {
    'parse-cv': 1,
    'analyze-job': 1,
    'optimize-cv': 1,
    'serper-batch-search': 1,
    'generate-networking-message': 1,
    'generate-networking-message-variants': 1,
    'generate-networking-sequence': 1,
    'hunter-domain-search': 1,
    'hunter-email-finder': 1,
    'hunter-email-verifier': 1,
};

function readEnvInt(name: string, fallback: number): number {
    const raw = Deno.env.get(name);
    if (!raw) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function normalizeJsonText(raw: string): string {
    const s = (raw || "").trim();
    if (!s) return s;
    try {
        JSON.parse(s);
        return s;
    } catch {
        // Try extracting the first JSON object from the response
        const first = s.indexOf("{");
        const last = s.lastIndexOf("}");
        if (first >= 0 && last > first) {
            const candidate = s.slice(first, last + 1);
            JSON.parse(candidate);
            return candidate;
        }
        throw new Error("Model returned invalid JSON.");
    }
}

function getForcedProvider(): LlmProvider | null {
    const forced = (Deno.env.get("AI_FORCE_PROVIDER") || "").toLowerCase();
    if (forced === "gemini" || forced === "openrouter") return forced;
    return null;
}

function isRetryableUpstreamError(error: unknown): boolean {
    const msg = error instanceof Error ? error.message : String(error);
    // Timeouts/network failures
    if (/AbortError|timed out|timeout|ECONNRESET|ENOTFOUND|fetch failed/i.test(msg)) return true;
    // Known upstream status codes surfaced in messages below
    if (/\b429\b/.test(msg)) return true;
    if (/\b5\d\d\b/.test(msg)) return true;
    return false;
}

function withTimeoutSignal(timeoutMs: number): AbortSignal {
    return AbortSignal.timeout(timeoutMs);
}

serve(async (req) => {
    // Handle CORS Preflight completely
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    try {
        // 1. Verify User Authentication (JWT)
        const userId = await getAuthenticatedUserId(req);

        const user = { id: userId };
        console.log(`🚀 API Request by ${user.id}`);

        // 2. Parse Request
        const { action, payload } = (await req.json()) as { action: string; payload: any }
        const creditCost = BILLABLE_ACTION_COSTS[action] ?? 0;

        if (creditCost > 0) {
            await debitUserCredits(user.id, creditCost, action);
        }

        // 3. Handle Actions
        try {
            switch (action) {
                case 'serper-search':
                    return await handleSerperSearch(payload)
                case 'serper-batch-search':
                    return await handleSerperBatchSearch(payload)
                case 'parse-cv':
                    return await handleParseCV(payload)
                case 'analyze-job':
                    return await handleAnalyzeJob(payload)
                case 'optimize-cv':
                    return await handleOptimizeCV(payload)
                case 'generate-networking-queries':
                    return await handleGenerateNetworkingQueries(payload)
                case 'generate-networking-message':
                    return await handleGenerateNetworkingMessage(payload)
                case 'generate-networking-message-variants':
                    return await handleGenerateNetworkingMessageVariants(payload)
                case 'generate-networking-sequence':
                    return await handleGenerateNetworkingSequence(payload)
                case 'networking-upsert-contact':
                    return await handleNetworkingUpsertContact(payload, user.id)
                case 'networking-update-contact':
                    return await handleNetworkingUpdateContact(payload, user.id)
                case 'networking-list-contacts':
                    return await handleNetworkingListContacts(payload, user.id)
                case 'networking-list-messages':
                    return await handleNetworkingListMessages(payload, user.id)
                case 'networking-insert-message':
                    return await handleNetworkingInsertMessage(payload, user.id)
                case 'networking-mark-message-copied':
                    return await handleNetworkingMarkMessageCopied(payload, user.id)
                case 'hunter-domain-search':
                    return await handleHunterDomainSearch(payload)
                case 'hunter-company-domain':
                    return await handleHunterCompanyDomain(payload)
                case 'hunter-email-finder':
                    return await handleHunterEmailFinder(payload)
                case 'hunter-email-verifier':
                    return await handleHunterEmailVerifier(payload)
                default:
                    throw new HttpError(400, `Unknown or deprecated action: ${action}`)
            }
        } catch (handlerError) {
            if (creditCost > 0) {
                await refundUserCredits(user.id, creditCost, action).catch((refundError) => {
                    console.error("Credit refund failed:", refundError);
                });
            }
            throw handlerError;
        }

    } catch (error) {
        console.error("🔥 API Error:", error)
        const msg = error instanceof Error ? error.message : String(error)
        const status = error instanceof HttpError ? error.status : 500;
        return new Response(JSON.stringify({ error: msg }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status,
        })
    }
})

async function getAuthenticatedUserId(req: Request): Promise<string> {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) throw new HttpError(401, 'Missing bearer token');
    if (token.split('.').length !== 3) {
        throw new HttpError(401, 'Invalid bearer token format');
    }

    const claims = await verifyClerkJwt(token);
    if (!claims.sub) {
        throw new HttpError(401, 'Invalid or expired bearer token');
    }

    return claims.sub;
}

function decodeBase64Url(input: string): Uint8Array {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function decodeJwtJson<T>(part: string): T {
    const text = new TextDecoder().decode(decodeBase64Url(part));
    return JSON.parse(text) as T;
}

async function verifyClerkJwt(token: string): Promise<JwtClaims> {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
    const header = decodeJwtJson<JwtHeader>(encodedHeader);
    const claims = decodeJwtJson<JwtClaims>(encodedPayload);

    if (header.alg !== 'RS256' || !header.kid || !claims.iss) {
        throw new HttpError(401, 'Invalid bearer token');
    }

    const expectedIssuer = Deno.env.get('CLERK_JWT_ISSUER') || Deno.env.get('CLERK_ISSUER');
    if (expectedIssuer && claims.iss !== expectedIssuer) {
        throw new HttpError(401, 'Invalid token issuer');
    }

    const now = Math.floor(Date.now() / 1000);
    if (!claims.sub || !claims.exp || claims.exp <= now || (claims.nbf && claims.nbf > now)) {
        throw new HttpError(401, 'Invalid or expired bearer token');
    }

    const issuerUrl = new URL(claims.iss);
    if (issuerUrl.protocol !== 'https:') {
        throw new HttpError(401, 'Invalid token issuer');
    }

    const jwksResponse = await fetch(new URL('/.well-known/jwks.json', issuerUrl).toString());
    if (!jwksResponse.ok) {
        throw new HttpError(401, 'Unable to verify bearer token');
    }

    const jwks = await jwksResponse.json() as { keys?: Array<Record<string, unknown>> };
    const jwk = jwks.keys?.find((key) => key.kid === header.kid);
    if (!jwk) {
        throw new HttpError(401, 'Unknown token signing key');
    }

    const cryptoKey = await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify'],
    );
    const signature = decodeBase64Url(encodedSignature);
    const signedData = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, signedData);
    if (!valid) {
        throw new HttpError(401, 'Invalid bearer token signature');
    }

    return claims;
}

// --- HANDLERS ---

async function callGeminiRaw(body: any): Promise<any> {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY")

    const model = "gemini-2.5-flash"
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const timeoutMs = readEnvInt("GEMINI_TIMEOUT_MS", 45_000);

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: withTimeoutSignal(timeoutMs),
    })

    if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Gemini API Error: ${response.status} ${errText}`)
    }

    const data = await response.json()
    return data;
}

async function callOpenRouterRaw(payload: {
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    temperature?: number;
    responseFormat?: "json_object" | "text";
}): Promise<{ content: string }> {
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY");

    const model = Deno.env.get("OPENROUTER_MODEL") || "openrouter/auto";
    const referer = Deno.env.get("OPENROUTER_HTTP_REFERER") || "https://career-match.local";
    const title = Deno.env.get("OPENROUTER_APP_TITLE") || "Career Match";
    const timeoutMs = readEnvInt("OPENROUTER_TIMEOUT_MS", 45_000);

    const body: any = {
        model,
        messages: payload.messages,
        temperature: payload.temperature ?? 0,
    };
    if (payload.responseFormat === "json_object") {
        body.response_format = { type: "json_object" };
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": referer,
            "X-Title": title,
        },
        body: JSON.stringify(body),
        signal: withTimeoutSignal(timeoutMs),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter API Error: ${response.status} ${errText}`);
    }

    const data = (await response.json()) as any;
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
        throw new Error("OpenRouter API Error: missing response content");
    }
    return { content };
}

async function generateTextWithFallback(args: {
    prompt: string;
    responseMimeType: "application/json" | "text/plain";
    temperature: number;
    // Used only to make parse-cv fallback reliable when Gemini vision is down
    extractedText?: string;
    allowOpenRouter?: boolean;
}): Promise<LlmTextResponse> {
    const allowOpenRouter = args.allowOpenRouter ?? true;
    const forced = getForcedProvider();

    if (forced === "openrouter") {
        const responseFormat = args.responseMimeType === "application/json" ? "json_object" : "text";
        const { content } = await callOpenRouterRaw({
            messages: [
                {
                    role: "system",
                    content:
                        "You are a reliable assistant. Follow the user's instructions exactly. " +
                        "If asked for JSON, return STRICT JSON only (no markdown, no extra keys).",
                },
                { role: "user", content: args.prompt },
            ],
            temperature: args.temperature,
            responseFormat,
        });
        return { text: content, provider: "openrouter" };
    }

    // --- 1) Try Gemini first
    try {
        if (forced === "gemini") {
            // proceed normally, just avoid falling back below
        }
        const geminiBody = {
            contents: [{ parts: [{ text: args.prompt }] }],
            generationConfig: { response_mime_type: args.responseMimeType, temperature: args.temperature },
        };
        const data = await callGeminiRaw(geminiBody);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return { text, provider: "gemini" };
    } catch (error) {
        if (forced === "gemini") throw error;
        if (!allowOpenRouter || !isRetryableUpstreamError(error)) throw error;
        console.warn("↪ Gemini failed; falling back to OpenRouter.", error);
    }

    // --- 2) Fallback: OpenRouter
    const userContentParts = [
        args.prompt,
        args.extractedText ? `\n\n---\nCV_TEXT_EXTRACTED:\n${args.extractedText}\n` : "",
    ].filter(Boolean).join("");

    const responseFormat = args.responseMimeType === "application/json" ? "json_object" : "text";
    const { content } = await callOpenRouterRaw({
        messages: [
            {
                role: "system",
                content:
                    "You are a reliable assistant. Follow the user's instructions exactly. " +
                    "If asked for JSON, return STRICT JSON only (no markdown, no extra keys).",
            },
            { role: "user", content: userContentParts },
        ],
        temperature: args.temperature,
        responseFormat,
    });

    return { text: content, provider: "openrouter" };
}

async function handleSerperSearch(payload: any) {
    const apiKey = Deno.env.get('SERPER_API_KEY')
    if (!apiKey) throw new Error("Missing SERPER_API_KEY")

    const { q, num, start, tbs, language } = payload;
    const gl = language === 'fr' ? 'fr' : 'us'; // Geolocation
    const hl = language === 'fr' ? 'fr' : 'en'; // Host Language (Interface/Snippets)

    const myHeaders = new Headers()
    myHeaders.append("X-API-KEY", apiKey)
    myHeaders.append("Content-Type", "application/json")

    const bodyPayload = {
        q,
        num,
        start,
        tbs,
        gl,
        hl
    };

    const response = await fetch("https://google.serper.dev/search", {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify(bodyPayload),
    })

    if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Serper API Error: ${response.status} ${errText || response.statusText}`)
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    })
}

async function handleSerperBatchSearch(payload: any) {
    const searches = Array.isArray(payload?.searches) ? payload.searches : [];
    if (searches.length === 0 || searches.length > 8) {
        throw new HttpError(400, "Invalid serper batch size");
    }

    const settled = await Promise.allSettled(searches.map(async (item: any) => {
        try {
            const response = await handleSerperSearch({
                q: item.q,
                num: item.num,
                start: item.start,
                tbs: item.tbs,
                language: item.language ?? payload.language,
            });
            const data = await response.json();
            return {
                label: item.label ?? "",
                data,
            };
        } catch (error) {
            console.warn("Serper batch item failed:", {
                label: item.label ?? "",
                q: item.q,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }));

    const results = settled
        .filter((item): item is PromiseFulfilledResult<{ label: string; data: any }> => item.status === "fulfilled")
        .map((item) => item.value);

    if (results.length === 0) {
        const firstError = settled.find((item): item is PromiseRejectedResult => item.status === "rejected");
        const message = firstError?.reason instanceof Error ? firstError.reason.message : String(firstError?.reason || "No Serper results");
        throw new Error(message);
    }

    return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });
}

async function handleParseCV(payload: any) {
    const { fileData, mimeType, extractedText } = payload;

    const prompt = `
    Rôle : Expert en extraction de données (OCR).
    Action : Analyse ce CV et extrais les informations suivantes en JSON strict.
    
    IMPORTANT : Respecte EXACTEMENT cette structure JSON :
    {
      "contact": {
        "firstName": "Prénom du candidat",
        "lastName": "Nom du candidat",
        "email": "adresse@email.com",
        "phone": "+33 6 12 34 56 78",
        "location": "Ville, Pays",
        "linkedin": "URL LinkedIn (optionnel)",
        "website": "URL site web (optionnel)"
      },
      "summary": "Résumé professionnel en 2-3 phrases",
      "skills": ["Compétence 1", "Compétence 2", "Compétence 3"],
      "languages": ["Français (Natif)", "Anglais (Courant)"],
      "experience": [
        {
          "company": "Nom de l'entreprise",
          "role": "Titre du poste",
          "dates": "Jan 2020 - Déc 2022",
          "description": "Description des responsabilités et réalisations"
        }
      ],
      "education": [
        {
          "school": "Nom de l'école/université",
          "degree": "Nom du diplôme",
          "dates": "2015 - 2018",
          "description": "Spécialisation ou mention (optionnel)"
        }
      ],
      "certifications": [
        { "name": "Nom Certification", "url": "URL (optionnel)" }
      ]
    }
    
    Règles importantes :
    - Si une information est manquante, utilise une chaîne vide "" pour les strings
    - Si une information est manquante, utilise un tableau vide [] pour les arrays
    - Pour contact.firstName et contact.lastName, si tu ne trouves pas le nom complet, mets au moins une valeur par défaut comme "Non" et "Spécifié"
    - Assure-toi que TOUS les champs requis sont présents dans la réponse
    - N'invente AUCUNE information, utilise uniquement ce qui est dans le CV
    - IMPORTANT : Cherche bien l'URL LinkedIn (linkedin.com/in/...) même en bas de page ou en petit. C'est très important.
    `;

    // Try Gemini (vision) first; if Gemini is down, fallback to OpenRouter using extracted text.
    let text = "";
    let provider: "gemini" | "openrouter" = "gemini";
    const forced = getForcedProvider();

    if (forced === "openrouter") {
        if (!extractedText || typeof extractedText !== "string") {
            throw new Error("AI_FORCE_PROVIDER=openrouter requires extractedText for parse-cv.");
        }
        const fallback = await generateTextWithFallback({
            prompt,
            extractedText,
            responseMimeType: "application/json",
            temperature: 0,
            allowOpenRouter: true,
        });
        text = fallback.text;
        provider = fallback.provider;

        console.log(`🤖 LLM provider (parse-cv): ${provider}`);
        return new Response(JSON.stringify({ text, provider, serverBilled: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }

    try {
        const body = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: fileData
                        }
                    }
                ]
            }],
            generationConfig: { response_mime_type: "application/json", temperature: 0 }
        };
        const data = await callGeminiRaw(body);
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (error) {
        if (forced === "gemini") throw error;
        if (!isRetryableUpstreamError(error)) throw error;
        if (!extractedText || typeof extractedText !== "string") {
            throw new Error("Gemini unavailable and no extractedText provided for fallback.");
        }
        const fallback = await generateTextWithFallback({
            prompt,
            extractedText,
            responseMimeType: "application/json",
            temperature: 0,
            allowOpenRouter: true,
        });
        text = fallback.text;
        provider = fallback.provider;
    }

    console.log(`🤖 LLM provider (parse-cv): ${provider}`);
    return new Response(JSON.stringify({ text, provider, serverBilled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    })
}

async function handleAnalyzeJob(payload: any) {
    const { description, language } = payload;

    const prompt = `
        Analyze the following job posting and extract the key requirements.
        
        Job Content:
        ${description}
        
        Return a JSON object matching this schema:
        {
          "title": "Job Title",
          "company": "Company Name",
          "description": "Brief summary of the role and key responsibilities (max 3-4 sentences) in ${language === 'fr' ? 'French' : 'English'}",
          "requirements": {
            "hardSkills": ["skill1", "skill2"],
            "softSkills": ["skill1", "skill2"],
            "culture": ["value1", "value2"],
            "experienceLevel": "Junior/Mid/Senior"
          },
          "multilingual": {
            "fr": {
               "description": "Résumé du poste en français",
               "requirements": { "hardSkills": ["compétence1"], "softSkills": ["softSkill1"] }
            },
            "en": {
               "description": "Job summary in English",
               "requirements": { "hardSkills": ["skill1"], "softSkills": ["softSkill1"] }
            }
          }
        }

        IMPORTANT:
        - Populate "multilingual.fr" with French content.
        - Populate "multilingual.en" with English content.
        - The root "description" and "requirements" should match the language: ${language === 'fr' ? 'French' : 'English'}.
    `;

    const { text, provider } = await generateTextWithFallback({
        prompt,
        responseMimeType: "application/json",
        temperature: 0,
    });

    console.log(`🤖 LLM provider (analyze-job): ${provider}`);
    return new Response(JSON.stringify({ text, provider, serverBilled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    })
}

async function handleOptimizeCV(payload: any) {
    const { cv, job, language } = payload;
    const _language = language || "French";

    const prompt = `
  Rôle : Expert Mondial en Optimisation de CV & Recrutement "Top Tier" (ex-Recruteur Google/Amazon/McKinsey).
  Objectif : Réécrire ce CV pour qu'il obtienne un score de pertinence (ATS Score) maximal pour l'Offre d'Emploi fournie.

  Données CV Original : ${JSON.stringify(cv)}
  Données Offre d'Emploi : ${JSON.stringify(job)}

  TES INSTRUCTIONS PRIORITAIRES (A RESPECTER À LA LETTRE) :

  1. **ZÉRO COPIER-COLLER (REFORMULATION TOTALE)** : 
     - Ne reprends PAS les phrases du CV original telles quelles.
     - Tu dois REFAÇONNER chaque phrase pour coller au vocabulaire et au ton de l'Offre d'Emploi.
     - Le CV final doit donner l'impression que le candidat a fait ce CV *spécifiquement* pour ce poste.

  2. **OPTIMISATION ATS (Mots-clés)** :
     - Identifie les "Hard Skills", "Soft Skills" et mots-clés critiques de l'Offre.
     - INTÈGRE ces mots-clés de manière naturelle dans le "Summary", les "Skills" et les descriptions d'"Experience".
     - Si le candidat a une expérience similaire mais décrite différemment, utilise le terme exact de l'offre.

  3. **ORIENTÉ RÉSULTATS & IMPACT (Méthode Google)** :
     - Bannis les descriptions de tâches passives ("Responsable de...", "En charge de...").
     - Utilise des verbes d'action forts (Piloté, Conçu, Augmenté, Réduit, Optimisé...).
     - Structure : "Action + Contexte + Résultat Chiffré/Impact".
     - Exemple : Au lieu de "Vente de logiciels", écris "Génération de 50k€ de revenus additionnels (+20%) via la prospection de 15 grands comptes".
  
  6. **LANGUE DE SORTIE (CRITIQUE & ABSOLUE)** :
     - LA SORTIE JSON DOIT ÊTRE EN : **${_language.toUpperCase()}**.
     - C'est la règle LA PLUS IMPORTANTE.
     - Si la langue demandée est "FRENCH" -> TOUT le contenu (Experience, Skills, Summary, Job Titles, Descriptions) DOIT être en FRANÇAIS.
     - MÊME SI le CV original est en Anglais ou si l'Offre est en Anglais, TU DOIS TRADUIRE la sortie en FRANÇAIS.
     - Si la langue demandée est "ENGLISH" -> TOUT le contenu DOIT être en ANGLAIS.
     - Ne laisse AUCUN mot dans la mauvaise langue (sauf noms propres d'entreprises/outils).

  4. **FORMATAGE DE L'EXPÉRIENCE (RÈGLE DES 2+1+1)** :
      - Pour CHAQUE expérience, le champ "description" DOIT respecter STRICTEMENT cette structure :
        - 2 tirets MAX pour la description des tâches (les plus importantes).
        - 1 tiret "Impact" : Résultat chiffré ou qualitatif majeur.
        - 1 tiret "Environnement" : Liste des outils/technos utilisés.
      - Total = 4 lignes par expérience MAXIMUM. C'est CRUCIAL pour tenir sur 1 page.
      - Sépare CHAQUE point par un saut de ligne réel (\n).
      - Exemple :
        "- Action majeure 1...\n- Action majeure 2...\n- Action majeure 3...\n- Impact : Augmentation de 30%...\n- Environnement : React, Node.js, AWS"
      - Pas de paragraphes compacts.

  5. **DONNÉES DE CONTACT (CRITIQUE)** :
     - Tu dois REPRENDRE EXACTEMENT les infos de contact du CV original.
     - **NE PAS OUBLIER LE LIEN LINKEDIN** (field: contact.linkedin). C'est obligatoire.
     - Ne pas inventer d'infos de contact.

   7. **OPTIMISATION DES COMPÉTENCES TECHNIQUES (LIMITATION STRICTE)** :
      - **FORMAT** : Une liste SIMPLE et PLATE de mots-clés séparés par des virgules. PAS DE CATÉGORIES.
      - **VOLUME** : Garde UNIQUEMENT les 8 à 12 compétences les plus CRITIQUES pour ce poste spécifique.
      - **CONTRAINTE ABSOLUE** : Le CV final DOIT tenir sur UNE SEULE PAGE. Si tu mets trop de compétences, ça déborde. Coupe ce qui n'est pas essentiel.
      - **QUALITÉ** : Choisis les "Hard Skills" qui font dire "Wow" au recruteur.

   8. **RÉDACTION "DREAM JOB" (TOP 1%)** :
      - Ton but est que ce CV décroche l'entretien à coup sûr.
      - Utilise un langage d'impact, orienté résultats ("Augmenté de X%", "Réduit de Y%").
      - Sois précis, concis, et percutant. Chaque mot doit "vendre" le candidat.

   9. **ACCORD DE GENRE (INTELLIGENT)** :
      - ANALYSE le Prénom et le contenu du CV original pour détecter le genre.
      - SI C'EST UNE FEMME (ex: Sophie, Marie... ou adjectifs féminins dans le CV source) :
        - TU DOIS ACCORDER tous les titres et adjectifs au FÉMININ.
        - Ex: "Ingénieure", "Directrice", "Experte", "Passionnée", "Spécialisée".
        - C'est un détail qui change tout pour la candidate.
      - Sinon, garde le masculin standard.

   PROCESSUS DE MATCHING :
  1. Calcule un Score de Pertinence (0-100).
  2. SI SCORE < 45 : Renvoie "optimizedCV": null.
  3. SI SCORE >= 45 : Génère le JSON complet avec le CV optimisé selon les règles ci-dessus.

  Structure JSON attendue :
  {
    "score": 85,
    "analysis": {
      "strengths": ["..."],
      "weaknesses": ["..."],
      "missingKeywords": ["..."],
      "cultureFit": "..."
    },
    "optimizedCV": {
      "contact": { ... }, // Garder LinkedIn !
      "headline": "Titre du poste visé | Expertise clé",
      "summary": "Résumé ultra-ciblé de 3-4 lignes...",
      "skills": ["Catégorie : Skill 1, Skill 2...", ...],
      "softSkills": ["Soft Skill 1", "Soft Skill 2", ...],
      "experience": [ ... ],
      "education": [ ... ],
      "languages": ["Langue 1 (Niveau)", ...],
      "certifications": [ { "name": "Certification 1", "url": "..." } ],
      "interests": ["Intérêt 1", ...]
    },
    "recommendations": ["..."],
    "multilingual": {
      "fr": {
        "analysis": {
            "strengths": ["Force 1", "Force 2"],
            "weaknesses": ["Faiblesse 1"],
            "cultureFit": "Analyse culturelle en français"
        },
        "recommendations": ["Recommandation 1", "Recommandation 2"]
      },
      "en": {
        "analysis": {
            "strengths": ["Strength 1", "Strength 2"],
            "weaknesses": ["Weakness 1"],
            "cultureFit": "Cultural analysis in English"
        },
        "recommendations": ["Recommendation 1", "Recommendation 2"]
      }
    }
  }

  IMPORTANT : 
  1. LE CHAMP "multilingual" EST OBLIGATOIRE.
  2. REMPLIS "multilingual.fr" AVEC DU CONTENU EN FRANÇAIS.
  3. REMPLIS "multilingual.en" AVEC DU CONTENU EN ANGLAIS.
  4. La racine "analysis" et "recommendations" doit correspondre à la langue demandée (${_language}).
  5. C'EST LA RÈGLE LA PLUS IMPORTANTE.
  TRADUIS INTEGRALEMENT LE CONTENU.
  `;

    const { text, provider } = await generateTextWithFallback({
        prompt,
        responseMimeType: "application/json",
        temperature: 0,
    });

    console.log(`🤖 LLM provider (optimize-cv): ${provider}`);
    return new Response(JSON.stringify({ text, provider, serverBilled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    })
}

export async function handleGenerateNetworkingQueries(payload: any) {
    const { company, role, location, language } = payload;
    const isFrench = language === 'fr';

    const prompt = `
  Rôle : Expert en recherche LinkedIn et "Google Dorking".
  Objectif : Fournir les **briques de recherche** pour construire une requête booléenne précise.
  
  Contexte :
  - Entreprise cible : ${company || "Non spécifié"}
  - Rôle recherché par l'utilisateur : ${role || "Non spécifié"} (Le candidat cherche ce poste OU cherche des gens ayant ce poste).
  - Langue : ${isFrench ? 'FRANÇAIS' : 'ANGLAIS'}
  
  TA MISSION :
  1. Analyser le "Rôle recherché" et trouver 2-3 synonymes pertinents (ex: "Sales" -> "Business Developer", "Account Executive").
  2. Générer les **opérateurs booléens** pour cibler les personas suivants (SANS inclure l'entreprise ni le lieu, juste les titres) :
     - "gatekeeper" : RH, Recruteurs (ex: (intitle:RH OR intitle:Recruiter ...))
     - "peer" : Des pairs qui font le MEME métier que le "Rôle recherché" (ex: si rôle=Dev, (intitle:Développeur OR intitle:Ingénieur))
     - "decision_maker" : Les N+1 potentiels (Managers, Head of, VP, CTO...) liés au "Rôle recherché".
     - "email_finder" : Mots clés pour trouver des emails (ex: "@${company ? company.replace(/\s+/g, '').toLowerCase() : 'email'}.com" OR "email" OR "contact")

  RÈGLES DORKING :
  - Utilise TOUJOURS des parenthèses groupantes.
  - Utilise l'opérateur OR.
  - NE METS PAS "site:linkedin.com". Ça sera ajouté par le code.
  - NE METS PAS l'Entreprise ni la Localisation. Ça sera ajouté par le code.
  - Les synonymes doivent être des chaînes simples.

  Structure JSON attendue STRICTEMENT :
  {
    "role_synonyms": ["Synonyme1", "Synonyme2"],
    "keywords": {
      "gatekeeper": "(intitle:Daide OR intitle:...",
      "peer": "(intitle:SynonymeRole1 OR intitle:...",
      "decision_maker": "(intitle:Manager OR intitle:Head ...)",
      "email_finder": "(\"@domain.com\" OR ...)"
    }
  }
  `;

    const { text, provider } = await generateTextWithFallback({
        prompt,
        responseMimeType: "application/json",
        temperature: 0,
    });

    console.log(`🤖 LLM provider (generate-networking-queries): ${provider}`);
    return new Response(JSON.stringify({ text, provider }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    })
}

async function handleGenerateNetworkingMessage(payload: any) {
    const { cvData, jobDescription, contactRole, contactCompany, templateType } = payload;

    const prompt = `
  Rôle : Expert en Networking.
  Action : Rédige un message court LinkedIn/Email.
  Contexte : Candidat (${cvData ? "avec CV" : "sans CV"}) -> ${contactRole} chez ${contactCompany}.
  Sujet : ${jobDescription}. Type: ${templateType}.
  Règle : Moins de 100 mots. Pas d'objet.
  `;

    const { text, provider } = await generateTextWithFallback({
        prompt,
        responseMimeType: "text/plain",
        temperature: 0.7,
    });

    console.log(`🤖 LLM provider (generate-networking-message): ${provider}`);
    return new Response(JSON.stringify({ text, provider }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    })
}

async function handleGenerateNetworkingMessageVariants(payload: any) {
    const { cvData, jobDescription, contactName, contactRole, contactCompany, personalization } = payload;

    const why = personalization?.whyContact ?? "";
    const about = personalization?.oneLineAboutMe ?? "";
    const objective = personalization?.objective ?? "";
    const tone = (personalization?.tone ?? "warm") === "direct" ? "direct" : "chaleureux";
    const proofs = Array.isArray(personalization?.proofPoints) ? personalization.proofPoints : [];

    const prompt = `
Rôle: Expert en cold outreach performant.
Objectif: Générer 2 variantes de message (LinkedIn + Email) personnalisées et crédibles.

Contexte:
- Contact: ${contactName ? contactName + " — " : ""}${contactRole} chez ${contactCompany}
- Opportunité / sujet: ${jobDescription}
- Pourquoi je contacte: ${why}
- 1 ligne sur moi: ${about}
- Objectif: ${objective}
- Ton: ${tone}
- Preuves (faits concrets): ${proofs.length ? proofs.map((p: string) => `- ${p}`).join("\n") : "(aucune)"}
- CV: ${cvData ? "disponible" : "non fourni"}

Contraintes:
- Messages courts, actionnables, pas génériques.
- Ajoute 1 preuve max (si fournie), sinon formule une micro-preuve ("j'ai fait X", "j'ai mené Y") sans inventer.
- LinkedIn: < 700 caractères. Email: < 120 mots, avec 1 CTA clair.
- Ne mets pas de markdown.

RETOURNE STRICTEMENT du JSON (aucun texte autour), structure:
{
  "linkedin": "…",
  "email": "…"
}
`;

    const { text, provider } = await generateTextWithFallback({
        prompt,
        responseMimeType: "application/json",
        temperature: 0.6,
    });

    const normalized = normalizeJsonText(text);
    console.log(`🤖 LLM provider (generate-networking-message-variants): ${provider}`);
    return new Response(JSON.stringify({ text: normalized, provider }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    })
}

async function handleGenerateNetworkingSequence(payload: any) {
    const { cvData, jobDescription, contactName, contactRole, contactCompany, personalization } = payload;

    const why = personalization?.whyContact ?? "";
    const about = personalization?.oneLineAboutMe ?? "";
    const objective = personalization?.objective ?? "";
    const tone = (personalization?.tone ?? "warm") === "direct" ? "direct" : "chaleureux";
    const proofs = Array.isArray(personalization?.proofPoints) ? personalization.proofPoints : [];

    const prompt = `
Rôle: Expert en séquences de contact (réseau) à fort taux de réponse.
Objectif: Produire une séquence prête à copier/coller: 1er message + 2 follow-ups.

Contexte:
- Contact: ${contactName ? contactName + " — " : ""}${contactRole} chez ${contactCompany}
- Sujet/opportunité: ${jobDescription}
- Pourquoi je contacte: ${why}
- 1 ligne sur moi: ${about}
- Objectif: ${objective}
- Ton: ${tone}
- Preuves (faits concrets): ${proofs.length ? proofs.map((p: string) => `- ${p}`).join("\n") : "(aucune)"}
- CV: ${cvData ? "disponible" : "non fourni"}

Contraintes:
- LinkedIn: 3 messages (step 1..3), < 700 caractères chacun.
- Email: 3 emails (step 1..3), < 120 mots chacun. Les follow-ups peuvent réutiliser le même objet implicite; pas besoin de champ subject obligatoire.
- Chaque follow-up apporte un angle nouveau (preuve, question, valeur).
- Ne pas inventer de faits non fournis.
- Ne mets pas de markdown.

RETOURNE STRICTEMENT du JSON (aucun texte autour), structure:
{
  "linkedin": [
    { "step": 1, "label": "1ère approche", "message": "..." },
    { "step": 2, "label": "Follow-up 1 (J+3)", "message": "..." },
    { "step": 3, "label": "Follow-up 2 (J+7)", "message": "..." }
  ],
  "email": [
    { "step": 1, "label": "Email 1", "subject": "…", "message": "..." },
    { "step": 2, "label": "Email 2 (J+3)", "subject": "…", "message": "..." },
    { "step": 3, "label": "Email 3 (J+7)", "subject": "…", "message": "..." }
  ]
}
`;

    const { text, provider } = await generateTextWithFallback({
        prompt,
        responseMimeType: "application/json",
        temperature: 0.6,
    });

    const normalized = normalizeJsonText(text);
    console.log(`🤖 LLM provider (generate-networking-sequence): ${provider}`);
    return new Response(JSON.stringify({ text: normalized, provider }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    })
}

function getServiceClient() {
    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!url || !serviceRoleKey) {
        throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    return createClient(url, serviceRoleKey);
}

async function debitUserCredits(userId: string, amount: number, action: string) {
    const client = getServiceClient();
    const { error } = await client.rpc('decrease_user_credits', {
        p_user_id: userId,
        p_amount: amount,
    });

    if (error) {
        const message = /insufficient credits/i.test(error.message)
            ? "Insufficient credits"
            : error.message || "Unable to reserve credits";
        throw new HttpError(message === "Insufficient credits" ? 402 : 500, message);
    }

    const { error: eventError } = await client.from('credit_usage_events').insert({
        user_id: userId,
        action,
        amount: -amount,
        reason: 'reserved',
    });
    if (eventError) console.warn("Credit usage event not recorded:", eventError.message);
}

async function refundUserCredits(userId: string, amount: number, action: string) {
    const client = getServiceClient();
    const { data: profile, error: readError } = await client
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();
    if (readError) throw readError;

    const { error: updateError } = await client
        .from('profiles')
        .update({ credits: (profile?.credits ?? 0) + amount })
        .eq('id', userId);
    if (updateError) throw updateError;

    const { error: eventError } = await client.from('credit_usage_events').insert({
        user_id: userId,
        action,
        amount,
        reason: 'refunded',
    });
    if (eventError) console.warn("Credit refund event not recorded:", eventError.message);
}

async function handleNetworkingUpsertContact(payload: any, userId: string) {
    const client = getServiceClient();

    const { data: existing, error: existingError } = await client
        .from('networking_contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('linkedin_url', payload.linkedinUrl)
        .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
        const { data, error } = await client
            .from('networking_contacts')
            .update({
                job_key: payload.jobKey ?? existing.job_key,
                full_name: payload.fullName ?? existing.full_name,
                title: payload.title ?? existing.title,
                company: payload.company ?? existing.company,
                snippet: payload.snippet ?? existing.snippet,
            })
            .eq('id', existing.id)
            .eq('user_id', userId)
            .select('*')
            .single();

        if (error) throw error;
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    const { data, error } = await client
        .from('networking_contacts')
        .insert({
            user_id: userId,
            linkedin_url: payload.linkedinUrl,
            job_key: payload.jobKey ?? null,
            full_name: payload.fullName ?? null,
            title: payload.title ?? null,
            company: payload.company ?? null,
            snippet: payload.snippet ?? null,
            status: payload.status ?? 'to_contact',
            tags: payload.tags ?? [],
            notes: payload.notes ?? null,
            next_follow_up: payload.nextFollowUp ?? null,
        })
        .select('*')
        .single();

    if (error) throw error;
    return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });
}

async function handleNetworkingUpdateContact(payload: any, userId: string) {
    const client = getServiceClient();
    const allowedPatch: Record<string, unknown> = {};
    const patch = payload.patch && typeof payload.patch === 'object' ? payload.patch : {};
    for (const key of ['status', 'tags', 'notes', 'next_follow_up']) {
        if (key in patch) allowedPatch[key] = patch[key];
    }

    if (Object.keys(allowedPatch).length === 0) {
        throw new HttpError(400, 'No allowed contact fields to update');
    }

    const { data, error } = await client
        .from('networking_contacts')
        .update(allowedPatch)
        .eq('id', payload.contactId)
        .eq('user_id', userId)
        .select('*')
        .single();

    if (error) throw error;
    return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });
}

async function handleNetworkingListContacts(payload: any, userId: string) {
    const client = getServiceClient();
    let query = client
        .from('networking_contacts')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (payload.jobKey) {
        query = query.eq('job_key', payload.jobKey);
    }

    const { data, error } = await query;
    if (error) throw error;
    return new Response(JSON.stringify(data ?? []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });
}

async function handleNetworkingListMessages(payload: any, userId: string) {
    const client = getServiceClient();

    const { data: contact, error: contactError } = await client
        .from('networking_contacts')
        .select('id')
        .eq('id', payload.contactId)
        .eq('user_id', userId)
        .single();
    if (contactError || !contact) throw contactError || new Error('Contact not found');

    const { data, error } = await client
        .from('networking_message_history')
        .select('*')
        .eq('contact_id', payload.contactId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return new Response(JSON.stringify(data ?? []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });
}

async function handleNetworkingInsertMessage(payload: any, userId: string) {
    const client = getServiceClient();

    const { data: contact, error: contactError } = await client
        .from('networking_contacts')
        .select('id')
        .eq('id', payload.contactId)
        .eq('user_id', userId)
        .single();
    if (contactError || !contact) throw contactError || new Error('Contact not found');

    const { data, error } = await client
        .from('networking_message_history')
        .insert({
            user_id: userId,
            contact_id: payload.contactId,
            channel: payload.channel,
            step: payload.step,
            content: payload.content,
            meta: payload.meta ?? {},
        })
        .select('*')
        .single();

    if (error) throw error;
    return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });
}

async function handleNetworkingMarkMessageCopied(payload: any, userId: string) {
    const client = getServiceClient();
    const { data, error } = await client
        .from('networking_message_history')
        .update({ copied_at: new Date().toISOString() })
        .eq('id', payload.messageId)
        .eq('user_id', userId)
        .select('*')
        .single();

    if (error) throw error;
    return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });
}

// --- HUNTER HANDLERS ---

async function callHunterRaw(endpoint: string, params: Record<string, string>) {
    const apiKey = Deno.env.get('HUNTER_API_KEY')
    if (!apiKey) throw new Error("Missing HUNTER_API_KEY")

    const queryParams = new URLSearchParams(params)
    queryParams.append('api_key', apiKey)

    const url = `https://api.hunter.io/v2/${endpoint}?${queryParams.toString()}`

    const response = await fetch(url)

    if (!response.ok) {
        // Pass through the error status from Hunter
        const errorText = await response.text()
        console.error(`Hunter API Error (${endpoint}): ${response.status} ${errorText}`)
        throw new Error(`Hunter API Error: ${response.status}`)
    }

    return await response.json()
}

async function handleHunterCompanyDomain(payload: any) {
    const { company } = payload
    try {
        const data = await callHunterRaw('domain-search', { company })
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        return new Response(JSON.stringify({ error: msg }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
}

async function handleHunterDomainSearch(payload: any) {
    const { domain } = payload
    try {
        const data = await callHunterRaw('domain-search', { domain })
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        return new Response(JSON.stringify({ error: msg }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500, // Or 400 depending on error
        })
    }
}

async function handleHunterEmailFinder(payload: any) {
    const { domain, first_name, last_name } = payload
    try {
        const data = await callHunterRaw('email-finder', {
            domain,
            first_name,
            last_name
        })
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        return new Response(JSON.stringify({ error: msg }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
}

async function handleHunterEmailVerifier(payload: any) {
    const { email } = payload
    try {
        const data = await callHunterRaw('email-verifier', { email })
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        return new Response(JSON.stringify({ error: msg }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
}
