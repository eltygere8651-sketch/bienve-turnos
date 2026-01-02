
import React, { useRef, useState } from 'react';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, ArchiveBoxIcon } from './icons';

interface BackupModalProps {
    onClose: () => void;
    onExport: () => void;
    onImport: (file: File) => void;
    onRestoreAutoBackup: () => void;
    hasAutoBackup: boolean;
}

const BackupModal: React.FC<BackupModalProps> = ({ onClose, onExport, onImport, onRestoreAutoBackup, hasAutoBackup }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importError, setImportError] = useState<string>('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== "application/json" && !file.name.endsWith('.json')) {
                setImportError("Por favor, selecciona un archivo .json válido.");
                return;
            }
            setImportError('');
            onImport(file);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8 border border-gray-700 animate-fade-in-scale-up"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-red-400 text-center mb-2">Copias de Seguridad</h2>
                <p className="text-gray-400 text-center text-sm mb-6">
                    Gestiona tus datos para asegurarte de no perder ningún turno.
                </p>
                
                <div className="space-y-4">
                    {/* Export Section */}
                    <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                        <div className="flex items-center space-x-3 mb-2">
                            <ArrowDownTrayIcon className="w-6 h-6 text-green-400" />
                            <h3 className="font-semibold text-gray-200">Exportar Datos</h3>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">Descarga un archivo con todos tus horarios guardados.</p>
                        <button 
                            onClick={onExport}
                            className="w-full py-2 bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded-lg transition text-sm font-medium"
                        >
                            Descargar Copia (.json)
                        </button>
                    </div>

                    {/* Import Section */}
                    <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                        <div className="flex items-center space-x-3 mb-2">
                            <ArrowUpTrayIcon className="w-6 h-6 text-blue-400" />
                            <h3 className="font-semibold text-gray-200">Importar Datos</h3>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">Restaura tus horarios desde un archivo previamente descargado.</p>
                        <input 
                            type="file" 
                            accept=".json" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleFileChange}
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-2 bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded-lg transition text-sm font-medium"
                        >
                            Seleccionar Archivo
                        </button>
                        {importError && <p className="text-red-400 text-xs mt-2">{importError}</p>}
                    </div>

                    {/* Auto Backup Section */}
                    <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                        <div className="flex items-center space-x-3 mb-2">
                            <ArchiveBoxIcon className="w-6 h-6 text-yellow-400" />
                            <h3 className="font-semibold text-gray-200">Restauración Automática</h3>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">
                            Recupera la copia de seguridad automática generada hoy al abrir la app. Útil si borraste algo por error.
                        </p>
                        <button 
                            onClick={onRestoreAutoBackup}
                            disabled={!hasAutoBackup}
                            className={`w-full py-2 border rounded-lg transition text-sm font-medium ${
                                hasAutoBackup 
                                ? 'bg-gray-700 hover:bg-gray-600 border-gray-500 text-white' 
                                : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {hasAutoBackup ? 'Restaurar Copia de Hoy' : 'No hay copia disponible hoy'}
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BackupModal;
