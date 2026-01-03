import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("Gemini API key is not set. Please check your .env file.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function generateText(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating text with Gemini:", error);
    throw error;
  }
}

export async function generateTextWithContext(prompt, context) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent([
      {
        role: "user",
        parts: [{ text: prompt }],
      },
      {
        role: "model",
        parts: [{ text: context }],
      },
    ]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating text with context:", error);
    throw error;
  }
}
