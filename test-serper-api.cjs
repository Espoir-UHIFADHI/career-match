// Test script to verify Serper API key (CommonJS version)
const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '.env');
let API_KEY = null;

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/VITE_SERPER_API_KEY\s*=\s*"?([^"\r\n]+)"?/);
    if (match) {
        API_KEY = match[1];
    }
} catch (error) {
    console.error("❌ Could not read .env file:", error.message);
}

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

const postData = JSON.stringify({
    q: testQuery,
    num: 5,
    start: 0,
});

const options = {
    hostname: 'google.serper.dev',
    port: 443,
    path: '/search',
    method: 'POST',
    headers: {
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = https.request(options, (res) => {
    console.log("Response Status:", res.statusCode, res.statusMessage);

    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error("\n❌ API Error Response:");
            console.error("Status:", res.statusCode);
            console.error("Body:", data);

            if (res.statusCode === 401) {
                console.error("\n⚠️  Your API key appears to be invalid or expired.");
                console.error("Please check your key at https://serper.dev");
            } else if (res.statusCode === 429) {
                console.error("\n⚠️  Rate limit exceeded. You may have used up your quota.");
                console.error("Check your usage at https://serper.dev");
            }

            process.exit(1);
        }

        try {
            const result = JSON.parse(data);

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
        } catch (error) {
            console.error("\n❌ Failed to parse response:", error.message);
            console.error("Response data:", data);
            process.exit(1);
        }
    });
});

req.on('error', (error) => {
    console.error("\n❌ Network Error:", error.message);
    console.error("\nPossible causes:");
    console.error("- No internet connection");
    console.error("- Firewall blocking the request");
    console.error("- Serper API is down");
    process.exit(1);
});

req.write(postData);
req.end();
