import { searchGoogle } from "./search/serper";

const HUNTER_API_KEY = import.meta.env.VITE_HUNTER_API_KEY;

if (!HUNTER_API_KEY) {
    console.warn("Missing VITE_HUNTER_API_KEY in .env");
}

interface HunterResponse {
    data: {
        pattern: string | null;
        domain: string;
        webmail: boolean;
        organization: string;
    };
    meta: {
        params: {
            domain: string;
        };
    };
}

/**
 * Finds the company domain using Serper API
 * @param companyName Name of the company (e.g. "CIMPA")
 * @returns The domain name (e.g. "cimpa.com") or null if not found
 */
export async function findCompanyDomain(companyName: string): Promise<string | null> {
    try {
        const query = `Site officiel ${companyName}`;
        const results = await searchGoogle(query, 1);

        if (results && results.length > 0) {
            const link = results[0].link;
            try {
                const url = new URL(link);
                return url.hostname.replace(/^www\./, "");
            } catch (e) {
                console.error("Error parsing URL:", link);
                return null;
            }
        }
        return null;
    } catch (error) {
        console.error("Error finding company domain:", error);
        return null;
    }
}

/**
 * Gets the email pattern for a domain using Hunter.io
 * @param domain The domain name (e.g. "cimpa.com")
 * @returns The email pattern (e.g. "{first}.{last}") or null
 */
export async function getEmailPattern(domain: string): Promise<string | null> {
    if (!HUNTER_API_KEY) {
        console.error("Hunter API Key is missing");
        return null;
    }

    try {
        const response = await fetch(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`);

        if (!response.ok) {
            console.error(`Hunter API Error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data: HunterResponse = await response.json();
        return data.data.pattern;
    } catch (error) {
        console.error("Error fetching email pattern:", error);
        return null;
    }
}

/**
 * Generates an email based on the pattern
 * @param firstName First name
 * @param lastName Last name
 * @param pattern Email pattern (e.g. "{first}.{last}")
 * @param domain Company domain
 * @returns The generated email
 */
export function generateEmail(firstName: string, lastName: string, pattern: string, domain: string): string {
    if (!pattern || !domain) return "";

    // Normalize names: lowercase, remove accents, remove spaces
    const cleanFirst = firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
    const cleanLast = lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
    const firstInitial = cleanFirst.charAt(0);
    const lastInitial = cleanLast.charAt(0);

    let emailUser = pattern;

    // Replace variables in pattern
    // Common patterns: {first}, {last}, {f}, {l}
    emailUser = emailUser.replace("{first}", cleanFirst);
    emailUser = emailUser.replace("{last}", cleanLast);
    emailUser = emailUser.replace("{f}", firstInitial);
    emailUser = emailUser.replace("{l}", lastInitial);

    return `${emailUser}@${domain}`;
}

/**
 * Formats the email pattern for display
 * @param pattern The raw pattern from Hunter (e.g. "{first}.{last}")
 * @returns User friendly pattern (e.g. "{Prénom}.{Nom}")
 */
export function formatEmailPattern(pattern: string): string {
    if (!pattern) return "";
    return pattern
        .replace("{first}", "{Prénom}")
        .replace("{last}", "{Nom}")
        .replace("{f}", "{P}")
        .replace("{l}", "{N}");
}
