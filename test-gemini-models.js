import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY not found in env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Checking gemini-1.5-flash...", model);
    // There isn't a direct "listModels" on the client usually,
    // but specific errors tell us.
    // However, older docs say fetching models needs REST or specific admin SDK.
    // Let's try to just generate content with a known fallback like 'gemini-1.0-pro'
    // or just print what we are using.

    // Actually, let's try to use the `gemini-pro` alias again but print strict error if it fails?
    // No, user error showed v1beta/models/gemini-1.5-flash not found.

    // Let's try to make a simple request to 'gemini-pro' (1.0) and see.
    const model1 = genAI.getGenerativeModel({ model: "gemini-pro" });
    console.log("Testing gemini-pro...");
    await model1.generateContent("Test");
    console.log("gemini-pro works!");
  } catch (e) {
    console.error("Error:", e.message);
  }

  try {
    const model2 = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });
    console.log("Testing gemini-1.5-flash-latest...");
    await model2.generateContent("Test");
    console.log("gemini-1.5-flash-latest works!");
  } catch (e) {
    console.error("Error:", e.message);
  }
}

listModels();
