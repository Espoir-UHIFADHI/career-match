import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Sections ATS standards ───────────────────────────────────────────────────
const SECTION_PATTERNS: Record<string, RegExp> = {
  contact:      /\b(email|téléphone|phone|tel|mobile|linkedin|github|adresse|address|@)\b/i,
  experience:   /\b(expérience|experience|emploi|poste|entreprise|société|company|travail|work|mission|stage|intern)\b/i,
  education:    /\b(formation|education|diplôme|diplome|université|universite|école|ecole|master|bachelor|bac|licence|degree)\b/i,
  skills:       /\b(compétences|competences|skills|technologies|outils|tools|langages|languages|stack|frameworks?)\b/i,
  summary:      /\b(profil|profile|résumé|resume|summary|objectif|objective|présentation|presentation|about)\b/i,
};

// ─── Problèmes ATS détectables sur texte brut ─────────────────────────────────
interface Issue {
  type: "critical" | "warning";
  title: string;
  detail: string;
}

interface ScanResult {
  score: number;
  issues: Issue[];
  sectionsFound: string[];
  wordCount: number;
  hasEmail: boolean;
  hasPhone: boolean;
  hasLinkedIn: boolean;
}

function analyzeText(text: string): ScanResult {
  const issues: Issue[] = [];
  const sectionsFound: string[] = [];

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  const lowerText = text.toLowerCase();

  // ── Détection sections ────────────────────────────────────────────────────
  for (const [section, pattern] of Object.entries(SECTION_PATTERNS)) {
    if (pattern.test(text)) sectionsFound.push(section);
  }

  // ── Détection coordonnées ─────────────────────────────────────────────────
  const hasEmail   = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/.test(text);
  const hasPhone   = /(\+?\d[\d\s\-\.]{7,}\d)/.test(text);
  const hasLinkedIn = /linkedin\.com\/in\//i.test(text);

  // ── Règles de scoring ─────────────────────────────────────────────────────

  // Trop court
  if (wordCount < 150) {
    issues.push({
      type: "critical",
      title: "CV trop court",
      detail: `${wordCount} mots détectés. Un ATS s'attend à au moins 300 mots pour extraire un profil complet.`,
    });
  }

  // Trop long
  if (wordCount > 1200) {
    issues.push({
      type: "warning",
      title: "CV trop long",
      detail: `${wordCount} mots. La plupart des ATS traitent moins bien les CVs de plus de 2 pages (≈700 mots).`,
    });
  }

  // Email manquant
  if (!hasEmail) {
    issues.push({
      type: "critical",
      title: "Email non détecté",
      detail: "L'ATS ne peut pas extraire vos coordonnées sans adresse email visible en texte brut.",
    });
  }

  // Sections manquantes
  const missingSections = Object.keys(SECTION_PATTERNS).filter(s => !sectionsFound.includes(s));
  if (missingSections.includes("experience")) {
    issues.push({
      type: "critical",
      title: "Section Expérience introuvable",
      detail: "L'ATS ne peut pas parser votre historique professionnel sans en-tête reconnaissable.",
    });
  }
  if (missingSections.includes("skills")) {
    issues.push({
      type: "warning",
      title: "Section Compétences manquante",
      detail: "Les filtres de mots-clés ATS scannent principalement la section compétences.",
    });
  }
  if (missingSections.includes("education")) {
    issues.push({
      type: "warning",
      title: "Section Formation introuvable",
      detail: "Beaucoup d'offres filtrent par niveau de diplôme minimum.",
    });
  }

  // Lignes trop longues (signe de tableaux/colonnes)
  const veryLongLines = lines.filter(l => l.length > 200).length;
  if (veryLongLines > 2) {
    issues.push({
      type: "critical",
      title: "Mise en page complexe détectée",
      detail: "Des lignes anormalement longues suggèrent des colonnes ou tableaux, qui cassent la lecture ATS.",
    });
  }

  // Répétitions de caractères spéciaux (symboles décoratifs fréquents dans les templates Word)
  const specialCharCount = (text.match(/[│┃▪▸►◆◇★☆✓✗■□●○]/g) || []).length;
  if (specialCharCount > 5) {
    issues.push({
      type: "warning",
      title: "Caractères spéciaux ATS-incompatibles",
      detail: `${specialCharCount} symboles détectés. Les icônes et puces décoratives sont souvent ignorées ou mal interprétées.`,
    });
  }

  // Dates en format non-standard (difficiles à parser pour les ATS)
  const hasNonStandardDates = /\b(jan|fév|fev|mar|avr|mai|jun|jul|aoû|aou|sep|oct|nov|déc|dec)\.?\s+\d{2}\b/i.test(text);
  const hasStandardDates = /\b(20\d{2}|19\d{2})\b/.test(text);
  if (!hasStandardDates && hasNonStandardDates) {
    issues.push({
      type: "warning",
      title: "Format de dates ambigu",
      detail: "Préférez le format YYYY ou MM/YYYY pour maximiser la lisibilité ATS.",
    });
  }

  // URLs non cliquables en texte brut (souvent copiées depuis un PDF image)
  const urlCount = (text.match(/https?:\/\//g) || []).length;
  if (urlCount === 0 && lowerText.includes("linkedin")) {
    issues.push({
      type: "warning",
      title: "URL LinkedIn non parseable",
      detail: "LinkedIn mentionné mais aucune URL complète détectée. Indiquez linkedin.com/in/votre-profil.",
    });
  }

  // ── Calcul du score ───────────────────────────────────────────────────────
  let score = 100;
  for (const issue of issues) {
    score -= issue.type === "critical" ? 18 : 8;
  }
  // Bonus sections trouvées
  score += Math.min(sectionsFound.length * 3, 15);
  // Bonus coordonnées complètes
  if (hasEmail) score += 3;
  if (hasPhone) score += 2;
  if (hasLinkedIn) score += 2;

  score = Math.max(12, Math.min(96, score));

  return { score, issues, sectionsFound, wordCount, hasEmail, hasPhone, hasLinkedIn };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const text: string = body?.text ?? "";

    if (!text || text.trim().length < 30) {
      return new Response(JSON.stringify({ error: "Text too short" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = analyzeText(text);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
