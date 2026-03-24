
import React from 'react';
import { DownloadIcon } from './icons';

interface SummaryProps {
    totalHours: number;
    overtimeHours: number;
    onOpenCustomPeriodModal: () => void;
    isDownloadingCustomPeriod: boolean;
}

const Summary: React.FC<SummaryProps> = ({ 
    totalHours, 
    overtimeHours, 
    onOpenCustomPeriodModal,
    isDownloadingCustomPeriod
}) => {
    return (
        <footer className="sticky bottom-0 bg-gray-800/80 backdrop-blur-sm border-t border-gray-700 p-3 shadow-top z-10">
            <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
                {/* --- Sección Izquierda: Horas --- */}
                <div className="flex space-x-4 sm:space-x-6 text-center">
                    <div>
                        <p className="text-xs sm:text-sm text-gray-400">Totales</p>
                        <p className="text-xl sm:text-2xl font-bold text-red-400">{totalHours.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-xs sm:text-sm text-gray-400">Extra</p>
                        <p className={`text-xl sm:text-2xl font-bold ${overtimeHours > 0 ? 'text-yellow-400' : 'text-gray-200'}`}>
                            {overtimeHours.toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* --- Sección Derecha: Descarga --- */}
                <button
                    onClick={onOpenCustomPeriodModal}
                    disabled={isDownloadingCustomPeriod}
                    className="flex items-center space-x-2 px-4 py-2 sm:px-6 sm:py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:scale-100"
                >
                    <DownloadIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">{isDownloadingCustomPeriod ? 'Generando...' : 'Exportar PDF'}</span>
                </button>
            </div>
        </footer>
    );
};

export default Summary;
