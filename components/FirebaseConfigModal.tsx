
import React, { useState } from 'react';
import { FirebaseConfig } from '../types';
import { getFirebaseConfig } from '../services/apiKeyService';

interface FirebaseConfigModalProps {
    onSave: (config: FirebaseConfig) => void;
}

const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({ onSave }) => {
    // Inicializamos el estado con la configuración actual (que incluye la default)
    const [config, setConfig] = useState<FirebaseConfig>(() => {
        const currentConfig = getFirebaseConfig();
        return currentConfig || {
            apiKey: '',
            authDomain: '',
            projectId: '',
            storageBucket: '',
            messagingSenderId: '',
            appId: ''
        };
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value.trim() }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        // Basic validation
        if (config.apiKey && config.projectId && config.authDomain) {
            onSave(config);
        } else {
            alert("Por favor rellena al menos API Key, Auth Domain y Project ID.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 sm:p-8 border border-gray-700 animate-fade-in-scale-up max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSave}>
                    <h2 className="text-2xl font-bold text-red-400 mb-2 text-center">Configurar Firebase</h2>
                    <p className="text-gray-400 text-sm mb-6 text-center">
                        La configuración actual ya está cargada. Modifícala solo si es necesario.
                    </p>

                    <div className="space-y-3 mb-6">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">API Key</label>
                            <input name="apiKey" value={config.apiKey} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm focus:border-red-500 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Auth Domain</label>
                            <input name="authDomain" value={config.authDomain} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm focus:border-red-500 outline-none" required placeholder="tu-app.firebaseapp.com" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Project ID</label>
                            <input name="projectId" value={config.projectId} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm focus:border-red-500 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Storage Bucket</label>
                            <input name="storageBucket" value={config.storageBucket} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm focus:border-red-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Messaging Sender ID</label>
                            <input name="messagingSenderId" value={config.messagingSenderId} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm focus:border-red-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">App ID</label>
                            <input name="appId" value={config.appId} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm focus:border-red-500 outline-none" />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition"
                    >
                        Guardar Configuración
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FirebaseConfigModal;
