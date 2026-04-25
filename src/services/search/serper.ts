import { supabase, createClerkSupabaseClient } from "../supabase";

export interface SearchResult {
    title: string;
    link: string;
    snippet: string;
    date?: string; // Optional
    source?: string; // Optional
    imageUrl?: string; // Optional
}

interface SerperOrganicResult {
    title?: string;
    link?: string;
    snippet?: string;
    date?: string;
    source?: string;
}

interface BatchSearchInput {
    query: string;
    label: string;
    num?: number;
    start?: number;
    dateFilter?: boolean;
}

export async function searchGoogle(query: string, num: number = 10, start: number = 0, token?: string, dateFilter: boolean = false, language: string = 'fr'): Promise<SearchResult[]> {
    console.log("🚀 Serper Search (Secure Backend)...", { query, hasToken: !!token, language });

    // Use authenticated client if token is available, otherwise fall back to anonymous (which will likely fail per RLS/Function policies, but valid fallback)
    const client = token ? createClerkSupabaseClient(token) : supabase;

    const { data: result, error } = await client.functions.invoke('career-match-api', {
        body: {
            action: 'serper-search',
            payload: { q: query, num, start, tbs: dateFilter ? 'qdr:y' : undefined, language }
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

    return (result.organic as SerperOrganicResult[]).map((item) => ({
        title: item.title || "",
        link: item.link || "",
        snippet: item.snippet || "",
        date: item.date,
        source: item.source,
    })).filter((item) => item.title && item.link);
}

export async function searchGoogleBatch(searches: BatchSearchInput[], token?: string, language: string = 'fr'): Promise<Array<SearchResult & { queryLabel: string }>> {
    if (searches.length === 0) return [];

    const client = token ? createClerkSupabaseClient(token) : supabase;
    const { data: result, error } = await client.functions.invoke('career-match-api', {
        body: {
            action: 'serper-batch-search',
            payload: {
                language,
                searches: searches.map((item) => ({
                    q: item.query,
                    label: item.label,
                    num: item.num ?? 10,
                    start: item.start ?? 0,
                    tbs: item.dateFilter ? 'qdr:y' : undefined,
                    language,
                })),
            },
        },
    });

    if (error) {
        console.error("🔥 Secure Batch Search Error:", error);
        throw new Error(error.message || "Erreur de recherche sécurisée.");
    }

    const batches = Array.isArray(result?.results) ? result.results : [];
    return batches.flatMap((batch: { label?: string; data?: { organic?: SerperOrganicResult[] } }) => {
        const organic = Array.isArray(batch.data?.organic) ? batch.data.organic : [];
        return organic
            .map((item) => ({
                title: item.title || "",
                link: item.link || "",
                snippet: item.snippet || "",
                date: item.date,
                source: item.source,
                queryLabel: batch.label || "",
            }))
            .filter((item) => item.title && item.link);
    });
}

export async function searchLinkedIn(company: string, role: string, num: number = 10, start: number = 0, token?: string): Promise<SearchResult[]> {
    const query = `site:linkedin.com/in/ "${company}" "${role}" -intitle:jobs`;
    return searchGoogle(query, num, start, token);
}
