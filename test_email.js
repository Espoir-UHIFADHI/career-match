
function generateEmail(firstName, lastName, pattern, domain) {
    if (!pattern || !domain || !firstName || !lastName) return null;

    // Basic validation
    if (firstName.length > 30 || lastName.length > 30) return null;
    if (firstName.includes(",") || lastName.includes(",")) return null;

    // Normalize names: lowercase, remove accents, remove spaces
    const cleanFirst = firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
    const cleanLast = lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");

    if (!cleanFirst || !cleanLast) return null;

    const firstInitial = cleanFirst.charAt(0);
    const lastInitial = cleanLast.charAt(0);

    let emailUser = pattern;

    emailUser = emailUser.replace("{first}", cleanFirst);
    emailUser = emailUser.replace("{last}", cleanLast);
    emailUser = emailUser.replace("{f}", firstInitial);
    emailUser = emailUser.replace("{l}", lastInitial);

    return `${emailUser}@${domain}`;
}

console.log("Joseph Odon RALAIVAO ->", generateEmail("Joseph Odon", "RALAIVAO", "{first}.{last}", "company.com"));
console.log("Joseph-Odon RALAIVAO ->", generateEmail("Joseph-Odon", "RALAIVAO", "{first}.{last}", "company.com"));
