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

async function callSearchBackend<T>(action: string, payload: Record<string, unknown>, token?: string): Promise<T> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
    if (!supabaseUrl) throw new Error("VITE_SUPABASE_URL manquant.");
    if (!token) throw new Error("Session invalide. Veuillez vous reconnecter.");

    const response = await fetch(`${supabaseUrl}/functions/v1/career-match-api`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, payload }),
    });

    const responseText = await response.text();
    let body: unknown = null;
    try {
        body = responseText ? JSON.parse(responseText) : null;
    } catch {
        body = responseText;
    }

    if (!response.ok) {
        const message =
            typeof body === "object" && body && "error" in body
                ? String((body as { error: unknown }).error)
                : String(body || response.statusText);
        throw new Error(message || `Erreur serveur (${response.status})`);
    }

    return body as T;
}

export async function searchGoogle(query: string, num: number = 10, start: number = 0, token?: string, dateFilter: boolean = false, language: string = 'fr'): Promise<SearchResult[]> {
    console.log("🚀 Serper Search (Secure Backend)...", { query, hasToken: !!token, language });

    const result = await callSearchBackend<{ organic?: SerperOrganicResult[] }>(
        "serper-search",
        { q: query, num, start, tbs: dateFilter ? 'qdr:y' : undefined, language },
        token
    );

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

    const result = await callSearchBackend<{ results?: Array<{ label?: string; data?: { organic?: SerperOrganicResult[] } }> }>(
        "serper-batch-search",
        {
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
        token
    );

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
