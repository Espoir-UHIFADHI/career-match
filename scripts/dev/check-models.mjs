import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { readRootEnvVar } from "./_lib/read-root-env.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.join(__dirname, "_output");
const outFile = path.join(outDir, "models_output.txt");

const apiKey =
  readRootEnvVar("VITE_GEMINI_API_KEY") || readRootEnvVar("GEMINI_API_KEY");

if (!apiKey) {
  console.error(
    "❌ Définissez VITE_GEMINI_API_KEY ou GEMINI_API_KEY dans le .env à la racine."
  );
  process.exit(1);
}

async function run() {
  console.log("Checking available models...");
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    if (data.models) {
      const output = JSON.stringify(
        data.models.map((m) => m.name),
        null,
        2
      );
      console.log("Available models:", output);
      fs.writeFileSync(outFile, output);
      console.log("Written:", outFile);
    } else {
      const error = JSON.stringify(data, null, 2);
      console.log("No models found or error:", error);
      fs.writeFileSync(outFile, error);
      console.log("Written:", outFile);
    }
  } catch (error) {
    console.error("Error listing models:", error);
    process.exit(1);
  }
}

run();
