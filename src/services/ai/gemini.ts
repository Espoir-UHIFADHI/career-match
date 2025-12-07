import { supabase } from "../supabase";
import type { ParsedCV, JobAnalysis, MatchResult } from "../../types";

// Helper to call the Secure Edge Function
async function callGemini(payload: any, token?: string): Promise<string> {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const { data, error } = await supabase.functions.invoke('career-match-api', {
    body: {
      action: 'gemini-generate',
      payload: payload
    },
    headers: headers
  });

  if (error) {
    console.error("🔥 Secure AI Error:", error);
    throw new Error(error.message || "Erreur de communication avec l'IA sécurisée.");
  }

  return data.text;
}

/**
 * Convertit le fichier en Base64 compatible Gemini (sans en-tête data-url)
 */
async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (!base64String) {
        reject(new Error("Impossible de lire le fichier."));
        return;
      }
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        },
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export async function parseCV(file: File, token?: string): Promise<ParsedCV> {
  console.log("🚀 Parsing CV initialisé (Secure Backend)...", { hasToken: !!token });

  try {
    const filePart = await fileToGenerativePart(file);

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

    const responseText = await callGemini({
      model: "gemini-2.5-flash",
      prompt: [prompt, filePart],
      config: { responseMimeType: "application/json", temperature: 0 }
    }, token);

    return JSON.parse(responseText) as ParsedCV;

  } catch (error) {
    console.error("❌ Erreur Parsing (Secure):", error);
    throw error;
  }
}

export async function matchAndOptimize(cv: ParsedCV, job: JobAnalysis, language: string = "French", token?: string): Promise<MatchResult> {
  console.log("🚀 Matching initialisé (Secure Backend)...", { hasToken: !!token });

  const prompt = `
  Rôle : Expert en Recrutement pour cabinets de conseil "Top Tier" (McKinsey, BCG, Bain, Deloitte, PwC, EY, KPMG).
  Action : Analyse la compatibilité entre ce CV et cette Offre d'Emploi.
  Langue de sortie : ${language}

  Données CV : ${JSON.stringify(cv)}
  Données Offre : ${JSON.stringify(job)}

  RÈGLE CRITIQUE DE MATCHING (SEUIL DE PERTINENCE) :
  1. Tu dois d'abord évaluer le score de matching (0-100).
  2. SI LE SCORE EST INFÉRIEUR À 45% (Seuil Critique) :
     - C'est un "Low Match". Le profil ne correspond pas du tout au poste.
     - DANS CE CAS : NE GÉNÈRE PAS DE "optimizedCV". Mets "optimizedCV": null.
     - Explique clairement pourquoi le profil est rejeté.

  3. SI LE SCORE EST SUPÉRIEUR OU ÉGAL À 45% :
     - Procède à l'optimisation complète du CV selon les règles "BIG FOUR / MBB".

  Structure JSON attendue (MatchResult) :
  {
    "score": 85,
    "analysis": {
      "strengths": ["..."],
      "weaknesses": ["..."],
      "missingKeywords": ["..."],
      "cultureFit": "..."
    },
    "optimizedCV": { ... } OU null (si score < 45),
    "recommendations": ["..."]
  }
  `;

  try {
    const responseText = await callGemini({
      model: "gemini-2.5-flash",
      prompt: prompt, // Text-only prompt
      config: { responseMimeType: "application/json", temperature: 0 }
    }, token);
    return JSON.parse(responseText) as MatchResult;
  } catch (error) {
    console.error("❌ Erreur Matching (Secure):", error);
    throw error;
  }
}

export async function generateJSON<T = any>(prompt: string, token?: string): Promise<T> {
  console.log("🚀 Génération JSON (Secure Backend)...", { hasToken: !!token });
  try {
    const responseText = await callGemini({
      model: "gemini-2.5-flash",
      prompt: prompt,
      config: { responseMimeType: "application/json", temperature: 0 }
    }, token);
    return JSON.parse(responseText) as T;
  } catch (error) {
    console.error("❌ Erreur Génération JSON (Secure):", error);
    throw error;
  }
}

export async function generateNetworkingQueries(
  company: string,
  role: string,
  location: string = "",
  token?: string
): Promise<{ queries: string[] }> {
  console.log("🚀 Génération requêtes (Secure Backend)...", { hasToken: !!token });

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

  try {
    const responseText = await callGemini({
      model: "gemini-2.5-flash",
      prompt: prompt,
      config: { responseMimeType: "application/json", temperature: 0 }
    }, token);
    return JSON.parse(responseText) as { queries: string[] };
  } catch (error) {
    console.error("❌ Erreur Requêtes (Secure):", error);
    throw error;
  }
}

export async function optimizeCVContent(cv: ParsedCV, token?: string): Promise<ParsedCV> {
  console.log("🚀 Optimisation CV (Secure Backend)...", { hasToken: !!token });

  const prompt = `
  Rôle : Expert en Rédaction de CV "Top Tier".
  Action : Réécris et améliore le contenu de ce CV.
  Données CV : ${JSON.stringify(cv)}
  Structure JSON attendue : (Même format que l'entrée)
  `;

  try {
    const responseText = await callGemini({
      model: "gemini-2.5-flash",
      prompt: prompt,
      config: { responseMimeType: "application/json", temperature: 0 }
    }, token);
    return JSON.parse(responseText) as ParsedCV;
  } catch (error) {
    console.error("❌ Erreur Optimisation (Secure):", error);
    throw error;
  }
}

export async function generateNetworkingMessage(
  cvData: any,
  jobDescription: string,
  contactRole: string,
  contactCompany: string,
  templateType: string = "cold-outreach",
  token?: string
): Promise<string> {
  console.log("🚀 Génération Message (Secure Backend)...", { hasToken: !!token });

  const prompt = `
  Rôle : Expert en Networking.
  Action : Rédige un message court LinkedIn/Email.
  Contexte : Candidat (${cvData ? "avec CV" : "sans CV"}) -> ${contactRole} chez ${contactCompany}.
  Sujet : ${jobDescription}. Type: ${templateType}.
  Règle : Moins de 100 mots. Pas d'objet.
  `;

  try {
    const responseText = await callGemini({
      model: "gemini-2.5-flash",
      prompt: prompt,
      config: { responseMimeType: "text/plain", temperature: 0.7 }
    }, token);
    return responseText;
  } catch (error) {
    console.error("❌ Erreur Message (Secure):", error);
    throw error;
  }
}
