import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY for Gemini is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const parseShiftWithAI = async (text: string): Promise<string> => {
    if (!API_KEY) {
        throw new Error("API key not configured.");
    }
    if (!text) {
        return "";
    }

    const systemInstruction = `
### TAREA
Eres un asistente experto para un camarero que registra sus horas. Tu única tarea es convertir una descripción hablada de un turno de trabajo en un formato de texto estandarizado.

### FORMATO
- Turno único: \`HH-HH\` (ej: \`10-18\`)
- Turno partido: \`HH-HH HH-HH\` (ej: \`12-16 20-23\`)
- Horas decimales: Usa un punto (ej: \`10.5\` para las diez y media).
- Cierre: Usa 'C' para el cierre, que equivale a las 24:00 (ej: \`20-C\`).

### REGLAS
1.  Tu respuesta debe contener ÚNICAMENTE el texto del turno en el formato especificado.
2.  NO incluyas NUNCA explicaciones, saludos, o texto adicional como "Aquí tienes el turno:".
3.  Si la entrada no describe un turno (ej: "hoy libro", "no trabajo") o no la entiendes, devuelve un string vacío \`""\`.
4.  Interpreta las horas de la tarde/noche en formato 24h (ej: "dos de la tarde" es 14, "ocho de la noche" es 20).

### EJEMPLOS
- "Trabajé de doce a cuatro y de ocho a cierre" -> "12-16 20-C"
- "Mi turno fue de dos de la tarde a once de la noche" -> "14-23"
- "De 12 a 16 y de 20 a 23" -> "12-16 20-23"
- "De ocho de la tarde a cierre" -> "20-C"
- "Hice de diez a dos y media" -> "10-14.5"
- "Hoy no trabajo" -> ""
- "Libré" -> ""
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: text,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0,
            }
        });

        // Defensive check: The API response might be blocked or empty,
        // leading to `response.text` being undefined.
        if (!response || !response.text) {
            console.warn("AI response is empty or invalid, possibly due to content filtering.");
            return "";
        }

        return response.text.trim();
       
    } catch (error) {
        console.error("Error parsing shift with AI:", error);
        throw new Error("Failed to communicate with AI service.");
    }
};