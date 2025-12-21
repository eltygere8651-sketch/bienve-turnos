
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
    const [showRules, setShowRules] = useState(false);
    const [copied, setCopied] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const { consoleUrl, isDatabaseMissing, isPermissionDenied, hasKeys } = useMemo(() => {
        const keys = getApiKeys();
        if (keys && keys.apiKey) {
            try {
                const config = JSON.parse(keys.apiKey);
                const isMissing = cloudError?.includes('not-found') || cloudError?.includes('inexistente');
                const isDenied = cloudError?.toLowerCase().includes('bloqueo') || 
                                 cloudError?.toLowerCase().includes('permission') || 
                                 cloudError?.toLowerCase().includes('permisos') || 
                                 cloudError?.toLowerCase().includes('insufficient');
                
                let url = `https://console.firebase.google.com/project/${config.projectId}/firestore`;
                if (isDenied) {
                    url = `https://console.firebase.google.com/project/${config.projectId}/firestore/rules`;
                }

                return { 
                    consoleUrl: url,
                    isDatabaseMissing: isMissing,
                    isPermissionDenied: isDenied,
                    hasKeys: true
                };
            } catch (e) { return { consoleUrl: null, isDatabaseMissing: false, isPermissionDenied: false, hasKeys: false }; }
        }
        return { consoleUrl: null, isDatabaseMissing: false, isPermissionDenied: false, hasKeys: false };
    }, [cloudError]);

    const securityRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /schedules/{document} {
      allow read, write: if request.auth != null;
    }
  }
}`;

    const handleCopyRules = () => {
        navigator.clipboard.writeText(securityRules);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
                                    className="p-2 rounded-xl bg-gray-900/50 border border-gray-700 hover:bg-gray-700 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
                                >
                                    {syncStatus === 'syncing' ? (
                                        <ArrowPathIcon className="w-6 h-6 text-blue-400 animate-spin" />
                                    ) : syncStatus === 'success' ? (
                                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                    ) : (
                                        <ExclamationCircleIcon className="w-6 h-6 text-red-500 animate-pulse" />
                                    )}
                                </button>

                                {/* Menú Desplegable (Clic) */}
                                {isMenuOpen && (
                                    <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-3 w-72 bg-gray-900 text-white text-[11px] p-5 rounded-2xl shadow-2xl border border-gray-700 z-50 animate-fade-in">
                                        <p className="font-bold text-gray-100 mb-2 uppercase tracking-tighter text-xs text-center border-b border-gray-800 pb-2">
                                            Estado de la Nube
                                        </p>
                                        
                                        <div className="mb-4 text-center">
                                            {syncStatus === 'success' ? (
                                                <p className="text-green-400 mb-2 font-bold">✅ Sincronizado Correctamente</p>
                                            ) : syncStatus === 'syncing' ? (
                                                <p className="text-blue-400 mb-2">⏳ Sincronizando datos...</p>
                                            ) : (
                                                <p className="text-red-400 mb-2">{cloudError || 'Error de conexión'}</p>
                                            )}
                                            
                                            <button 
                                                onClick={() => { onForceSync?.(); setIsMenuOpen(false); }}
                                                className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                                            >
                                                <ArrowPathIcon className="w-4 h-4" />
                                                Subir locales a la nube
                                            </button>
                                            <p className="text-[9px] text-gray-500 mt-3 italic leading-tight">Usa esto si has escrito horarios en este móvil y no los ves en otros sitios.</p>
                                        </div>

                                        {(isPermissionDenied || isDatabaseMissing) && (
                                            <div className="mt-4 pt-4 border-t border-gray-800">
                                                <p className="mb-4 text-gray-300 leading-relaxed text-center">
                                                    {isDatabaseMissing 
                                                        ? 'Tu base de datos no ha sido creada en Firebase todavía.' 
                                                        : 'Faltan permisos de escritura en las reglas de Firestore.'}
                                                </p>
                                                
                                                {isPermissionDenied && (
                                                    <div className="mb-4">
                                                        <button 
                                                            onClick={() => setShowRules(!showRules)}
                                                            className="w-full mb-2 bg-blue-600/20 text-blue-400 py-2 rounded-lg text-[10px] font-bold border border-blue-500/30"
                                                        >
                                                            {showRules ? 'OCULTAR REGLAS' : 'VER REGLAS DE SEGURIDAD'}
                                                        </button>
                                                        {showRules && (
                                                            <div className="relative">
                                                                <div className="bg-black p-3 rounded-xl border border-gray-800 mb-2">
                                                                    <pre className="text-[9px] text-green-400 overflow-x-auto whitespace-pre">
                                                                        {securityRules}
                                                                    </pre>
                                                                </div>
                                                                <button 
                                                                    onClick={handleCopyRules}
                                                                    className={`w-full py-2 rounded-lg text-[9px] font-black uppercase transition-all ${copied ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                                                >
                                                                    {copied ? '✅ ¡COPIADO!' : '📋 COPIAR REGLAS'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {consoleUrl && (
                                                    <a 
                                                        href={consoleUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="block w-full bg-red-600 hover:bg-red-500 text-center py-3 rounded-xl font-black text-white transition-colors uppercase text-[10px] shadow-lg"
                                                    >
                                                        ABRIR CONSOLA FIREBASE
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => { onConfigureApi(); setIsMenuOpen(false); }} 
                                            className="mt-4 w-full text-gray-500 hover:text-white text-[9px] uppercase font-bold tracking-widest border-t border-gray-800 pt-3"
                                        >
                                            Cambiar Configuración Cloud
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button onClick={onConfigureApi} className="text-xs text-yellow-500 flex items-center space-x-1 bg-yellow-500/10 px-4 py-2 rounded-xl border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors font-bold uppercase tracking-tighter">
                                <Cog6ToothIcon className="w-4 h-4" />
                                <span>Configurar Nube</span>
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
