
import React, { useState, useRef, useEffect } from 'react';
import { LogoIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon, LogoutIcon, CheckCircleIcon, ArrowPathIcon, ExclamationCircleIcon } from './icons';

interface HeaderProps {
    currentWeekTitle: string;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onCalendarClick: () => void;
    onLogout: () => void;
    isCloudConnected: boolean;
    syncStatus: 'idle' | 'syncing' | 'success' | 'error';
    onConfigureApi: () => void;
    onForceSync?: () => void;
    onManualUpload?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    currentWeekTitle, onPrevWeek, onNextWeek, onCalendarClick, onLogout,
    isCloudConnected, syncStatus, onConfigureApi, onForceSync, onManualUpload
}) => {
    const [isNubeMenuOpen, setIsNubeMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsNubeMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <header className="bg-[#0b0f1a] pt-4 pb-2 px-4 sticky top-0 z-40 safe-top">
            <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                    <LogoIcon className="w-7 h-7 text-red-600" />
                    
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => isCloudConnected ? setIsNubeMenuOpen(!isNubeMenuOpen) : onConfigureApi()}
                            className="bg-[#1e293b] border border-gray-700 px-3 py-1.5 rounded-full flex items-center gap-2 active:scale-95 transition"
                        >
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-wider">NUBE</span>
                            {syncStatus === 'syncing' ? <ArrowPathIcon className="w-3.5 h-3.5 text-blue-400 animate-spin" /> :
                             isCloudConnected ? <CheckCircleIcon className="w-3.5 h-3.5 text-green-500" /> :
                             <ExclamationCircleIcon className="w-3.5 h-3.5 text-red-500" />}
                        </button>

                        {isNubeMenuOpen && (
                            <div className="absolute left-0 mt-2 w-48 bg-[#1e293b] border border-gray-700 rounded-2xl shadow-2xl p-1 animate-card">
                                <button onClick={() => { onManualUpload?.(); setIsNubeMenuOpen(false); }} className="w-full text-left p-3 text-xs font-bold text-gray-200 hover:bg-gray-700 rounded-xl flex items-center gap-2">
                                    <ArrowPathIcon className="w-4 h-4 text-green-500" /> Subir a Nube
                                </button>
                                <button onClick={() => { onForceSync?.(); setIsNubeMenuOpen(false); }} className="w-full text-left p-3 text-xs font-bold text-gray-200 hover:bg-gray-700 rounded-xl flex items-center gap-2">
                                    <CheckCircleIcon className="w-4 h-4 text-blue-500" /> Sincronizar
                                </button>
                                <div className="h-px bg-gray-700 my-1 mx-2" />
                                <button onClick={() => { onConfigureApi(); setIsNubeMenuOpen(false); }} className="w-full text-left p-3 text-[10px] font-bold text-gray-500">Configurar API</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-grow flex items-center justify-center bg-[#1e293b] rounded-2xl border border-gray-800 py-1 px-2 gap-1 overflow-hidden">
                    <button onClick={onPrevWeek} className="p-2 text-gray-500 active:text-white"><ChevronLeftIcon className="w-5 h-5" /></button>
                    <button onClick={onCalendarClick} className="flex items-center gap-1.5 text-[11px] font-black text-red-500 uppercase truncate">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[120px]">{currentWeekTitle.replace('Semana del', '')}</span>
                    </button>
                    <button onClick={onNextWeek} className="p-2 text-gray-500 active:text-white"><ChevronRightIcon className="w-5 h-5" /></button>
                </div>
                
                <button onClick={onLogout} className="p-2 text-gray-500 active:text-white"><LogoutIcon className="w-6 h-6" /></button>
            </div>
        </header>
    );
};

export default Header;
