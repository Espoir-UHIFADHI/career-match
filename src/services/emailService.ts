import { searchGoogle } from "./search/serper";
import { supabase } from "./supabase";

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
        // 1. Check if input is already a domain (e.g. "google.com")
        if (companyName.includes(".") && !companyName.includes(" ")) {
            return companyName.toLowerCase();
        }

        // 2. Search for the domain
        // Use English query to prioritize global domains (e.g. "Google official website" -> google.com)
        // instead of "Site officiel Google" which might return google.fr
        const query = `"${companyName}" official website`;
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

    // 1. Check Global Cache (Supabase)
    try {
        const { data, error } = await supabase
            .from('domain_patterns')
            .select('pattern')
            .eq('domain', domain)
            .single();

        if (data?.pattern) {
            console.log(`[Hunter Cache] Global Hit for ${domain}`);
            return data.pattern;
        }
    } catch (e) {
        console.warn("Error checking global cache:", e);
    }

    // 2. Call API if not in cache
    try {
        const response = await fetch(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`);

        if (!response.ok) {
            console.error(`Hunter API Error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data: HunterResponse = await response.json();
        const pattern = data.data.pattern;

        // 3. Save to Global Cache
        if (pattern) {
            try {
                await supabase.from('domain_patterns').upsert({
                    domain,
                    pattern
                }, { onConflict: 'domain' });
                console.log(`[Hunter Cache] Saved for ${domain}`);
            } catch (e) {
                console.error("Error saving to global cache:", e);
            }
        }

        return pattern;
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
export function generateEmail(firstName: string, lastName: string, pattern: string, domain: string): string | null {
    if (!pattern || !domain || !firstName || !lastName) return null;

    // Basic validation: names shouldn't be too long or contain suspicious characters for a person name
    if (firstName.length > 30 || lastName.length > 30) return null;
    // If name contains comma, it's likely a title/sentence
    if (firstName.includes(",") || lastName.includes(",")) return null;

    // Normalize names: lowercase, remove accents, replace spaces with hyphens
    const cleanFirst = firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, "-");
    const cleanLast = lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, "-");

    if (!cleanFirst || !cleanLast) return null;

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

export interface VerificationResponse {
    data: {
        status: 'valid' | 'invalid' | 'accept_all' | 'webmail' | 'disposable' | 'unknown';
        result: string;
        score: number;
        email: string;
        regexp: boolean;
        gibberish: boolean;
        disposable: boolean;
        webmail: boolean;
        mx_records: boolean;
        smtp_server: boolean;
        smtp_check: boolean;
        accept_all: boolean;
        block: boolean;
        sources: any[];
    };
}

/**
 * Verifies an email address using Hunter.io
 * @param email The email to verify
 * @returns The verification result
 */
export async function verifyEmail(email: string): Promise<VerificationResponse['data'] | null> {
    if (!HUNTER_API_KEY) {
        console.error("Hunter API Key is missing");
        return null;
    }

    try {
        const response = await fetch(`https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${HUNTER_API_KEY}`);

        if (!response.ok) {
            console.error(`Hunter API Error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data: VerificationResponse = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error verifying email:", error);
        return null;
    }
}

export interface EmailFinderResponse {
    data: {
        email: string;
        score: number;
        domain: string;
        accept_all: boolean;
        webmail: boolean;
        disposable: boolean;
        sources: Array<{
            domain: string;
            uri: string;
            extracted_on: string;
            last_seen_on: string;
            still_on_page: boolean;
        }>;
        verification: {
            date: string;
            status: string;
        };
    };
    meta: {
        params: {
            first_name: string;
            last_name: string;
            domain: string;
        };
    };
}

/**
 * Finds the professional email address using Hunter.io Email Finder API
 * @param firstName First name
 * @param lastName Last name
 * @param domain Company domain
 * @returns The found email and details
 */
/**
 * Checks if an email is already in the global cache
 */
export async function getCachedEmail(firstName: string, lastName: string, domain: string): Promise<EmailFinderResponse['data'] | null> {
    try {
        // Normalize for search
        const cleanFirst = cleanName(firstName).toLowerCase();
        const cleanLast = cleanName(lastName).toLowerCase();

        const { data, error } = await supabase
            .from('found_emails')
            .select('*')
            .eq('first_name', cleanFirst)
            .eq('last_name', cleanLast)
            .eq('domain', domain)
            .single();

        if (data) {
            console.log(`[Hunter Cache] Email found in cache: ${data.email}`);
            return {
                email: data.email,
                score: data.score,
                domain: data.domain,
                accept_all: false, // Default values for cached items
                webmail: false,
                disposable: false,
                sources: [],
                verification: { date: data.created_at, status: data.status }
            };
        }
    } catch (e) {
        console.warn("Error checking email cache:", e);
    }
    return null;
}

/**
 * Finds the professional email address using Hunter.io Email Finder API
 * @param firstName First name
 * @param lastName Last name
 * @param domain Company domain
 * @returns The found email and details
 */
export async function findEmail(firstName: string, lastName: string, domain: string): Promise<EmailFinderResponse['data'] | null> {
    if (!HUNTER_API_KEY) {
        console.error("Hunter API Key is missing");
        return null;
    }

    const cleanFirst = cleanName(firstName);
    const cleanLast = cleanName(lastName);

    // 1. Check Global Cache first
    const cached = await getCachedEmail(cleanFirst, cleanLast, domain);
    if (cached) return cached;

    try {
        console.log(`[Hunter API] Searching for ${cleanFirst} ${cleanLast} at ${domain}...`);
        const response = await fetch(`https://api.hunter.io/v2/email-finder?domain=${domain}&first_name=${encodeURIComponent(cleanFirst)}&last_name=${encodeURIComponent(cleanLast)}&api_key=${HUNTER_API_KEY}`);

        if (!response.ok) {
            console.error(`Hunter API Error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data: EmailFinderResponse = await response.json();

        if (data.data && data.data.email) {
            console.log(`[Hunter API] Result found: ${data.data.email} (Score: ${data.data.score})`);

            // 2. Save to Global Cache
            try {
                await supabase.from('found_emails').upsert({
                    email: data.data.email,
                    first_name: cleanFirst.toLowerCase(),
                    last_name: cleanLast.toLowerCase(),
                    domain: domain,
                    score: data.data.score,
                    status: data.data.verification?.status || 'unknown',
                    source: 'hunter'
                }, { onConflict: 'email' });
            } catch (e) {
                console.error("Error saving email to cache:", e);
            }
        } else {
            console.log(`[Hunter API] No result found for ${cleanFirst} ${cleanLast}`);
        }

        return data.data;
    } catch (error) {
        console.error("Error finding email:", error);
        return null;
    }
}

/**
 * Cleans a name by removing emojis, titles, and common suffixes
 * @param name The raw name string (e.g. "Mohit Bhatia PMP®")
 * @returns The cleaned name (e.g. "Mohit Bhatia")
 */
export function cleanName(name: string): string {
    if (!name) return "";

    let cleaned = name;

    // 1. Remove emojis and symbols
    cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B50}\u{200D}\u{FE0F}]/gu, "");
    cleaned = cleaned.replace(/[®™©•|]/g, "");

    // 2. Remove common titles and suffixes (case insensitive)
    const suffixes = [
        "PMP", "MBA", "PhD", "MSc", "CPA", "CFA", "CSM", "PSM", "ACP",
        "Prince2", "ITIL", "AWS", "Azure", "GCP", "CISSP", "CISA", "CISM",
        "Consultant", "Manager", "Director", "VP", "President", "Head", "Lead", "Chief", "Officer"
    ];

    // Remove text after common separators if it looks like a title/company
    // e.g. "John Doe - Manager" -> "John Doe"
    // e.g. "John Doe | PMP" -> "John Doe"
    cleaned = cleaned.split(/ [-|•] /)[0];

    // Remove specific suffixes if they are at the end of the string
    for (const suffix of suffixes) {
        const regex = new RegExp(`\\b${suffix}\\b`, "gi");
        cleaned = cleaned.replace(regex, "");
    }

    // 3. Remove extra spaces
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    return cleaned;
}
