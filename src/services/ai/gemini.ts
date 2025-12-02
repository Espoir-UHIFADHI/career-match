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
  Rôle : Expert en Recrutement et Spécialiste ATS (Applicant Tracking System).
  Action : Analyse la compatibilité entre ce CV et cette Offre d'Emploi, puis optimise le CV pour maximiser ses chances de passer les filtres ATS.
  Langue de sortie : ${language}

  Données CV : ${JSON.stringify(cv)}
  Données Offre : ${JSON.stringify(job)}

  RÈGLES D'OR "EXPERT RECRUTEMENT" (À RESPECTER IMPÉRATIVEMENT) :
  1. TITRE (HEADLINE) : Génère un titre percutant sous le format : "[Poste visé] | [Domaine d'expertise] | [Élément différenciant]" (ex: "Consultant Stratégie | Transformation Digitale | Trilingue").
  2. MÉTHODE S.T.A.R. : Pour chaque expérience, utilise la formule : "Verbe d'action + Tâche + Méthode + Résultat quantifié".
     - Ex: "Optimisé le processus de facturation (Action) en automatisant 3 étapes (Méthode), réduisant les délais de 40% (Résultat)."
  3. VERBES D'ACTION : Commence TOUJOURS par un verbe fort (Dirigé, Piloté, Conçu, Analysé...). JAMAIS "Responsable de" ou "Participation à".
  4. PAS DE PRONOMS : Pas de "Je", "Mon", "Ma". Style impersonnel et direct.
  5. FORMAT "ONE PAGE" STRICT :
     - SOIS CONCIS : Le CV DOIT tenir sur UNE SEULE PAGE.
     - Résumé : 2-3 lignes maximum, ultra-ciblé.
     - Expérience : 3-4 puces max pour les postes récents, 2 pour les anciens.
     - FORMAT PUCES : Utilise IMPÉRATIVEMENT des tirets "-" pour chaque puce dans la description (ex: "- Action 1...").
  6. COMPÉTENCES : Groupe-les par catégories (Techniques, Langues, Métiers).
  7. TRADUCTION STRICTE :
     - Si Langue de sortie = "English" : TOUT le contenu (résumé, expériences, compétences, titre) DOIT être en ANGLAIS. Aucune phrase en français.
     - Si Langue de sortie = "French" : TOUT le contenu DOIT être en FRANÇAIS.
     - NE MÉLANGE PAS LES LANGUES. C'est CRITIQUE.

  Tâche :
  1. Calcule un score de compatibilité (0-100).
  2. Identifie les points forts, points faibles, et mots-clés manquants.
  3. Évalue le fit culturel.
  4. GÉNÈRE LE CV OPTIMISÉ (optimizedCV) :
     - Ajoute le champ "headline" avec le format demandé.
     - Réécris le "summary" pour qu'il soit une proposition de valeur unique.
     - Réécris TOUTES les descriptions d'expérience en mode S.T.A.R.
     - Organise les "skills" de manière logique.
  5. Donne des recommandations concrètes.

  Structure JSON attendue (MatchResult) :
  {
    "score": 85,
    "analysis": {
      "strengths": ["..."],
      "weaknesses": ["..."],
      "missingKeywords": ["..."],
      "cultureFit": "..."
    },
    "optimizedCV": { ... (Structure complète du CV mis à jour) },
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
