
import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

export const initializeGemini = (): boolean => {
    // FIX: The API key must be obtained exclusively from the environment variable process.env.API_KEY.
    if (!process.env.API_KEY) {
        console.warn("La clave de API de Gemini no está disponible. La función de voz estará deshabilitada.");
        ai = null;
        return false;
    }
    
    try {
        // FIX: Must use new GoogleGenAI({ apiKey: process.env.API_KEY }) as per strict initialization rules.
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        console.log("Servicio de Gemini inicializado correctamente.");
        return true;
    } catch (error) {
        console.error("No se pudo inicializar el servicio de Gemini AI:", error);
        ai = null;
        return false;
    }
};

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
        // Intentamos inicializar si no lo está
        if (!initializeGemini()) {
            throw new Error("El servicio de Gemini AI no está inicializado.");
        }
    }
    if (!text || !ai) return '';

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Parse this shift: "${text}"`,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0,
            }
        });
        
        // FIX: Correctly extracting text output from GenerateContentResponse using the .text property.
        const resultText = response.text || '';
        const trimmedResult = resultText.trim();
        
        if (/^[\d\s\.-C,]+$/.test(trimmedResult) || trimmedResult === '') {
            return trimmedResult;
        }
        console.warn("Gemini returned a non-standard shift format:", trimmedResult);
        return '';
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Error al procesar el turno con IA.");
    }
};
