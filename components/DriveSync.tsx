import React, { useState, useRef, useEffect } from 'react';
import { DriveUser } from '../types';
import { GoogleDriveIcon, ArrowPathIcon, CheckCircleIcon, ExclamationCircleIcon } from './icons';

interface DriveSyncProps {
    driveUser: DriveUser | null;
    isDriveConnected: boolean;
    isDriveLoading: boolean;
    driveInitError: string | null;
    onSignIn: () => void;
    onSignOut: () => void;
    onForceSync: () => void;
    driveSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
    onRetrySync: () => void;
    onConfigureApi: () => void;
}

const DriveSync: React.FC<DriveSyncProps> = ({ driveUser, isDriveConnected, isDriveLoading, driveInitError, onSignIn, onSignOut, onForceSync, driveSyncStatus, onRetrySync, onConfigureApi }) => {
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

    const getSyncIcon = () => {
        switch (driveSyncStatus) {
            case 'syncing':
                return <ArrowPathIcon className="w-5 h-5 text-blue-400 animate-spin" title="Sincronizando..."/>;
            case 'success':
                return <CheckCircleIcon className="w-5 h-5 text-green-400" title="Guardado en Drive"/>;
            case 'error':
                return (
                    <button onClick={onRetrySync} title="Error de sincronización. Clic para reintentar.">
                        <ExclamationCircleIcon className="w-5 h-5 text-red-400" />
                    </button>
                );
            default:
                return <div className="w-5 h-5" />; // Placeholder for alignment
        }
    };

    if (driveInitError) {
        return (
            <div className="flex items-center space-x-2 text-sm text-yellow-500" title={driveInitError}>
                <ExclamationCircleIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Drive no disponible</span>
            </div>
        );
    }

    if (isDriveLoading) {
        return (
            <div className="p-2" title="Conectando con Google Drive...">
                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isDriveConnected) {
        return (
            <button
                onClick={onSignIn}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-700 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors duration-200"
                title="Conectar a Google Drive para respaldar y sincronizar tu horario"
            >
                <GoogleDriveIcon className="w-5 h-5" />
                <span>Conectar</span>
            </button>
        );
    }

    return (
        <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-5 h-5">
                {getSyncIcon()}
            </div>
            <div className="relative" ref={menuRef}>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                    <img
                        className="h-8 w-8 rounded-full"
                        src={driveUser?.picture}
                        alt="User avatar"
                        title={`Conectado como ${driveUser?.name}`}
                    />
                </button>
                {isMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-700 ring-1 ring-black ring-opacity-5 z-20">
                        <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-600">
                            <p className="font-semibold truncate">{driveUser?.name}</p>
                            <p className="text-xs truncate">{driveUser?.email}</p>
                        </div>
                        <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); onForceSync(); setIsMenuOpen(false); }}
                            className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                        >
                            Sincronizar ahora
                        </a>
                        <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); onConfigureApi(); setIsMenuOpen(false); }}
                            className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                        >
                            Configurar API
                        </a>
                        <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); onSignOut(); setIsMenuOpen(false); }}
                            className="block px-4 py-2 text-sm text-red-400 hover:bg-gray-600"
                        >
                            Desconectar
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriveSync;
