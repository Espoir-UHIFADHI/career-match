import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env manually from project root (one level up from src)
const envPath = path.resolve(__dirname, '../.env');
console.log(`📂 Looking for .env at: ${envPath}`);

let apiKey = '';

try {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
        if (match) {
            apiKey = match[1].trim();
            // Remove quotes if present
            apiKey = apiKey.replace(/^["']|["']$/g, '');
        }
    } else {
        console.log("❌ .env file does not exist at expected path.");
    }
} catch (e) {
    console.error("Could not read .env file:", e);
}

if (!apiKey) {
    console.error("❌ API Key not found in .env");
    process.exit(1);
}

console.log(`🔑 API Key found (length: ${apiKey.length})`);

const genAI = new GoogleGenerativeAI(apiKey);

async function testModels() {
    const modelsToTest = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-001',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro',
        'gemini-pro',
        'gemini-1.0-pro'
    ];

    console.log("\n🧪 Testing Models Availability:");
    console.log("--------------------------------");

    let workingModel = null;

    for (const modelName of modelsToTest) {
        process.stdout.write(`Testing ${modelName.padEnd(25)} ... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            // Try a minimal generation to verify access
            await model.generateContent("Hello");
            console.log("✅ AVAILABLE");
            if (!workingModel) workingModel = modelName;
        } catch (e) {
            let errorMsg = e.message || "Unknown error";
            if (errorMsg.includes("404")) errorMsg = "404 Not Found";
            console.log(`❌ FAILED (${errorMsg.split('\n')[0].substring(0, 50)}...)`);
        }
    }

    console.log("\n--------------------------------");
    if (workingModel) {
        console.log(`🚀 RECOMMENDED FIX: Use model "${workingModel}"`);
    } else {
        console.log("⚠️ NO WORKING MODELS FOUND. Check API Key permissions or Region.");
    }
}

testModels();
