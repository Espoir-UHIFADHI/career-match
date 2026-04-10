import { GoogleGenerativeAI } from "@google/generative-ai";
import { readRootEnvVar } from "./_lib/read-root-env.mjs";

const apiKey =
  readRootEnvVar("VITE_GEMINI_API_KEY") || readRootEnvVar("GEMINI_API_KEY");

if (!apiKey) {
  console.error("❌ VITE_GEMINI_API_KEY (ou GEMINI_API_KEY) manquant dans .env à la racine.");
  process.exit(1);
}

console.log(`🔑 API Key found (length: ${apiKey.length})`);

const genAI = new GoogleGenerativeAI(apiKey);

async function testModels() {
  const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-1.0-pro",
  ];

  console.log("\n🧪 Testing Models Availability:");
  console.log("--------------------------------");

  let workingModel = null;

  for (const modelName of modelsToTest) {
    process.stdout.write(`Testing ${modelName.padEnd(25)} ... `);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      await model.generateContent("Hello");
      console.log("✅ AVAILABLE");
      if (!workingModel) workingModel = modelName;
    } catch (e) {
      let errorMsg = e.message || "Unknown error";
      if (errorMsg.includes("404")) errorMsg = "404 Not Found";
      console.log(`❌ FAILED (${errorMsg.split("\n")[0].substring(0, 50)}...)`);
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
