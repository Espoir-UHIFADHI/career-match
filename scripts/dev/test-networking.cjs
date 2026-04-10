/**
 * Tests requêtes Serper (networking). Exécuter depuis la racine du dépôt :
 *   node scripts/dev/test-networking.cjs
 */
const https = require("https");
const fs = require("fs");
const path = require("path");

function loadSerperKey() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return null;
  const raw = fs.readFileSync(envPath, "utf8");
  const m =
    raw.match(/VITE_SERPER_API_KEY\s*=\s*"?([^"\r\n]+)"?/) ||
    raw.match(/SERPER_API_KEY\s*=\s*"?([^"\r\n]+)"?/);
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
}

const API_KEY = loadSerperKey();
if (!API_KEY) {
  console.error("❌ VITE_SERPER_API_KEY ou SERPER_API_KEY manquant dans .env à la racine.");
  process.exit(1);
}

function search(query, num = 10) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      q: query,
      num: num,
      gl: "fr",
      hl: "fr",
    });

    const options = {
      hostname: "google.serper.dev",
      path: "/search",
      method: "POST",
      headers: {
        "X-API-KEY": API_KEY,
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          resolve(json.organic || []);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", (e) => reject(e));
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log("Starting Tests...\n");

  const q1 = "site:linkedin.com/in/ CIMPA Recruiter OR CTO Paris";
  console.log("Test 1: No Quotes, Num 10");
  try {
    const r1 = await search(q1, 10);
    console.log(`Results: ${r1.length}`);
    if (r1.length > 0) console.log(`First result: ${r1[0].title}`);
  } catch (e) {
    console.error(e);
  }
  console.log("-".repeat(20));

  const q2 = "site:linkedin.com/in/ CIMPA Recruiter OR CTO Paris";
  console.log("Test 2: No Quotes, Num 25");
  try {
    const r2 = await search(q2, 25);
    console.log(`Results: ${r2.length}`);
    if (r2.length > 0) console.log(`First result: ${r2[0].title}`);
  } catch (e) {
    console.error(e);
  }
  console.log("-".repeat(20));

  const q3 = 'site:linkedin.com/in/ "CIMPA" "Recruiter or CTO" "Paris"';
  console.log("Test 3: Quotes, Num 10");
  try {
    const r3 = await search(q3, 10);
    console.log(`Results: ${r3.length}`);
    if (r3.length > 0) console.log(`First result: ${r3[0].title}`);
  } catch (e) {
    console.error(e);
  }
  console.log("-".repeat(20));

  const q4 =
    "(site:linkedin.com/in/ OR site:linkedin.com/pub/) CIMPA (Recruiter OR CTO) Paris -intitle:jobs -inurl:jobs -intitle:emploi -intitle:recrutement -intitle:offres";
  console.log("Test 4: Broad Query");
  try {
    const r4 = await search(q4, 10);
    console.log(`Results: ${r4.length}`);
    if (r4.length > 0) console.log(`First result: ${r4[0].title}`);
  } catch (e) {
    console.error(e);
  }
  console.log("-".repeat(20));
}

runTests();
