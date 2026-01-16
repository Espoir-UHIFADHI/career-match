import { supabase } from "../supabase";
import type { ParsedCV, JobAnalysis, MatchResult } from "../../types";

// Helper to call the Secure Edge Function
async function callBackend(action: string, payload: any, token?: string): Promise<any> {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const { data, error } = await supabase.functions.invoke('career-match-api', {
    body: {
      action,
      payload
    },
    headers: headers
  });

  if (error) {
    console.error(`🔥 Secure Backend Error (${action}):`, error);
    throw new Error(error.message || "Erreur de communication avec le serveur sécurisé.");
  }

  return data;
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

    return JSON.parse(responseData.text) as ParsedCV;

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

    const result = JSON.parse(responseData.text) as MatchResult;
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

    return JSON.parse(responseData.text) as JobAnalysis;
  } catch (error) {
    console.error("❌ Erreur Job Analysis (Secure):", error);
    throw error;
  }
}

export interface NetworkingQueriesResponse {
  gatekeeper: string[];
  peer: string[];
  decision_maker: string[];
  email_finder?: string[];
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

    return JSON.parse(responseData.text) as NetworkingQueriesResponse;
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
