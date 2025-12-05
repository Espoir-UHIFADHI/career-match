import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ParsedCV, JobAnalysis, MatchResult } from "../../types";

// 1. ACCÈS SÉCURISÉ À LA CLÉ API (Compatible Vite)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

// Initialisation avec configuration explicite pour utiliser l'API v1
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Convertit le fichier en Base64 compatible Gemini (sans en-tête data-url)
 */
async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;

      // Sécurité : On vérifie que la lecture a fonctionné
      if (!base64String) {
        reject(new Error("Impossible de lire le fichier."));
        return;
      }

      // On retire l'en-tête "data:application/pdf;base64," pour ne garder que le hash
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

export async function parseCV(file: File): Promise<ParsedCV> {
  console.log("🚀 Parsing CV initialisé avec Gemini Flash...");

  if (!apiKey || !genAI) {
    console.error("❌ CLÉ API MANQUANTE : Vérifiez votre fichier .env et assurez-vous que la variable se nomme VITE_GEMINI_API_KEY");
    throw new Error("Clé API manquante. Impossible de contacter l'IA.");
  }

  // 2. CONFIGURATION DU MODÈLE (Flash = Rapide & Stable)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json", temperature: 0 }
  });

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

    const result = await model.generateContent([prompt, filePart]);
    const response = await result.response;
    const text = response.text();

    return JSON.parse(text) as ParsedCV;

  } catch (error) {
    console.error("❌ Erreur Parsing Gemini:", error);
    throw error;
  }
}

