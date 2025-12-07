import { supabase, createClerkSupabaseClient } from "../supabase";

export interface SearchResult {
    title: string;
    link: string;
    snippet: string;
    date?: string; // Optional
    source?: string; // Optional
    imageUrl?: string; // Optional
}

export async function searchGoogle(query: string, num: number = 10, start: number = 0, token?: string): Promise<SearchResult[]> {
    console.log("🚀 Serper Search (Secure Backend)...", { query, hasToken: !!token });

    // Use authenticated client if token is available, otherwise fall back to anonymous (which will likely fail per RLS/Function policies, but valid fallback)
    const client = token ? createClerkSupabaseClient(token) : supabase;

    const { data: result, error } = await client.functions.invoke('career-match-api', {
        body: {
            action: 'serper-search',
            payload: { q: query, num, start }
        }
    });

    if (error) {
        // Log detailed error from Supabase RPC
        console.error("🔥 Secure Search Error:", error);
        throw new Error(error.message || "Erreur de recherche sécurisée.");
    }

    if (!result.organic || result.organic.length === 0) {
        console.warn("Serper returned no organic results");
        return [];
    }

    return result.organic.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        date: item.date,
        source: item.source,
    }));
}

export async function searchLinkedIn(company: string, role: string, num: number = 10, start: number = 0, token?: string): Promise<SearchResult[]> {
    const query = `site:linkedin.com/in/ "${company}" "${role}" -intitle:jobs`;
    return searchGoogle(query, num, start, token);
}
