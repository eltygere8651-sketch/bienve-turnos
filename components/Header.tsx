
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { LogoIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon, LogoutIcon, CheckCircleIcon, ArrowPathIcon, ExclamationCircleIcon, Cog6ToothIcon } from './icons';
import { getApiKeys } from '../services/apiKeyService';

interface HeaderProps {
    currentWeekTitle: string;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onCalendarClick: () => void;
    onLogout: () => void;
    isCloudConnected: boolean;
    syncStatus: 'idle' | 'syncing' | 'success' | 'error';
    cloudError: string | null;
    onConfigureApi: () => void;
    onForceSync?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    currentWeekTitle, 
    onPrevWeek, 
    onNextWeek, 
    onCalendarClick, 
    onLogout,
    isCloudConnected,
    syncStatus,
    cloudError,
    onConfigureApi,
    onForceSync
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (syncStatus === 'success') {
            setLastSyncTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
        }
    }, [syncStatus]);

    const hasKeys = useMemo(() => {
        const keys = getApiKeys();
        return !!(keys && keys.apiKey);
    }, [isCloudConnected, syncStatus]);

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
        <header className="bg-gray-800 shadow-md p-3 sm:p-4 sticky top-0 z-20">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                
                <div className="flex items-center justify-between w-full sm:w-auto">
                    <div className="flex items-center space-x-2">
                        <LogoIcon className="w-8 h-8 sm:w-10 sm:h-10" />
                        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-700">Bienve App</h1>
                    </div>
                    
                    <div className="flex items-center space-x-3 sm:ml-4">
                        {hasKeys ? (
                            <div className="relative" ref={menuRef}>
                                <button 
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all active:scale-95 ${
                                        syncStatus === 'error' ? 'bg-red-500/20 border-red-500' : 'bg-gray-900/50 border-gray-700'
                                    }`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Nube</span>
                                    {syncStatus === 'syncing' ? (
                                        <ArrowPathIcon className="w-5 h-5 text-blue-400 animate-spin" />
                                    ) : syncStatus === 'success' ? (
                                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <ExclamationCircleIcon className="w-5 h-5 text-red-500 animate-pulse" />
                                    )}
                                </button>

                                {isMenuOpen && (
                                    <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-3 w-72 bg-gray-900 text-white text-[11px] p-5 rounded-2xl shadow-2xl border border-gray-700 z-50 animate-fade-in">
                                        <p className="font-bold text-gray-100 mb-1 uppercase tracking-tighter text-xs text-center">
                                            Estado de Sincronización
                                        </p>
                                        
                                        <div className="mb-4 text-center">
                                            {syncStatus === 'success' ? (
                                                <div className="space-y-1">
                                                    <p className="text-green-400 font-bold">✅ Datos al día</p>
                                                    {lastSyncTime && <p className="text-[9px] text-gray-500 font-mono uppercase">Visto: hoy {lastSyncTime}</p>}
                                                </div>
                                            ) : syncStatus === 'syncing' ? (
                                                <p className="text-blue-400 font-bold animate-pulse uppercase">⏳ Conectando...</p>
                                            ) : (
                                                <p className="text-red-400 font-black uppercase tracking-tighter">{cloudError || 'Sin conexión'}</p>
                                            )}
                                            
                                            <button 
                                                onClick={() => { onForceSync?.(); setIsMenuOpen(false); }}
                                                className="w-full mt-4 bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                                            >
                                                <ArrowPathIcon className="w-4 h-4" />
                                                BAJAR DATOS DE LA NUBE
                                            </button>
                                            <p className="text-[9px] text-gray-500 mt-4 italic leading-tight text-center">
                                                Si has subido horarios en otro móvil y no los ves, pulsa el botón rojo.
                                            </p>
                                        </div>

                                        <button 
                                            onClick={() => { onConfigureApi(); setIsMenuOpen(false); }} 
                                            className="mt-6 w-full text-gray-500 hover:text-white text-[9px] uppercase font-black tracking-widest border-t border-gray-800 pt-4 text-center"
                                        >
                                            RECONFIGURAR FIREBASE
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button onClick={onConfigureApi} className="text-[10px] text-yellow-500 flex items-center space-x-2 bg-yellow-500/10 px-4 py-2 rounded-xl border border-yellow-500/20 transition-colors font-black uppercase tracking-widest">
                                <Cog6ToothIcon className="w-4 h-4" />
                                <span>CONFIGURAR NUBE</span>
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center justify-center bg-gray-900/50 p-1 rounded-full border border-gray-700">
                    <button onClick={onPrevWeek} className="p-2 text-gray-400 hover:text-white rounded-full"><ChevronLeftIcon className="w-5 h-5" /></button>
                    <button onClick={onCalendarClick} className="flex items-center space-x-2 px-4 py-1 text-sm font-medium text-red-400">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="truncate max-w-[150px]">{currentWeekTitle}</span>
                    </button>
                    <button onClick={onNextWeek} className="p-2 text-gray-400 hover:text-white rounded-full"><ChevronRightIcon className="w-5 h-5" /></button>
                </div>

                <button onClick={onLogout} className="hidden sm:block p-2 text-gray-400 hover:text-red-500"><LogoutIcon className="w-6 h-6" /></button>
            </div>
        </header>
    );
};

export default Header;
