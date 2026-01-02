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

    // Color logic: Green if > 0, White if 0 (never red since min is 0 now)
    const extraColor = overtimeHours > 0 ? 'text-green-500' : 'text-white';

    return (
        <footer className="sticky bottom-0 bg-gray-800/80 backdrop-blur-sm border-t border-gray-700 p-3 shadow-top">
            <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
                {/* --- Sección Izquierda: Horas --- */}
                <div className="flex space-x-4 sm:space-x-6 text-center">
                    <div>
                        <p className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-tighter">TRABAJADAS</p>
                        <p className="text-xl sm:text-2xl font-black text-white leading-none">{totalHours.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-tighter">EXTRA</p>
                        <p className={`text-xl sm:text-2xl font-black leading-none ${extraColor}`}>
                            {overtimeHours.toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* --- Sección Derecha: Descarga --- */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        disabled={isAnyDownloadInProgress}
                        className="flex items-center space-x-2 px-4 py-2 sm:px-6 sm:py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition-transform transform hover:scale-105 duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:scale-100 uppercase tracking-tight"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">{isAnyDownloadInProgress ? 'Generando...' : 'Descargar'}</span>
                    </button>
                    {isMenuOpen && (
                        <div className="absolute bottom-full mb-2 w-full min-w-max rounded-xl shadow-xl bg-gray-800 border border-gray-700 z-20 animate-fade-in right-0 origin-bottom-right p-1">
                            <button
                                onClick={() => { onDownload(); setIsMenuOpen(false); }}
                                disabled={isDownloading}
                                className="w-full flex items-center space-x-3 text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 rounded-lg disabled:text-gray-500 disabled:cursor-not-allowed font-medium"
                            >
                                <DownloadIcon className="w-5 h-5 text-red-500" />
                                <span>Esta Semana</span>
                            </button>
                            <button
                                onClick={() => { onDownloadMonth(); setIsMenuOpen(false); }}
                                disabled={isDownloadingMonth}
                                className="w-full flex items-center space-x-3 text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 rounded-lg disabled:text-gray-500 disabled:cursor-not-allowed font-medium"
                            >
                                <CalendarDownloadIcon className="w-5 h-5 text-blue-500" />
                                <span>Resumen Mensual</span>
                            </button>
                            <button
                                onClick={() => { onOpenCustomPeriodModal(); setIsMenuOpen(false); }}
                                disabled={isDownloadingCustomPeriod}
                                className="w-full flex items-center space-x-3 text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 rounded-lg disabled:text-gray-500 disabled:cursor-not-allowed font-medium"
                            >
                                <DocumentTextIcon className="w-5 h-5 text-green-500" />
                                <span>Personalizado</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </footer>
    );
};

export default Summary;