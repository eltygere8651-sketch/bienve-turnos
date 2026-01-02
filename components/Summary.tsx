
import React, { useState, useRef, useEffect } from 'react';
import { DownloadIcon, CalendarDownloadIcon, DocumentTextIcon } from './icons';

interface SummaryProps {
    totalHours: number;
    overtimeHours: number;
    onDownload: () => void;
    isDownloading: boolean;
    onDownloadMonth: () => void;
    isDownloadingMonth: boolean;
    onOpenCustomPeriodModal: () => void;
    isDownloadingCustomPeriod: boolean;
}

const Summary: React.FC<SummaryProps> = ({ 
    totalHours, 
    overtimeHours, 
    onDownload, 
    isDownloading, 
    onDownloadMonth, 
    isDownloadingMonth,
    onOpenCustomPeriodModal,
    isDownloadingCustomPeriod
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const isAnyDownloadInProgress = isDownloading || isDownloadingMonth || isDownloadingCustomPeriod;

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

                {/* --- Sección Derecha: Descarga y Opciones --- */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        disabled={isAnyDownloadInProgress}
                        className="flex items-center space-x-2 px-4 py-2 sm:px-6 sm:py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:scale-100"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">{isAnyDownloadInProgress ? 'Generando...' : 'Opciones'}</span>
                    </button>
                    {isMenuOpen && (
                        <div className="absolute bottom-full mb-2 w-full min-w-max rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 z-20 animate-fade-in right-0 origin-bottom-right">
                            <div className="py-1">
                                <button
                                    onClick={() => { onDownload(); setIsMenuOpen(false); }}
                                    disabled={isDownloading}
                                    className="w-full flex items-center space-x-3 text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed border-b border-gray-600"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                    <span>{isDownloading ? 'Generando...' : 'Descargar Semana'}</span>
                                </button>
                                <button
                                    onClick={() => { onDownloadMonth(); setIsMenuOpen(false); }}
                                    disabled={isDownloadingMonth}
                                    className="w-full flex items-center space-x-3 text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed border-b border-gray-600"
                                >
                                    <CalendarDownloadIcon className="w-5 h-5" />
                                    <span>{isDownloadingMonth ? 'Generando...' : 'Descargar Mes'}</span>
                                </button>
                                <button
                                    onClick={() => { onOpenCustomPeriodModal(); setIsMenuOpen(false); }}
                                    disabled={isDownloadingCustomPeriod}
                                    className="w-full flex items-center space-x-3 text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                                >
                                    <DocumentTextIcon className="w-5 h-5" />
                                    <span>{isDownloadingCustomPeriod ? 'Generando...' : 'Periodo Personalizado'}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </footer>
    );
};

export default Summary;
