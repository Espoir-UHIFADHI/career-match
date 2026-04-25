export type NetworkingPersona = "recruiter" | "decision_maker" | "peer" | "insider" | "unknown";

export interface NetworkingQualityInput {
  name?: string;
  title?: string;
  link?: string;
  snippet?: string;
}

export interface NetworkingQualityProfile extends NetworkingQualityInput {
  relevanceScore: number;
  persona: NetworkingPersona;
  priorityRank: number;
  priorityLabel: string;
  scoreReasons: string[];
  canonicalLinkedInUrl: string;
  dedupeKey: string;
}

export type NetworkingSearchStrategy = "all" | "recruiter" | "hiring_manager" | "peer" | "insider";

interface ScoreContext {
  role?: string;
  company?: string;
  location?: string;
  strategy?: NetworkingSearchStrategy;
}

const PERSONA_LABELS: Record<NetworkingPersona, string> = {
  recruiter: "Recruteur",
  decision_maker: "Manager",
  peer: "Employé",
  insider: "Employé",
  unknown: "À qualifier",
};

const PERSONA_PRIORITY: Record<NetworkingPersona, number> = {
  recruiter: 1,
  decision_maker: 2,
  peer: 3,
  insider: 4,
  unknown: 5,
};

const STRATEGY_PERSONA_PRIORITY: Record<NetworkingSearchStrategy, Record<NetworkingPersona, number>> = {
  all: {
    recruiter: 1,
    decision_maker: 2,
    peer: 3,
    insider: 4,
    unknown: 5,
  },
  recruiter: {
    recruiter: 1,
    decision_maker: 2,
    peer: 3,
    insider: 4,
    unknown: 5,
  },
  hiring_manager: {
    decision_maker: 1,
    recruiter: 2,
    peer: 3,
    insider: 4,
    unknown: 5,
  },
  peer: {
    peer: 1,
    decision_maker: 2,
    recruiter: 3,
    insider: 4,
    unknown: 5,
  },
  insider: {
    insider: 1,
    peer: 2,
    recruiter: 3,
    decision_maker: 4,
    unknown: 5,
  },
};

const RECRUITER_TERMS = [
  "recruiter",
  "recruteur",
  "recruteuse",
  "talent acquisition",
  "talent partner",
  "sourcer",
  "recruitment",
  "recrutement",
  "human resources",
  "ressources humaines",
  "rh",
  "hr",
];

const DECISION_MAKER_TERMS = [
  "manager",
  "lead",
  "head",
  "director",
  "directeur",
  "directrice",
  "vp",
  "chief",
  "cto",
  "ceo",
  "founder",
  "fondateur",
  "responsable",
];

const INSIDER_TERMS = [
  "alumni",
  "ancien",
  "ancienne",
  "former",
  "graduate",
  "diplome",
  "diplomee",
  "ambassador",
  "ambassadeur",
  "ambassadrice",
  "mentor",
  "community",
  "communaute",
];

const SENIORITY_TERMS = [
  "senior",
  "staff",
  "principal",
  "lead",
  "head",
  "manager",
  "director",
  "directeur",
  "directrice",
  "expert",
];

const LOW_SIGNAL_TERMS = [
  "job",
  "jobs",
  "offre",
  "offres",
  "stage",
  "alternance",
  "annonce",
  "recrutement chez",
];

const CURRENT_COMPANY_TERMS = [
  "current",
  "currently",
  "actuel",
  "actuelle",
  "poste actuel",
  "chez",
  "at",
  "works at",
  "en poste",
];

const LINKEDIN_PROFILE_RE = /linkedin\.[a-z.]+\/in\/([^/?#]+)/i;

function normalizeText(value?: string): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function hasAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(normalizeText(term)));
}

function getRoleTerms(role?: string): string[] {
  const normalized = normalizeText(role);
  if (!normalized) return [];
  const words = normalized.split(" ").filter((word) => word.length > 2);
  return Array.from(new Set([normalized, ...words]));
}

function getPreferredPersona(strategy?: NetworkingSearchStrategy): NetworkingPersona | null {
  if (strategy === "all") return null;
  if (strategy === "recruiter") return "recruiter";
  if (strategy === "hiring_manager") return "decision_maker";
  if (strategy === "peer") return "peer";
  if (strategy === "insider") return "insider";
  return null;
}

export function getLinkedInProfileSlug(link?: string): string {
  const raw = (link || "").trim();
  const match = raw.match(LINKEDIN_PROFILE_RE);
  if (!match?.[1]) return "";
  try {
    return decodeURIComponent(match[1]).toLowerCase().replace(/\/+$/, "");
  } catch {
    return match[1].toLowerCase().replace(/\/+$/, "");
  }
}

