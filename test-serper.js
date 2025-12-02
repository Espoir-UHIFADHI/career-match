import fetch from 'node-fetch';

const API_KEY = "8ce6260e3a67f06d6ebc8b569b9972ca2d74a3f8";

async function searchGoogle(query) {
    const myHeaders = {
        "X-API-KEY": API_KEY,
        "Content-Type": "application/json"
    };

    const raw = JSON.stringify({
        q: query,
        num: 5
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

// Test with Jina AI Reader
async function testJina() {
    const url = "https://www.apec.fr/candidat/recherche-emploi.html/emploi/detail-offre/177689109W?utm_campaign=google_jobs_apply&utm_source=google_jobs_apply&utm_medium=organic";
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
