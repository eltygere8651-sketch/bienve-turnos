import React from 'react';
import { DownloadIcon } from './icons';

interface SummaryProps {
    totalHours: number;
    overtimeHours: number;
    onDownload: () => void;
}

const Summary: React.FC<SummaryProps> = ({ totalHours, overtimeHours, onDownload }) => {
    return (
        <footer className="sticky bottom-0 bg-gray-800/80 backdrop-blur-sm border-t border-gray-700 p-4 shadow-top">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex space-x-6 text-center">
                    <div>
                        <p className="text-sm text-gray-400">Horas Totales</p>
                        <p className="text-2xl font-bold text-red-400">{totalHours.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Horas Extra</p>
                        <p className={`text-2xl font-bold ${overtimeHours > 0 ? 'text-yellow-400' : 'text-gray-200'}`}>
                            {overtimeHours.toFixed(2)}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onDownload}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 duration-300"
                >
                    <DownloadIcon className="w-5 h-5" />
                    <span>Descargar Horario</span>
                </button>
            </div>
        </footer>
    );
};

export default Summary;
