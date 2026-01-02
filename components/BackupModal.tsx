
import React from 'react';
import { ArchiveBoxIcon, TrashIcon } from './icons';

interface BackupModalProps {
    onClose: () => void;
    onExport: () => void;
    onImport: (file: File) => void;
    onRestoreAutoBackup: () => void;
    hasAutoBackup: boolean;
    onResetData?: () => void;
}

const BackupModal: React.FC<BackupModalProps> = ({ onClose, onRestoreAutoBackup, hasAutoBackup, onResetData }) => {
    
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8 border border-gray-700 animate-fade-in-scale-up"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-red-400 text-center mb-2">Gestión de Datos</h2>
                <p className="text-gray-400 text-center text-sm mb-6">
                    Herramientas para gestionar y restaurar la aplicación.
                </p>
                
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    
                    {/* Auto Backup Section */}
                    <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                        <div className="flex items-center space-x-3 mb-2">
                            <ArchiveBoxIcon className="w-6 h-6 text-yellow-400" />
                            <h3 className="font-semibold text-gray-200">Restauración Automática</h3>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">
                            Recupera la copia de seguridad automática generada hoy al abrir la app.
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

                    {/* Reset Data Section */}
                    {onResetData && (
                        <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                            <div className="flex items-center space-x-3 mb-2">
                                <TrashIcon className="w-6 h-6 text-red-500" />
                                <h3 className="font-semibold text-gray-200">Restablecer App</h3>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">
                                Borra todos los datos guardados para empezar de cero.
                            </p>
                            <button 
                                onClick={onResetData}
                                className="w-full py-2 bg-gray-800 border border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition text-sm font-medium"
                            >
                                Borrar Todo
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BackupModal;
