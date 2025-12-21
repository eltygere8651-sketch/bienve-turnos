
import React, { useState } from 'react';
import { Day, DayStatus } from '../types';
import { SparklesIcon, ArrowPathIcon } from './icons';
import { GoogleGenAI, Type } from "@google/genai";

interface MagicInputModalProps {
    weekDays: Day[];
    onApply: (updatedWeek: Day[]) => void;
    onClose: () => void;
}

const MagicInputModal: React.FC<MagicInputModalProps> = ({ weekDays, onApply, onClose }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleMagicProcess = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Actualiza este horario semanal basado en mi petición: "${prompt}".
                Días actuales: ${JSON.stringify(weekDays.map(d => ({ date: d.date.toISOString(), shift: d.shift, status: d.status })))}
                
                Instrucciones:
                1. Devuelve un array JSON con los 7 días.
                2. Cada día debe tener "date", "shift" (ej: "12-16 20-C") y "status" (0 para trabajo, 1 para festivo, 2 para vacaciones).
                3. Si digo "toda la semana de mañana", pon 08-16 a todos menos los que ya son libres o especifique.
                4. Solo devuelve el JSON, nada de texto extra.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                date: { type: Type.STRING },
                                shift: { type: Type.STRING },
                                status: { type: Type.INTEGER }
                            },
                            required: ["date", "shift", "status"]
                        }
                    }
                }
            });

            const rawJson = JSON.parse(response.text);
            const updatedWeek = rawJson.map((d: any) => ({
                ...d,
                date: new Date(d.date)
            }));
            
            onApply(updatedWeek);
        } catch (err) {
            console.error(err);
            setError("La IA no pudo procesar tu petición. Intenta ser más específico.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-[32px] shadow-2xl w-full max-w-lg p-8 border border-white/10 animate-fade-in-scale-up"
                onClick={e => e.stopPropagation()}
            >
                <div className="text-center mb-8">
                    <div className="inline-flex bg-gradient-to-tr from-purple-600 to-blue-600 p-4 rounded-3xl mb-4 shadow-xl shadow-purple-500/20">
                        <SparklesIcon className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Asistente IA</h2>
                    <p className="text-gray-400 text-sm mt-2">Dime tus turnos y yo los organizo</p>
                </div>

                <div className="space-y-4">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder='Ej: "Esta semana trabajo de 12 a 16 y de 20 a cierre, pero el jueves libro"'
                        className="w-full bg-black/50 border-2 border-white/5 rounded-3xl p-6 text-white placeholder:text-gray-600 focus:border-purple-500 outline-none transition-all h-40 text-lg font-medium leading-relaxed shadow-inner"
                        disabled={isLoading}
                    />

                    {error && <p className="text-red-400 text-xs font-bold text-center animate-pulse uppercase tracking-widest">{error}</p>}

                    <div className="flex flex-col gap-3 pt-4">
                        <button 
                            onClick={handleMagicProcess}
                            disabled={isLoading || !prompt.trim()}
                            className="w-full bg-white text-black py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {isLoading ? (
                                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                            ) : (
                                <>Aplicar Magia</>
                            )}
                        </button>
                        <button 
                            onClick={onClose}
                            className="text-gray-500 text-[10px] font-black uppercase tracking-widest hover:text-white py-2"
                        >
                            Cerrar sin cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MagicInputModal;
