import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const API_KEY = "AIzaSyCy-MVQBKSKmk-SQCD1RMikEchEB4DBbiw";

async function run() {
    console.log("Checking available models...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            const output = JSON.stringify(data.models.map(m => m.name), null, 2);
            console.log("Available models:", output);
            fs.writeFileSync('models_output.txt', output);
        } else {
            const error = JSON.stringify(data, null, 2);
            console.log("No models found or error:", error);
            fs.writeFileSync('models_output.txt', error);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

run();
