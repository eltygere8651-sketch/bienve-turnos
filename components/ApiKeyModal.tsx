
import React, { useState } from 'react';

interface ApiKeyModalProps {
    onSave: (keys: { clientId: string, apiKey: string }) => void;
    onCancel?: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, onCancel }) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState<string | null>(null);

    const extractFirebaseConfig = (text: string) => {
        const findValue = (key: string) => {
            const regex = new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`, 'i');
            const match = text.match(regex);
            return match ? match[1] : null;
        };

        const config = {
            apiKey: findValue('apiKey'),
            authDomain: findValue('authDomain'),
            projectId: findValue('projectId'),
            storageBucket: findValue('storageBucket'),
            messagingSenderId: findValue('messagingSenderId'),
            appId: findValue('appId')
        };

        if (!config.apiKey || !config.projectId) {
            return null;
        }

        return config;
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const config = extractFirebaseConfig(inputValue);
        
        if (config) {
            onSave({ 
                clientId: 'firebase', 
                apiKey: JSON.stringify(config) 
            });
        } else {
            setError('No se pudo encontrar una configuración válida. Asegúrate de copiar el bloque completo de Firebase.');
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/95 flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto backdrop-blur-md">
            <div className="bg-gray-800 rounded-3xl shadow-2xl w-full max-w-xl p-6 sm:p-10 border border-gray-700 my-8 animate-fade-in-scale-up">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="text-center">
                        <div className="inline-flex bg-red-500/10 p-4 rounded-2xl mb-4">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Bienve App Cloud</h2>
                        <p className="text-gray-400 text-sm">Vincular base de datos de Firebase</p>
                    </div>
                    
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
                        <h4 className="text-blue-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            Ayuda Rápida
                        </h4>
                        <p className="text-gray-300 text-[11px] leading-relaxed">
                            Copia el código de tu consola de Firebase (Ajustes &rarr; Tus aplicaciones) y pégalo aquí debajo. La sincronización será automática.
                        </p>
                    </div>

                    <div>
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder='const firebaseConfig = { ... };'
                            className={`w-full bg-black border-2 ${error ? 'border-red-500' : 'border-gray-700'} rounded-2xl p-4 h-48 font-mono text-[11px] focus:border-red-500 outline-none transition text-green-400 shadow-inner`}
                            spellCheck={false}
                            required
                        />
                        {error && <p className="text-red-500 text-xs mt-2 font-bold animate-pulse text-center">{error}</p>}
                    </div>

                    <div className="flex flex-col gap-4">
                        <button 
                            type="submit" 
                            className="w-full px-6 py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl shadow-xl transition transform active:scale-95 uppercase tracking-widest text-sm"
                        >
                            Vincular Nube
                        </button>
                        {onCancel && (
                            <button 
                                type="button"
                                onClick={onCancel}
                                className="text-gray-500 text-xs hover:text-white transition py-2 font-bold uppercase tracking-widest"
                            >
                                Continuar sin cambios
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApiKeyModal;
