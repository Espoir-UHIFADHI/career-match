
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
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const authHeader = req.headers.get('Authorization')!;
        const token = authHeader.replace('Bearer ', '');
        const authPayload = JSON.parse(atob(token.split('.')[1]));
        const userId = authPayload.sub;

        // Verify validity by trying to fetch the user's profile
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

        const user = { id: userId };
        console.log(`🚀 API Request by ${user.id}`);

        // 2. Parse Request
        const { action, payload } = await req.json()

        // 3. Handle Actions
        switch (action) {
            case 'serper-search':
                return await handleSerperSearch(payload)
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
            case 'hunter-domain-search':
                return await handleHunterDomainSearch(payload)
            case 'hunter-email-finder':
                return await handleHunterEmailFinder(payload)
            case 'hunter-email-verifier':
                return await handleHunterEmailVerifier(payload)
            default:
                throw new Error(`Unknown or deprecated action: ${action}`)
        }

    } catch (error) {
        console.error("🔥 API Error:", error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})

// --- HANDLERS ---

async function callGeminiRaw(body: any): Promise<any> {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY")

    const model = "gemini-2.5-flash"
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

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
    return data;
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

async function handleParseCV(payload: any) {
    const { fileData, mimeType } = payload;

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
      "certifications": ["Certification 1", "Certification 2"]
    }
    
    Règles importantes :
    - Si une information est manquante, utilise une chaîne vide "" pour les strings
    - Si une information est manquante, utilise un tableau vide [] pour les arrays
    - Pour contact.firstName et contact.lastName, si tu ne trouves pas le nom complet, mets au moins une valeur par défaut comme "Non" et "Spécifié"
    - Assure-toi que TOUS les champs requis sont présents dans la réponse
    - N'invente AUCUNE information, utilise uniquement ce qui est dans le CV
    `;

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
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(JSON.stringify({ text }), {
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

    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json", temperature: 0 }
    };

    const data = await callGeminiRaw(body);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(JSON.stringify({ text }), {
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
      "certifications": ["Certification 1", ...],
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

    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json", temperature: 0 }
    };

    const data = await callGeminiRaw(body);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(JSON.stringify({ text }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    })
}

async function handleGenerateNetworkingQueries(payload: any) {
    const { company, role, location } = payload;

    const prompt = `
  Rôle : Expert en recherche LinkedIn et networking professionnel.
  Action : Génère 3-5 requêtes de recherche optimisées pour trouver des contacts pertinents sur LinkedIn.
  
  Paramètres :
  - Entreprise : ${company || "Non spécifié"}
  - Rôle : ${role || "Non spécifié"}
  - Localisation : ${location || "Non spécifié"}
  
  Structure JSON attendue :
  {
    "queries": ["site:linkedin.com/in/ ...", ...]
  }
  `;

    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json", temperature: 0 }
    };

    const data = await callGeminiRaw(body);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(JSON.stringify({ text }), {
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

    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "text/plain", temperature: 0.7 }
    };

    const data = await callGeminiRaw(body);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(JSON.stringify({ text }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    })
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

async function handleHunterDomainSearch(payload: any) {
    const { domain } = payload
    try {
        const data = await callHunterRaw('domain-search', { domain })
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
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
        return new Response(JSON.stringify({ error: error.message }), {
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
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
}
