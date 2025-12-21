import React, { useState } from 'react';

interface ApiKeyModalProps {
    onSave: (keys: { clientId: string, apiKey: string }) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
    const [clientId, setClientId] = useState('');
    const [apiKey, setApiKey] = useState('');

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (clientId.trim() && apiKey.trim()) {
            onSave({ clientId: clientId.trim(), apiKey: apiKey.trim() });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div 
                className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 sm:p-8 border border-gray-700 animate-fade-in-scale-up"
            >
                <form onSubmit={handleSave}>
                    <h2 id="modal-title" className="text-2xl font-bold text-red-400 mb-4 text-center">Configurar APIs de Google</h2>
                    <p className="text-gray-300 mb-6 text-center">
                        Para habilitar la sincronización con Google Drive y otras funciones, necesitas tus propias claves de API de Google Cloud.
                    </p>

                    <div className="space-y-4 mb-6">
                        <div>
                            <label htmlFor="client-id" className="block text-sm font-medium text-gray-300 mb-1">
                                Google Client ID
                            </label>
                            <input
                                id="client-id"
                                type="text"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                placeholder="Tu Client ID de OAuth 2.0"
                                className="w-full bg-gray-900 border-2 border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="api-key" className="block text-sm font-medium text-gray-300 mb-1">
                                API Key
                            </label>
                            <input
                                id="api-key"
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Tu clave de API"
                                className="w-full bg-gray-900 border-2 border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                                required
                            />
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 text-center mb-6">
                        Puedes obtener estas credenciales en la <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">consola de Google Cloud</a>.
                        Asegúrate de tener habilitadas las APIs de "Google Drive API" y "Gemini API".
                    </p>

                    <button 
                        type="submit" 
                        className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition disabled:bg-gray-500"
                        disabled={!clientId.trim() || !apiKey.trim()}
                    >
                        Guardar y Continuar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ApiKeyModal;
