function cleanName(name) {
  if (!name) return "";

  let cleaned = name;

  cleaned = cleaned.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B50}\u{200D}\u{FE0F}]/gu,
    ""
  );
  cleaned = cleaned.replace(/[®™©•|]/g, "");

  const suffixes = [
    "PMP", "MBA", "PhD", "MSc", "CPA", "CFA", "CSM", "PSM", "ACP",
    "Prince2", "ITIL", "AWS", "Azure", "GCP", "CISSP", "CISA", "CISM",
    "Consultant", "Manager", "Director", "VP", "President", "Head", "Lead", "Chief", "Officer",
  ];

  cleaned = cleaned.split(/ [-|•] /)[0];

  for (const suffix of suffixes) {
    const regex = new RegExp(`\\b${suffix}\\b`, "gi");
    cleaned = cleaned.replace(regex, "");
  }

  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

console.log("Mohit Bhatia PMP® ->", cleanName("Mohit Bhatia PMP®"));
console.log("Sandrine Dalbegue ♠ Capgemini ->", cleanName("Sandrine Dalbegue ♠ Capgemini"));
console.log("Jean-Baptiste ARNAUD - VP ->", cleanName("Jean-Baptiste ARNAUD - VP"));
