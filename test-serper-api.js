// Test script to verify Serper API key
require('dotenv').config();

const API_KEY = process.env.VITE_SERPER_API_KEY;

console.log("=== Serper API Test ===\n");

if (!API_KEY) {
    console.error("❌ ERROR: VITE_SERPER_API_KEY not found in .env file");
    console.log("Please add your Serper API key to the .env file:");
    console.log('VITE_SERPER_API_KEY="your-api-key-here"');
    process.exit(1);
}

console.log("✓ API Key found:", API_KEY.substring(0, 10) + "..." + API_KEY.substring(API_KEY.length - 5));

const testQuery = 'site:linkedin.com/in/ Google Recruiter';

console.log("\nTesting query:", testQuery);
console.log("\nSending request to Serper API...\n");

const myHeaders = new Headers();
myHeaders.append("X-API-KEY", API_KEY);
myHeaders.append("Content-Type", "application/json");

const raw = JSON.stringify({
    q: testQuery,
    num: 5,
    start: 0,
});

const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
};

fetch("https://google.serper.dev/search", requestOptions)
    .then(async (response) => {
        console.log("Response Status:", response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("\n❌ API Error Response:");
            console.error("Status:", response.status);
            console.error("Body:", errorText);

            if (response.status === 401) {
                console.error("\n⚠️  Your API key appears to be invalid or expired.");
                console.error("Please check your key at https://serper.dev");
            } else if (response.status === 429) {
                console.error("\n⚠️  Rate limit exceeded. You may have used up your quota.");
                console.error("Check your usage at https://serper.dev");
            }

            process.exit(1);
        }

        return response.json();
    })
    .then((result) => {
        console.log("\n✅ Success! API is working.\n");
        console.log("Search Parameters:", result.searchParameters);
        console.log("\nOrganic Results Count:", result.organic?.length || 0);

        if (result.organic && result.organic.length > 0) {
            console.log("\n--- First 3 Results ---");
            result.organic.slice(0, 3).forEach((item, index) => {
                console.log(`\n${index + 1}. ${item.title}`);
                console.log(`   Link: ${item.link}`);
                console.log(`   Snippet: ${item.snippet?.substring(0, 100)}...`);
            });
        } else {
            console.log("\n⚠️  No organic results found for this query.");
            console.log("This might indicate:");
            console.log("- The query is too specific");
            console.log("- LinkedIn is blocking the search");
            console.log("- Temporary API issue");
        }

        console.log("\n=== Test Complete ===");
    })
    .catch((error) => {
        console.error("\n❌ Network Error:", error.message);
        console.error("\nPossible causes:");
        console.error("- No internet connection");
        console.error("- Firewall blocking the request");
        console.error("- Serper API is down");
        process.exit(1);
    });