export async function matchAndOptimize(cv: ParsedCV, job: JobAnalysis, language: string = "French"): Promise<MatchResult> {
  console.log("🚀 Matching & Optimization initialisé avec Gemini Flash...");

  if (!apiKey || !genAI) {
    throw new Error("Clé API manquante.");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json", temperature: 0 }
  });

  const prompt = `
  Rôle : Expert en Recrutement pour cabinets de conseil "Top Tier" (McKinsey, BCG, Bain, Deloitte, PwC, EY, KPMG).
  Action : Analyse la compatibilité entre ce CV et cette Offre d'Emploi.
  Langue de sortie : ${language}

  Données CV : ${JSON.stringify(cv)}
  Données Offre : ${JSON.stringify(job)}

  RÈGLE CRITIQUE DE MATCHING (SEUIL DE PERTINENCE) :
  1. Tu dois d'abord évaluer le score de matching (0-100).
  2. SI LE SCORE EST INFÉRIEUR À 45% (Seuil Critique) :
     - C'est un "Low Match". Le profil ne correspond pas du tout au poste (ex: Ingénieur Mécanique pour un poste de Couturier).
     - DANS CE CAS : NE GÉNÈRE PAS DE "optimizedCV". Mets "optimizedCV": null.
     - Tu ne dois PAS mentir ou inventer des compétences pour forcer le matching.
     - Explique clairement dans "analysis.weaknesses" et "recommendations" pourquoi le profil est rejeté.

  3. SI LE SCORE EST SUPÉRIEUR OU ÉGAL À 45% :
     - Procède à l'optimisation complète du CV selon les règles "BIG FOUR / MBB" ci-dessous.

  RÈGLES D'OR "BIG FOUR / MBB" (UNIQUEMENT SI SCORE >= 45%) :
  1. STRUCTURE & LISIBILITÉ (Règle des 6 secondes) :
     - Le CV DOIT tenir sur UNE SEULE PAGE (A4). C'est impératif.
     - Utilise des BULLET POINTS (Listes à puces) pour TOUTES les expériences.
     - Limite à 3-5 puces par expérience pertinente.
     - Pas de blocs de texte compacts. Aère le contenu.
     - RESPECTE LES MARGES : Ne surcharge pas la page. Si nécessaire, réduis le contenu moins pertinent.

  2. CONTENU "IMPACT & CONSULTING" :
     - Chaque puce doit suivre la structure : "Verbe d'action fort + Contexte/Tâche + RÉSULTAT CHIFFRÉ (Impact)".
     - Ex: "Piloté (Verbe) la migration de données (Contexte), réduisant les erreurs de 15% (Résultat)."
     - Utilise des verbes de "Leader" : Dirigé, Piloté, Conçu, Optimisé, Transformé (pas de "Participation à" ou "Responsable de").
     - Supprime les pronoms "Je", "Mon", "Ma".

  3. CHRONOLOGIE & CLARTÉ (Éviter les Red Flags) :
     - Si des dates se chevauchent (ex: 2 postes en même temps), précise le contexte : "Alternance", "Projet Académique", "Side Project" ou "Freelance".
     - Ne laisse aucune ambiguïté sur la nature du contrat.

  4. ÉDUCATION (Critère N°1) :
     - Affiche CLAIREMENT : Nom de l'école (en premier), Ville, Diplôme, Dates.
     - Summary : Pitch percutant et professionnel (2-3 lignes MAXIMUM).
     - Experience : 3 puces MAXIMUM par poste. Soyez précis et concis (méthode STAR).
     - Education : Complète mais concise (pas de description longue).
     - Skills : SÉLECTIONNE UNIQUEMENT les 8-10 compétences les plus pertinentes.
     - Interests : Court.

   5. INTEGRATION OBLIGATOIRE DES MOTS-CLÉS (CRITIQUE) :
      - Tu vas identifier des "Missing Keywords" dans l'analyse.
      - SÉLECTIONNE les 3 à 5 mots-clés les plus CRITIQUES pour le poste.
      - TU DOIS LES AJOUTER dans optimizedCV.skills ou dans les puces d'expérience.
      - C'est NON NÉGOCIABLE pour les compétences techniques clés (Hard Skills).
      - Fais-le de manière naturelle, mais assure-toi qu'ils sont présents.
      - IMPORTANT : N'UTILISE PAS DE MARKDOWN (pas de **, pas de *) dans les valeurs JSON. Écris du texte brut uniquement.

   6. CURATION DES SKILLS (ESSENTIEL) :
      - NE LISTE PAS toutes les compétences du candidat.
      - SÉLECTIONNE UNIQUEMENT les 10-15 compétences les plus pertinentes pour CETTE offre d'emploi.
      - Supprime les compétences obsolètes ou non pertinentes pour le poste visé.
      - L'objectif est la PERTINENCE, pas la quantité.

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
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text) as MatchResult;
  } catch (error) {
    console.error("❌ Erreur Matching Gemini:", error);
    throw error;
  }
}

/**
 * Fonction générique pour générer du JSON à partir d'un prompt
 * Utilisée pour analyser les offres d'emploi et autres tâches de parsing
 */
export async function generateJSON<T = any>(prompt: string): Promise<T> {
  console.log("🚀 Génération JSON avec Gemini Flash...");

  if (!apiKey || !genAI) {
    throw new Error("Clé API manquante.");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json", temperature: 0 }
  });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text) as T;
  } catch (error) {
    console.error("❌ Erreur Génération JSON Gemini:", error);
    throw error;
  }
}

/**
 * Generate smart networking search queries using AI
 * Returns optimized LinkedIn search queries based on company, role, and location
 */
export async function generateNetworkingQueries(
  company: string,
  role: string,
  location: string = ""
): Promise<{ queries: string[] }> {
  console.log("🚀 Génération de requêtes de recherche intelligentes...");

  if (!apiKey || !genAI) {
    throw new Error("Clé API manquante.");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json", temperature: 0 }
  });

  const prompt = `
  Rôle : Expert en recherche LinkedIn et networking professionnel.
  Action : Génère 3-5 requêtes de recherche optimisées pour trouver des contacts pertinents sur LinkedIn.
  
  Paramètres de recherche :
  - Entreprise cible : ${company || "Non spécifié"}
  - Rôle/Fonction : ${role || "Non spécifié"}
  - Localisation : ${location || "Non spécifié"}
  
  RÈGLES IMPORTANTES :
  1. Toutes les requêtes doivent commencer par "site:linkedin.com/in/"
  2. Utilise des guillemets pour les noms d'entreprise exacts : "${company}"
  3. Utilise OR pour les variations de titres (ex: "Recruiter OR Talent Acquisition")
  4. Combine intelligemment les mots-clés pour maximiser la pertinence
  5. Génère des variantes pour couvrir différents profils (seniors, juniors, managers, etc.)
  
  Structure JSON attendue :
  {
    "queries": [
      "site:linkedin.com/in/ \"${company}\" ${role} ${location}",
      "site:linkedin.com/in/ \"${company}\" (${role} OR variation) ${location}",
      ...
    ]
  }
  
  Génère entre 3 et 5 requêtes variées et pertinentes.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text) as { queries: string[] };
  } catch (error) {
    console.error("❌ Erreur Génération Requêtes Networking:", error);
    throw error;
  }
}

