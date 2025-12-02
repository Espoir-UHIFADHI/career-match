const API_KEY = import.meta.env.VITE_SERPER_API_KEY;

if (!API_KEY) {
    console.warn("Missing VITE_SERPER_API_KEY in .env");
}

export interface SearchResult {
    title: string;
    link: string;
    snippet: string;
    date?: string;
    source?: string;
    imageUrl?: string;
}

export async function searchGoogle(query: string, num: number = 10, start: number = 0): Promise<SearchResult[]> {
    if (!API_KEY) throw new Error("Missing Serper API Key");

    const myHeaders = new Headers();
    myHeaders.append("X-API-KEY", API_KEY);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
        q: query,
        num: num,
        start: start,
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
    };

    try {
        console.log("Serper API Request:", { query, num, start }); // Debug log
        const response = await fetch("https://google.serper.dev/search", requestOptions);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Serper API Error Response:", {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`Serper API Error (${response.status}): ${response.statusText}. ${errorText}`);
        }

        const result = await response.json();
        console.log("Serper API Response:", {
            hasOrganic: !!result.organic,
            organicCount: result.organic?.length || 0,
            searchParameters: result.searchParameters
        }); // Debug log

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
    } catch (error) {
        console.error("Serper Error:", error);
        throw error;
    }
}

export async function searchLinkedIn(company: string, role: string, num: number = 10, start: number = 0): Promise<SearchResult[]> {
    const query = `site:linkedin.com/in/ "${company}" "${role}" -intitle:jobs`;
    return searchGoogle(query, num, start);
}
