import type { NetworkingQueriesResponse } from "../ai/gemini";
import type { NetworkingSearchStrategy } from "./quality";

export interface LinkedInSearchQuery {
  label: string;
  query: string;
}

interface LocationFilterInput {
  title?: string;
  snippet?: string;
}

const quote = (value?: string) => {
  const cleaned = (value || "").trim().replace(/"/g, "");
  return cleaned ? `"${cleaned}"` : "";
};

const compactQuery = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

const getObjectiveKeywordPart = (
  strategy: NetworkingSearchStrategy,
  aiData: NetworkingQueriesResponse | null
): string => {
  if (strategy === "all") {
    return [
      `(${getObjectiveKeywordPart("recruiter", aiData)})`,
      `(${getObjectiveKeywordPart("hiring_manager", aiData)})`,
      `(${getObjectiveKeywordPart("peer", aiData)})`,
    ].join(" OR ");
  }
  if (strategy === "recruiter") {
    return aiData?.keywords.gatekeeper || '("Talent Acquisition" OR Recruiter OR Recruteur OR Sourcer OR "HR Business Partner" OR "People Partner" OR RH OR "Human Resources" OR Recrutement)';
  }
  if (strategy === "hiring_manager") {
    return aiData?.keywords.decision_maker || '(Manager OR Lead OR Head OR Director OR Directeur OR Responsable OR VP OR "Team Lead" OR "Hiring Manager")';
  }
  if (strategy === "peer") {
    return aiData?.keywords.peer || '(Consultant OR Engineer OR Developer OR Analyst OR Specialist OR Expert OR "Chef de projet")';
  }
  return aiData?.keywords.peer || '(intitle:Consultant OR intitle:Engineer OR intitle:Developer OR intitle:Analyst OR intitle:Specialist)';
};

const roleExpression = (role: string, aiData: NetworkingQueriesResponse | null) => {
  const base = role.trim();
  const synonyms = (aiData?.role_synonyms || [])
    .filter((s) => s && s.toLowerCase() !== base.toLowerCase())
    .slice(0, 6);
  const terms = [base, ...synonyms].filter(Boolean).map(quote);
  if (terms.length === 0) return "";
  return terms.length === 1 ? terms[0] : `(${terms.join(" OR ")})`;
};

const locationExpression = (location: string) => {
  const normalized = location.trim().toLowerCase();
  if (!normalized) return "";

  if (normalized.includes("france")) {
    return '("France" OR Paris OR "Île-de-France" OR "Ile-de-France" OR Lyon OR Toulouse OR Bordeaux OR Lille OR Nantes OR Rennes OR Grenoble OR Marseille OR "La Défense" OR "La Defense" OR Vélizy OR Velizy OR Gennevilliers)';
  }

  return quote(location);
};

const getPersonaBroadPart = (strategy: NetworkingSearchStrategy) => {
  if (strategy === "all") {
    return '("Talent Acquisition" OR Recruiter OR Recruteur OR Sourcer OR RH OR "Human Resources" OR Manager OR Lead OR Head OR Director OR Directeur OR Responsable OR Engineer OR Consultant OR Analyst OR Specialist OR Expert)';
  }
  if (strategy === "recruiter") {
    return '("Talent Acquisition" OR Recruiter OR Recruteur OR Sourcer OR "HR Business Partner" OR "People Partner" OR RH OR "Human Resources" OR Recrutement OR "Chargé de recrutement" OR "Chargée de recrutement")';
  }
  if (strategy === "hiring_manager") {
    return '(Manager OR Lead OR Head OR Director OR Directeur OR Directrice OR Responsable OR VP OR CTO OR "Team Lead" OR "Engineering Manager" OR "Hiring Manager")';
  }
  return '(Consultant OR Engineer OR Developer OR Analyst OR Specialist OR Expert OR "Chef de projet" OR "Product Manager" OR "Business Analyst")';
};

export function hasExplicitForeignLocation(contact: LocationFilterInput, requestedLocation: string) {
  const normalizedLocation = requestedLocation.trim().toLowerCase();
  if (!normalizedLocation.includes("france")) return false;

  const text = `${contact.title || ""} ${contact.snippet || ""}`.toLowerCase();
  const foreignSignals = [
    "united states",
    "états-unis",
    "etats-unis",
    "usa",
    "u.s.",
    "u.s.a",
    "united kingdom",
    "royaume-uni",
    "uk",
    "canada",
    "australia",
    "australie",
    "india",
    "inde",
    "singapore",
    "singapour",
    "spain",
    "espagne",
    "italy",
    "italie",
    "germany",
    "allemagne",
    "rhode island",
    "texas",
    "california",
    "new york",
    "london",
    "madrid",
    "milan",
    "munich",
  ];

  return foreignSignals.some((signal) => text.includes(signal));
}

export function buildLinkedInSearchQueries(args: {
  company: string;
  role: string;
  location: string;
  strategy: NetworkingSearchStrategy;
  aiData: NetworkingQueriesResponse | null;
}): LinkedInSearchQuery[] {
  const base = "site:linkedin.com/in/";
  const companyPart = quote(args.company);
  const locationPart = locationExpression(args.location);
  const rolePart = roleExpression(args.role, args.aiData);
  const objectivePart = getObjectiveKeywordPart(args.strategy, args.aiData);
  const personaBroadPart = getPersonaBroadPart(args.strategy);
  const currentCompanySignals = '("chez" OR "at" OR "works at" OR "current" OR "currently" OR "en poste chez")';
  const cleanup = '-intitle:jobs -intitle:offre -intitle:annonce -inurl:jobs -inurl:company -inurl:school -inurl:pulse -inurl:posts -inurl:learning';

  const queries = [
    {
      label: "strict_role_company",
      query: compactQuery(base, companyPart, rolePart, objectivePart, locationPart, cleanup),
    },
    {
      label: "persona_company_broad",
      query: compactQuery(base, companyPart, personaBroadPart, locationPart, cleanup),
    },
    {
      label: "current_company_signal",
      query: compactQuery(base, companyPart, currentCompanySignals, personaBroadPart, rolePart, locationPart, cleanup),
    },
    {
      label: "role_company_no_intitle",
      query: compactQuery(base, companyPart, rolePart, locationPart, cleanup),
    },
    {
      label: "company_people_broad",
      query: compactQuery(base, companyPart, '("Talent" OR Recruiter OR Manager OR Lead OR Engineer OR Consultant OR Analyst OR Specialist)', locationPart, cleanup),
    },
  ].filter((item) => item.query.length > base.length + cleanup.length);

  return Array.from(new Map(queries.map((item) => [item.query, item])).values()).slice(0, 5);
}
