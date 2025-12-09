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

export async function matchAndOptimize(cv: ParsedCV, job: JobAnalysis, _language: string = "French", token?: string): Promise<MatchResult> {
  console.log("🚀 Matching initialisé (Secure Backend)...", { hasToken: !!token });

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
    "recommendations": ["..."]
  }

  IMPORTANT : VERIFIE UNE DERNIÈRE FOIS LA LANGUE DE SORTIE.
  SI LA LANGUE DEMANDÉE EST "FRENCH", LE JSON DOIT CONTENIR UNIQUEMENT DU FRANÇAIS (Sauf noms propres).
  SI LA LANGUE DEMANDÉE EST "ENGLISH", LE JSON DOIT CONTENIR UNIQUEMENT DE L'ANGLAIS.
  C'EST LA RÈGLE LA PLUS IMPORTANTE.
  TRADUIS INTEGRALEMENT LE CONTENU.
  `;

  try {
    const responseText = await callGemini({
      model: "gemini-2.5-flash",
      prompt: prompt, // Text-only prompt
      config: { responseMimeType: "application/json", temperature: 0 }
    }, token);
    const result = JSON.parse(responseText) as MatchResult;
    return { ...result, analysisLanguage: _language as "English" | "French" };
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
