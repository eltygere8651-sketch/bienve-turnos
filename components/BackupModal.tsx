import React, { useRef, useState } from 'react';
import { CloudArrowDownIcon, CloudArrowUpIcon } from './icons';

interface BackupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: () => void;
    onImport: (file: File) => Promise<void>;
}

const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose, onExport, onImport }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importError, setImportError] = useState<string>('');
    const [isImporting, setIsImporting] = useState(false);

    if (!isOpen) return null;

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImportError('');
        setIsImporting(true);

        try {
            await onImport(file);
            onClose(); // Close on success
            alert('¡Copia de seguridad restaurada correctamente!');
        } catch (error) {
            console.error("Import failed:", error);
            setImportError('Error al importar el archivo. Asegúrate de que es un archivo .json válido generado por esta app.');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset input
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-700 animate-fade-in-scale-up"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-red-400 text-center mb-6">Copia de Seguridad</h2>
                <p className="text-gray-300 text-center mb-8 text-sm">
                    Guarda tus datos en un archivo seguro o restaura una copia anterior para evitar pérdidas.
                </p>

                <div className="space-y-4">
                    <button 
                        onClick={onExport}
                        className="w-full flex items-center justify-center space-x-3 p-4 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-xl transition-all group"
                    >
                        <div className="bg-red-500/20 p-2 rounded-lg group-hover:bg-red-500/30 transition">
                            <CloudArrowDownIcon className="w-8 h-8 text-red-400" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-white text-lg">Exportar Datos</p>
                            <p className="text-gray-400 text-xs">Descargar archivo .json</p>
                        </div>
                    </button>

                    <button 
                        onClick={handleImportClick}
                        disabled={isImporting}
                        className="w-full flex items-center justify-center space-x-3 p-4 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="bg-blue-500/20 p-2 rounded-lg group-hover:bg-blue-500/30 transition">
                            <CloudArrowUpIcon className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-white text-lg">
                                {isImporting ? 'Importando...' : 'Importar Datos'}
                            </p>
                            <p className="text-gray-400 text-xs">Restaurar desde archivo</p>
                        </div>
                    </button>
                    
                    <input 
                        type="file" 
                        accept=".json" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                    />
                </div>

                {importError && (
                    <div className="mt-4 p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-200 text-sm">
                        {importError}
                    </div>
                )}

                <div className="mt-8 text-center">
                    <button onClick={onClose} className="px-6 py-2 text-gray-400 hover:text-white transition">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default BackupModal;