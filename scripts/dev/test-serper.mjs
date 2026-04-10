import fetch from "node-fetch";
import { readRootEnvVar } from "./_lib/read-root-env.mjs";

const API_KEY = readRootEnvVar("VITE_SERPER_API_KEY") || readRootEnvVar("SERPER_API_KEY");

if (!API_KEY) {
  console.error("❌ VITE_SERPER_API_KEY (ou SERPER_API_KEY) manquant dans .env à la racine.");
  process.exit(1);
}

async function searchGoogle(query) {
  const myHeaders = {
    "X-API-KEY": API_KEY,
    "Content-Type": "application/json",
  };

  const raw = JSON.stringify({
    q: query,
    num: 5,
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
  };

  try {
    const response = await fetch("https://google.serper.dev/search", requestOptions);
    const result = await response.json();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

async function testJina() {
  const url =
    "https://www.apec.fr/candidat/recherche-emploi.html/emploi/detail-offre/177689109W?utm_campaign=google_jobs_apply&utm_source=google_jobs_apply&utm_medium=organic";
  try {
    const response = await fetch("https://r.jina.ai/" + url);
    const text = await response.text();
    console.log("Jina Response Length:", text.length);
    console.log("Jina Preview:", text.substring(0, 500));
  } catch (error) {
    console.error("Jina Error:", error);
  }
}

testJina();
