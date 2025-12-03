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
    generationConfig: { responseMimeType: "application/json" }
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
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
  Rôle : Expert en Recrutement pour cabinets de conseil "Top Tier" (McKinsey, BCG, Bain, Deloitte, PwC, EY, KPMG).
  Action : Analyse la compatibilité entre ce CV et cette Offre d'Emploi, puis optimise le CV pour qu'il soit PARFAIT pour ces cabinets exigeants.
  Langue de sortie : ${language}

  Données CV : ${JSON.stringify(cv)}
  Données Offre : ${JSON.stringify(job)}

  RÈGLES D'OR "BIG FOUR / MBB" (NON NÉGOCIABLES) :
  1. STRUCTURE & LISIBILITÉ (Règle des 6 secondes) :
     - Le CV DOIT tenir sur UNE SEULE PAGE (A4). C'est impératif.
     - Utilise des BULLET POINTS (Listes à puces) pour TOUTES les expériences.
     - Limite à 3-5 puces par expérience pertinente.
     - Pas de blocs de texte compacts. Aère le contenu.

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
     - Ajoute la Mention ou le GPA si c'est un atout.

  5. COMPÉTENCES & LANGUES :
     - Sépare les "Hard Skills" (Outils, Tech) des "Soft Skills" (Comportemental).
     - LANGUES : Indique TOUJOURS le niveau (ex: "Anglais : Courant / C1"). C'est éliminatoire sinon.

  7. OPTIMISATION DE L'ESPACE & MARGES (CRITIQUE - NON NÉGOCIABLE) :
     - LE CV DOIT TENIR SUR UNE PAGE. C'est la priorité absolue.
     - HEADLINE : MAX 90 caractères. Si c'est plus long, COUPE ou REFORMULE. Doit tenir sur 1 ligne.
     - SUMMARY : MAX 350 caractères (environ 3 lignes).
     - BULLET POINTS : MAX 130 caractères par puce. Une puce = 1 ligne (exceptionnellement 2).
     - Si un texte dépasse, tu DOIS le résumer de manière agressive.
     - Supprime les mots de liaison inutiles (ex: "en charge de", "responsable de", "afin de"). Utilise un style télégraphique.

  Tâche :
  1. Calcule un score de compatibilité (0-100).
  2. Identifie les points forts, points faibles, et mots-clés manquants.
  3. Évalue le fit culturel.
  4. GÉNÈRE LE CV OPTIMISÉ (optimizedCV) en respectant scrupuleusement les limites de caractères.
     - Headline : "[Poste] | [Expertise]" (Court et percutant, < 90 chars)
     - Summary : Pitch ultra-court (< 350 chars).
     - Experience : 3-4 puces max par poste. Chaque puce < 130 chars.
     - Education : Complète mais concise.
     - Skills : Liste de mots-clés pertinents uniquement.
     - Interests : Court.

  Structure JSON attendue (MatchResult) :
  {
    "score": 85,
    "analysis": {
      "strengths": ["..."],
      "weaknesses": ["..."],
      "missingKeywords": ["..."],
      "cultureFit": "..."
    },
    "optimizedCV": {
      "contact": { ... },
      "headline": "...",
      "summary": "...",
      "skills": ["..."],
      "softSkills": ["..."],
      "languages": ["Anglais (C1)", "Français (Natif)"],
      "interests": ["Passion 1", "Passion 2"],
      "experience": [
        {
          "company": "...",
          "role": "...",
          "dates": "...",
          "description": "- Puce 1 (Action + Résultat)\n- Puce 2 (Action + Résultat)\n- Puce 3 (Action + Résultat)"
        }
      ],
      "education": [ ... ],
      "certifications": [ ... ]
    },
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
    generationConfig: { responseMimeType: "application/json" }
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
    generationConfig: { responseMimeType: "application/json" }
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
