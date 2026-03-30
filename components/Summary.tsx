
import React, { useState } from 'react';
import { DownloadIcon, WhatsAppIcon, TelegramIcon, ShareIcon } from './icons';
import { Day } from '../types';
import { downloadWeekPdf } from '../services/pdfService';

interface SummaryProps {
    totalHours: number;
    overtimeHours: number;
    weekDays: Day[];
    onOpenCustomPeriodModal: () => void;
    isDownloadingCustomPeriod: boolean;
}

const Summary: React.FC<SummaryProps> = ({ 
    totalHours, 
    overtimeHours, 
    weekDays,
    onOpenCustomPeriodModal,
    isDownloadingCustomPeriod
}) => {
    const [isSharingPdf, setIsSharingPdf] = useState(false);
    const shareText = `Resumen de Horas:\nSemana: ${totalHours.toFixed(2)}h (Extra: ${overtimeHours.toFixed(2)}h)`;
    
    const handleSharePdf = async () => {
        setIsSharingPdf(true);
        try {
            await downloadWeekPdf(weekDays, totalHours, overtimeHours);
        } catch (error) {
            console.error("Error sharing PDF", error);
        } finally {
            setIsSharingPdf(false);
        }
    };

    const shareWhatsApp = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank');
    };

    const shareTelegram = () => {
        const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank');
    };

    return (
        <footer className="sticky bottom-0 bg-gray-800/90 backdrop-blur-md border-t border-gray-700 p-3 shadow-2xl z-20">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                {/* --- Sección Izquierda: Horas --- */}
                <div className="flex space-x-4 sm:space-x-8 text-center items-center">
                    <div className="flex flex-col items-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Resumen Semanal</p>
                        <div className="flex space-x-6">
                            <div>
                                <p className="text-[9px] text-gray-400 uppercase">Total</p>
                                <p className="text-base sm:text-xl font-black text-red-500">{totalHours.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-gray-400 uppercase">Extra</p>
                                <p className={`text-base sm:text-xl font-black ${overtimeHours > 0 ? 'text-yellow-400' : 'text-gray-200'}`}>
                                    {overtimeHours.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Sharing Icons */}
                    <div className="flex gap-2 ml-2 border-l border-gray-700 pl-4">
                        <button 
                            onClick={handleSharePdf}
                            disabled={isSharingPdf}
                            className="p-1.5 bg-red-600/20 text-red-500 rounded-full hover:bg-red-600/30 transition-colors flex items-center gap-1 px-3"
                            title="Compartir PDF de la semana"
                        >
                            <ShareIcon className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase">{isSharingPdf ? '...' : 'PDF'}</span>
                        </button>
                        <button 
                            onClick={shareWhatsApp}
                            className="p-1.5 bg-green-600/20 text-green-500 rounded-full hover:bg-green-600/30 transition-colors"
                            title="Compartir Texto en WhatsApp"
                        >
                            <WhatsAppIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={shareTelegram}
                            className="p-1.5 bg-blue-600/20 text-blue-400 rounded-full hover:bg-blue-600/30 transition-colors"
                            title="Compartir Texto en Telegram"
                        >
                            <TelegramIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* --- Sección Derecha: Descarga --- */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={onOpenCustomPeriodModal}
                        disabled={isDownloadingCustomPeriod}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg transition-all active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        <span>{isDownloadingCustomPeriod ? 'Generando...' : 'Exportar PDF'}</span>
                    </button>
                </div>
            </div>
        </footer>
    );
};

export default Summary;
