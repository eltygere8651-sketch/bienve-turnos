
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
    totalHours, overtimeHours, onDownload, onDownloadMonth, onOpenCustomPeriodModal, isDownloading 
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const clickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
        };
        document.addEventListener('mousedown', clickOutside);
        return () => document.removeEventListener('mousedown', clickOutside);
    }, []);

    // Color de las horas extra: verde si hay, blanco si es 0.
    const extraColor = overtimeHours > 0 ? 'text-green-500' : 'text-white';

    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-[#0b0f1a]/95 backdrop-blur-lg border-t border-gray-800 p-5 z-40 safe-bottom">
            <div className="max-w-xl mx-auto flex items-center justify-between">
                <div className="flex gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">TRABAJADAS</span>
                        <span className="text-xl font-black text-white leading-none">{totalHours.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">EXTRA</span>
                        <span className={`text-xl font-black leading-none ${extraColor}`}>
                            {overtimeHours.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        disabled={isDownloading}
                        className="bg-red-600 hover:bg-red-500 text-white pl-4 pr-5 py-3 rounded-2xl flex items-center gap-2 font-black shadow-lg active:scale-95 transition disabled:opacity-50"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        <span className="text-sm uppercase tracking-tight">Descargar</span>
                    </button>
                    
                    {isMenuOpen && (
                        <div className="absolute bottom-full right-0 mb-4 w-64 bg-[#1e293b] border border-gray-700 rounded-[24px] shadow-2xl p-2 animate-card">
                            <button onClick={() => { onDownload(); setIsMenuOpen(false); }} className="w-full text-left p-4 hover:bg-gray-700 rounded-2xl flex items-center gap-3">
                                <DocumentTextIcon className="w-5 h-5 text-red-500" />
                                <span className="text-xs font-black text-white uppercase tracking-tighter">Esta Semana</span>
                            </button>
                            <button onClick={() => { onDownloadMonth(); setIsMenuOpen(false); }} className="w-full text-left p-4 hover:bg-gray-700 rounded-2xl flex items-center gap-3">
                                <CalendarDownloadIcon className="w-5 h-5 text-blue-500" />
                                <span className="text-xs font-black text-white uppercase tracking-tighter">Resumen Mensual</span>
                            </button>
                            <button onClick={() => { onOpenCustomPeriodModal(); setIsMenuOpen(false); }} className="w-full text-left p-4 hover:bg-gray-700 rounded-2xl flex items-center gap-3">
                                <DownloadIcon className="w-5 h-5 text-green-500 rotate-180" />
                                <span className="text-xs font-black text-white uppercase tracking-tighter">Personalizado</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </footer>
    );
};

export default Summary;
