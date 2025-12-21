
import React, { useState, useRef, useEffect } from 'react';
import { DownloadIcon, CalendarDownloadIcon, DocumentTextIcon } from './icons';

interface SummaryProps {
    totalHours: number;
    overtimeHours: number;
    onDownload: () => void;
    onDownloadMonth: () => void;
    onOpenCustomPeriodModal: () => void;
    isDownloading: boolean;
}

const Summary: React.FC<SummaryProps> = ({ 
    totalHours, 
    overtimeHours, 
    onDownload, 
    onDownloadMonth,
    onOpenCustomPeriodModal,
    isDownloading 
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
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <footer className="bg-[#0b0f1a] border-t border-gray-800 p-5 z-20 shadow-2xl">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex space-x-8">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">Totales</span>
                        <span className="text-xl font-black text-white">{totalHours.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">Extra</span>
                        <span className={`text-xl font-black ${overtimeHours >= 0 ? 'text-white' : 'text-red-500'}`}>
                            {overtimeHours.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        disabled={isDownloading}
                        className="bg-[#ef4444] hover:bg-red-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        <span className="text-sm">Descargar</span>
                    </button>
                    
                    {isMenuOpen && (
                        <div className="absolute bottom-full right-0 mb-4 w-64 bg-[#1e293b] border border-gray-700 rounded-2xl shadow-2xl p-2 animate-fade-in-scale-up">
                            <button 
                                onClick={() => { onDownload(); setIsMenuOpen(false); }}
                                className="w-full text-left px-4 py-3 hover:bg-gray-700 rounded-xl flex items-center space-x-3 transition group"
                            >
                                <DocumentTextIcon className="w-5 h-5 text-red-500 group-hover:scale-110 transition" />
                                <span className="text-sm font-bold text-gray-200">Descargar Semana</span>
                            </button>
                            <button 
                                onClick={() => { onDownloadMonth(); setIsMenuOpen(false); }}
                                className="w-full text-left px-4 py-3 hover:bg-gray-700 rounded-xl flex items-center space-x-3 transition group"
                            >
                                <CalendarDownloadIcon className="w-5 h-5 text-blue-500 group-hover:scale-110 transition" />
                                <span className="text-sm font-bold text-gray-200">Resumen Mensual</span>
                            </button>
                            <button 
                                onClick={() => { onOpenCustomPeriodModal(); setIsMenuOpen(false); }}
                                className="w-full text-left px-4 py-3 hover:bg-gray-700 rounded-xl flex items-center space-x-3 transition group"
                            >
                                <DownloadIcon className="w-5 h-5 text-green-500 group-hover:scale-110 transition rotate-180" />
                                <span className="text-sm font-bold text-gray-200">Periodo Personalizado</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </footer>
    );
};

export default Summary;