/**
 * Optimise le contenu du CV (Bullet points, structure) sans offre spécifique
 */
export async function optimizeCVContent(cv: ParsedCV): Promise<ParsedCV> {
  console.log("🚀 Optimisation CV générique avec Gemini Flash...");

  if (!apiKey || !genAI) {
    throw new Error("Clé API manquante.");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json", temperature: 0 }
  });

  const prompt = `
  Rôle : Expert en Rédaction de CV "Top Tier" (McKinsey, BCG, Bain).
  Action : Réécris et améliore le contenu de ce CV pour qu'il soit plus percutant, orienté résultats, et professionnel.
  
  Données CV : ${JSON.stringify(cv)}

  Instructions :
  1. Améliore le "Summary" pour qu'il soit une proposition de valeur forte.
  2. Réécris les descriptions d'expérience en bullet points "Action + Résultat".
  3. Corrige les fautes et améliore le style (langage professionnel).
  4. Garde la même structure JSON.

  Structure JSON attendue : (Même format que l'entrée)
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text) as ParsedCV;
  } catch (error) {
    console.error("❌ Erreur Optimisation CV:", error);
    throw error;
  }
}

/**
 * Generates a personalized networking message
 */
export async function generateNetworkingMessage(
  cvData: any, // Can be null if not available
  jobDescription: string,
  contactRole: string,
  contactCompany: string,
  templateType: string = "cold-outreach"
): Promise<string> {
  console.log("🚀 Génération message networking avec Gemini Flash...");

  if (!apiKey || !genAI) {
    throw new Error("Clé API manquante.");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "text/plain", temperature: 0.7 }
  });

  const prompt = `
  Rôle : Expert en Networking et Copywriting.
  Action : Rédige un message court, percutant et ultra-personnalisé pour contacter un professionnel sur LinkedIn ou par email.
  
  Contexte :
  - Candidat (Moi) : ${cvData ? JSON.stringify(cvData.summary) : "Un professionnel motivé"}
  - Cible : ${contactRole} chez ${contactCompany}
  - Contexte Job/Intérêt : ${jobDescription}
  - Type d'approche : ${templateType} (ex: cold-outreach, alumni, feedback, referral)

  RÈGLES D'OR :
  1. Le message doit faire moins de 100 mots (court et direct).
  2. Pas de formules pompeuses ("J'ai l'honneur de..."). Sois conversationnel et pro.
  3. La première phrase doit accrocher (Hook). Parle D'EUX, pas de moi.
  4. Finis par un Call to Action clair et sans pression (ex: "Ouvert pour échanger 5 min ?").
  5. ADAPTE LE TON au type d'approche (${templateType}).

  Exemple de structure :
  "Bonjour [Prénom], j'ai vu votre parcours chez [Boite]... [Lien avec mon profil/job]... Seriez-vous dispo pour..."

  Génère UNIQUEMENT le corps du message (pas d'objet, pas de placeholders [Prénom] si possible, fais un texte générique mais chaud).
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("❌ Erreur Génération Message Networking:", error);
    throw error;
  }
}
