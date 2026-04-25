import type { MatchResult, ParsedCV } from "../types";

const splitListText = (value: string): string[] =>
  value
    .split(/\r?\n|,|;|•|·/)
    .map((item) => item.trim())
    .filter(Boolean);

export function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === "string") return splitListText(item);
        if (item == null) return [];
        return [String(item).trim()];
      })
      .filter(Boolean);
  }

  if (typeof value === "string") return splitListText(value);
  if (value == null) return [];
  return [String(value).trim()].filter(Boolean);
}

export function normalizeParsedCV(value: unknown): ParsedCV | null {
  if (!value || typeof value !== "object") return null;
  const cv = value as ParsedCV & Record<string, unknown>;

  return {
    ...cv,
    contact: {
      firstName: "",
      lastName: "",
      ...(cv.contact && typeof cv.contact === "object" ? cv.contact : {}),
    },
    skills: normalizeStringArray(cv.skills),
    softSkills: normalizeStringArray(cv.softSkills),
    languages: normalizeStringArray(cv.languages),
    interests: normalizeStringArray(cv.interests),
    experience: Array.isArray(cv.experience) ? cv.experience : [],
    education: Array.isArray(cv.education) ? cv.education : [],
    certifications: Array.isArray(cv.certifications)
      ? cv.certifications
      : normalizeStringArray(cv.certifications),
  };
}

export function normalizeMatchResult(value: unknown): MatchResult | null {
  if (!value || typeof value !== "object") return null;
  const result = value as MatchResult;
  return {
    ...result,
    optimizedCV: result.optimizedCV ? normalizeParsedCV(result.optimizedCV) ?? undefined : result.optimizedCV,
  };
}
