const https = require('https');

const API_KEY = "8ce6260e3a67f06d6ebc8b569b9972ca2d74a3f8";

function search(query, num = 10) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            q: query,
            num: num,
            gl: "fr",
            hl: "fr"
        });

        const options = {
            hostname: 'google.serper.dev',
            path: '/search',
            method: 'POST',
            headers: {
                'X-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve(json.organic || []);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log("Starting Tests...\n");

    // Test 1: No Quotes, Num 10
    console.log("Test 1: No Quotes, Num 10");
    const q1 = "site:linkedin.com/in/ CIMPA Recruiter OR CTO Paris";
    try {
        const r1 = await search(q1, 10);
        console.log(`Results: ${r1.length}`);
        if (r1.length > 0) console.log(`First result: ${r1[0].title}`);
    } catch (e) { console.error(e); }
    console.log("-".repeat(20));

    // Test 2: No Quotes, Num 25
    console.log("Test 2: No Quotes, Num 25");
    const q2 = "site:linkedin.com/in/ CIMPA Recruiter OR CTO Paris";
    try {
        const r2 = await search(q2, 25);
        console.log(`Results: ${r2.length}`);
        if (r2.length > 0) console.log(`First result: ${r2[0].title}`);
    } catch (e) { console.error(e); }
    console.log("-".repeat(20));

    // Test 3: Quotes, Num 10
    console.log("Test 3: Quotes, Num 10");
    const q3 = 'site:linkedin.com/in/ "CIMPA" "Recruiter or CTO" "Paris"';
    try {
        const r3 = await search(q3, 10);
        console.log(`Results: ${r3.length}`);
        if (r3.length > 0) console.log(`First result: ${r3[0].title}`);
    } catch (e) { console.error(e); }
    console.log("-".repeat(20));

    // Test 4: Broad Query (from refinement attempt)
    console.log("Test 4: Broad Query");
    const q4 = '(site:linkedin.com/in/ OR site:linkedin.com/pub/) CIMPA (Recruiter OR CTO) Paris -intitle:jobs -inurl:jobs -intitle:emploi -intitle:recrutement -intitle:offres';
    try {
        const r4 = await search(q4, 10);
        console.log(`Results: ${r4.length}`);
        if (r4.length > 0) console.log(`First result: ${r4[0].title}`);
    } catch (e) { console.error(e); }
    console.log("-".repeat(20));
}

runTests();
