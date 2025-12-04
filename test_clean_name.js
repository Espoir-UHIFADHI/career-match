
function cleanName(name) {
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

console.log("Mohit Bhatia PMP® ->", cleanName("Mohit Bhatia PMP®"));
console.log("Sandrine Dalbegue ♠ Capgemini ->", cleanName("Sandrine Dalbegue ♠ Capgemini"));
console.log("Jean-Baptiste ARNAUD - VP ->", cleanName("Jean-Baptiste ARNAUD - VP"));
