import { supabase } from "../supabase";
import type { ParsedCV, JobAnalysis, MatchResult } from "../../types";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Do not retry auth failures — repeating the call will not help. */
function isNonRetryableInvokeError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  if (/401|403|Unauthorized|Forbidden/i.test(msg)) return true;
  const ctx = error && typeof error === "object" && "context" in error
    ? (error as { context?: { status?: number } }).context
    : undefined;
  const status = ctx?.status;
  if (status === 401 || status === 403) return true;
  return false;
}

/** More attempts for Gemini-backed actions (intermittent 500 / cold starts / quota bursts). */
const ACTION_MAX_ATTEMPTS: Record<string, number> = {
  "parse-cv": 3,
  "optimize-cv": 3,
  "analyze-job": 3,
  "generate-networking-queries": 2,
  "generate-networking-message": 2,
};

// Helper to call the Secure Edge Function
async function callBackend(action: string, payload: any, token?: string): Promise<any> {
  const maxAttempts = ACTION_MAX_ATTEMPTS[action] ?? 1;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  let lastMessage = "Erreur de communication avec le serveur sécurisé.";

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data, error } = await supabase.functions.invoke("career-match-api", {
      body: {
        action,
        payload,
      },
      headers,
    });

    if (!error) {
      return data;
    }

    lastMessage = error.message || lastMessage;
    console.error(`🔥 Secure Backend Error (${action}):`, error);

    if (isNonRetryableInvokeError(error)) {
      throw new Error(lastMessage);
    }

    if (attempt < maxAttempts - 1) {
      const waitMs = 1200 * 2 ** attempt;
      console.warn(`↻ ${action} nouvel essai ${attempt + 2}/${maxAttempts} dans ${waitMs}ms`);
      await delay(waitMs);
    }
  }

  throw new Error(lastMessage);
}

/**
 * Convertit le fichier en Base64 compatible
 */
async function fileToGenerativePart(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (!base64String) {
        reject(new Error("Impossible de lire le fichier."));
        return;
      }
      // Remove data url prefix (e.g. "data:application/pdf;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        data: base64Data,
        mimeType: file.type
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

    // Server handles the prompt and model
    const responseData = await callBackend('parse-cv', {
      fileData: filePart.data,
      mimeType: filePart.mimeType
    }, token);

    const raw =
      typeof responseData?.text === "string" ? responseData.text.trim() : "";
    if (!raw) {
      throw new Error("Réponse d'analyse vide.");
    }
    return JSON.parse(raw) as ParsedCV;

  } catch (error) {
    console.error("❌ Erreur Parsing (Secure):", error);
    throw error;
  }
}

export async function matchAndOptimize(cv: ParsedCV, job: JobAnalysis, _language: string = "French", token?: string): Promise<MatchResult> {
  console.log("🚀 Matching initialisé (Secure Backend)...", { hasToken: !!token });

  try {
    // Server handles the prompt and model
    const responseData = await callBackend('optimize-cv', {
      cv,
      job,
      language: _language
    }, token);

    const raw =
      typeof responseData?.text === "string" ? responseData.text.trim() : "";
    if (!raw) {
      throw new Error("Réponse de matching vide.");
    }
    const result = JSON.parse(raw) as MatchResult;
    return { ...result, analysisLanguage: _language as "English" | "French" };
  } catch (error) {
    console.error("❌ Erreur Matching (Secure):", error);
    throw error;
  }
}

// Renamed and specialized to match backend action
export async function analyzeJobPosting(description: string, language: string, token?: string): Promise<JobAnalysis> {
  console.log("🚀 Analyze Job initialisé (Secure Backend)...", { hasToken: !!token });

  try {
    const responseData = await callBackend('analyze-job', {
      description,
      language
    }, token);

    const raw =
      typeof responseData?.text === "string" ? responseData.text.trim() : "";
    if (!raw) {
      throw new Error("Réponse d'analyse d'offre vide.");
    }
    return JSON.parse(raw) as JobAnalysis;
  } catch (error) {
    console.error("❌ Erreur Job Analysis (Secure):", error);
    throw error;
  }
}

export interface NetworkingQueriesResponse {
  role_synonyms: string[];
  keywords: {
    gatekeeper: string;
    peer: string;
    decision_maker: string;
    email_finder?: string;
  };
}

export async function generateNetworkingQueries(
  company: string,
  role: string,
  location: string = "",
  token?: string,
  language: string = "fr"
): Promise<NetworkingQueriesResponse> {
  console.log("🚀 Génération requêtes (Secure Backend)...", { hasToken: !!token, language });

  try {
    const responseData = await callBackend('generate-networking-queries', {
      company,
      role,
      location,
      language
    }, token);

    const raw =
      typeof responseData?.text === "string" ? responseData.text.trim() : "";
    if (!raw) {
      throw new Error("Réponse requêtes réseau vide.");
    }
    return JSON.parse(raw) as NetworkingQueriesResponse;
  } catch (error) {
    console.error("❌ Erreur Requêtes (Secure):", error);
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

  try {
    const responseData = await callBackend('generate-networking-message', {
      cvData,
      jobDescription,
      contactRole,
      contactCompany,
      templateType
    }, token);

    return responseData.text;
  } catch (error) {
    console.error("❌ Erreur Message (Secure):", error);
    throw error;
  }
}
