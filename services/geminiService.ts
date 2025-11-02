import { GoogleGenAI } from "@google/genai";

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = (reader.result as string).split(',')[1];
            resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const getShiftFromAudio = async (audioBlob: Blob): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API key for Gemini is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const audioData = await blobToBase64(audioBlob);
        
        const audioPart = {
            inlineData: {
                mimeType: audioBlob.type,
                data: audioData,
            },
        };

        const textPart = {
            text: `
                Eres un asistente para una app de horarios de trabajo. 
                Tu tarea es escuchar el audio, interpretar el horario de trabajo y devolverlo en un formato numérico estricto.
                - El formato debe ser 'HH-HH' para un turno simple o 'HH-HH HH-HH' para un turno partido.
                - 'Cierre' o 'C' siempre se traduce como 'C'.
                - Si el usuario dice "de ocho a cuatro", interpreta las 8AM y las 4PM.
                - Si dice "de diez de la noche a seis de la mañana", interpreta 22-06.
                - Asume un reloj de 24 horas para las tardes a menos que se especifique mañana. 'Las 8' por la tarde son las 20.
                - Ignora cualquier otra palabra que no sea parte del horario.
                - No respondas con frases, solo con el formato de horario.

                Ejemplos:
                - Audio: "de diez a dos y de ocho a once" -> Respuesta: "10-14 20-23"
                - Audio: "turno partido de doce a cuatro y de ocho a cierre" -> Respuesta: "12-16 20-C"
                - Audio: "mañana de ocho a cuatro de la tarde" -> Respuesta: "08-16"
                - Audio: "hoy libro" -> Respuesta: ""
            `,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, audioPart] },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error processing audio with Gemini:", error);
        throw new Error("No se pudo interpretar el audio. Por favor, inténtalo de nuevo.");
    }
};