export function getCanonicalLinkedInUrl(link?: string): string {
  const slug = getLinkedInProfileSlug(link);
  return slug ? `https://www.linkedin.com/in/${slug}` : (link || "").split(/[?#]/)[0].replace(/\/+$/, "");
}

export function getNetworkingDedupeKey(input: NetworkingQualityInput): string {
  const slug = getLinkedInProfileSlug(input.link);
  if (slug) return `linkedin:${slug}`;

  const name = normalizeText(input.name);
  const title = normalizeText(input.title);
  const link = normalizeText(getCanonicalLinkedInUrl(input.link));
  return `profile:${[name, title, link].filter(Boolean).join("|")}`;
}

export function inferNetworkingPersona(input: NetworkingQualityInput): NetworkingPersona {
  const haystack = normalizeText(`${input.title || ""} ${input.snippet || ""}`);
  if (hasAny(haystack, RECRUITER_TERMS)) return "recruiter";
  if (hasAny(haystack, DECISION_MAKER_TERMS)) return "decision_maker";
  if (hasAny(haystack, INSIDER_TERMS)) return "insider";
  if (haystack) return "peer";
  return "unknown";
}

export function scoreNetworkingProfile(input: NetworkingQualityInput, context: ScoreContext = {}): NetworkingQualityProfile {
  const title = input.title || "";
  const snippet = input.snippet || "";
  const haystack = normalizeText(`${title} ${snippet}`);
  const titleOnly = normalizeText(title);
  const company = normalizeText(context.company);
  const location = normalizeText(context.location);
  const roleTerms = getRoleTerms(context.role);
  const persona = inferNetworkingPersona(input);
  const reasons: string[] = [];
  let score = 35;

  if (persona !== "unknown") {
    score += 18;
  }

  if (
    (context.strategy === "recruiter" && persona === "recruiter") ||
    (context.strategy === "hiring_manager" && persona === "decision_maker") ||
    (context.strategy === "peer" && persona === "peer") ||
    (context.strategy === "insider" && persona === "insider")
  ) {
    score += 12;
    reasons.push("Aligné avec le filtre actif");
  }

  const roleMatches = roleTerms.filter((term) => haystack.includes(term));
  if (roleMatches.length > 0) {
    const exactRoleInTitle = roleTerms[0] ? titleOnly.includes(roleTerms[0]) : false;
    score += exactRoleInTitle ? 24 : Math.min(18, 8 + roleMatches.length * 4);
    reasons.push(exactRoleInTitle ? "Rôle proche dans le titre" : "Mots-clés du rôle détectés");
  }

  if (hasAny(haystack, SENIORITY_TERMS)) {
    score += 10;
    reasons.push("Seniority utile");
  }

  if (company && haystack.includes(company)) {
    score += hasAny(haystack, CURRENT_COMPANY_TERMS) ? 16 : 12;
    reasons.push("Entreprise détectée");
  }

  if (location && haystack.includes(location)) {
    score += 6;
    reasons.push("Localisation cohérente");
  }

  if (hasAny(haystack, LOW_SIGNAL_TERMS)) {
    score -= 12;
    reasons.push("Signal à vérifier");
  }

  if (!getLinkedInProfileSlug(input.link)) {
    score -= 10;
    reasons.push("URL LinkedIn non canonique");
  }

  const relevanceScore = Math.max(0, Math.min(100, Math.round(score)));
  const priorityRank = context.strategy
    ? STRATEGY_PERSONA_PRIORITY[context.strategy][persona]
    : PERSONA_PRIORITY[persona];
  const priorityLabel = PERSONA_LABELS[persona];

  return {
    ...input,
    relevanceScore,
    persona,
    priorityRank,
    priorityLabel,
    scoreReasons: reasons.slice(0, 3),
    canonicalLinkedInUrl: getCanonicalLinkedInUrl(input.link),
    dedupeKey: getNetworkingDedupeKey(input),
  };
}

export function dedupeAndRankNetworkingProfiles<T extends NetworkingQualityInput>(
  profiles: T[],
  context: ScoreContext = {}
): Array<T & NetworkingQualityProfile> {
  const byKey = new Map<string, T & NetworkingQualityProfile>();

  for (const profile of profiles) {
    const scored = { ...profile, ...scoreNetworkingProfile(profile, context) } as T & NetworkingQualityProfile;
    const existing = byKey.get(scored.dedupeKey);
    if (!existing || scored.relevanceScore > existing.relevanceScore) {
      byKey.set(scored.dedupeKey, scored);
    }
  }

  return Array.from(byKey.values()).sort((a, b) => {
    if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank;
    if (a.relevanceScore !== b.relevanceScore) return b.relevanceScore - a.relevanceScore;
    return (a.name || a.title || "").localeCompare(b.name || b.title || "");
  });
}

export function getFirstContactSuggestions<T extends NetworkingQualityProfile>(
  profiles: T[],
  max = 3,
  strategy?: NetworkingSearchStrategy
): T[] {
  const preferredPersona = getPreferredPersona(strategy);
  if (preferredPersona) {
    const preferred = profiles.filter((profile) => profile.persona === preferredPersona).slice(0, max);
    if (preferred.length > 0) return preferred;
  }

  const seenPersona = new Set<NetworkingPersona>();
  const suggestions: T[] = [];

  for (const profile of profiles) {
    if (profile.persona === "unknown" || seenPersona.has(profile.persona)) continue;
    suggestions.push(profile);
    seenPersona.add(profile.persona);
    if (suggestions.length >= max) break;
  }

  if (suggestions.length < max) {
    for (const profile of profiles) {
      if (suggestions.some((item) => item.dedupeKey === profile.dedupeKey)) continue;
      suggestions.push(profile);
      if (suggestions.length >= max) break;
    }
  }

  return suggestions;
}
