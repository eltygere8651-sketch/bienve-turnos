import { GoogleGenAI } from "@google/genai";

// This check is important for environments where API_KEY might not be set.
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.warn("Gemini API key is not configured. Voice input feature will be disabled.");
}

// Initialize Gemini only if the API key is available
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const SYSTEM_INSTRUCTION = `
You are an expert assistant for a hospitality work schedule app called "Bienve App".
Your task is to parse a user's spoken phrase in Spanish and convert it into a structured shift string.

Rules for the output format:
- The format is 'HH-HH' for a single shift part, or 'HH-HH HH-HH' for a split shift.
- 'HH' should be a number from 0 to 23. Use leading zeros if needed (e.g., '08').
- Decimals or half-hours can be represented (e.g., '12.5-16').
- "Cierre" (closing) or its abbreviation "C" must be represented as just 'C'. For example, "de ocho a cierre" becomes "20-C".
- If the user says something that is not a shift, return an empty string.
- Only return the final shift string, with no extra text, explanations, or markdown.

Examples:
- User: "de doce a cuatro y de ocho a cierre" -> Output: "12-16 20-C"
- User: "turno de mañana de 8 a 4" -> Output: "08-16"
- User: "hoy libro" -> Output: ""
- User: "de diez de la noche a seis de la mañana" -> Output: "22-06"
- User: "doce y media a cinco" -> Output: "12.5-17"
- User: "12 a 16 y de 20 a 23" -> Output: "12-16 20-23"
`;

export const parseShiftWithGemini = async (text: string): Promise<string> => {
    if (!ai) {
        throw new Error("Gemini AI service is not initialized. Check API_KEY.");
    }
    if (!text) return '';

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Parse this shift: "${text}"`,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0, // We want deterministic output
            }
        });
        
        const resultText = response.text.trim();
        // Basic validation to ensure the output looks like a shift
        if (/^[\d\s\.-C,]+$/.test(resultText) || resultText === '') {
            return resultText;
        }
        console.warn("Gemini returned a non-standard shift format:", resultText);
        return ''; // Return empty if format is weird
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to parse shift with AI. Please try again or enter manually.");
    }
};
