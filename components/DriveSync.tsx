import React, { useState, useRef, useEffect } from 'react';
import { DriveUser } from '../types';
import { GoogleDriveIcon } from './icons';

interface DriveSyncProps {
    driveUser: DriveUser | null;
    isDriveConnected: boolean;
    isDriveLoading: boolean;
    onSignIn: () => void;
    onSignOut: () => void;
    onForceSync: () => void;
}

const DriveSync: React.FC<DriveSyncProps> = ({ driveUser, isDriveConnected, isDriveLoading, onSignIn, onSignOut, onForceSync }) => {
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
                        onClick={(e) => { e.preventDefault(); onSignOut(); setIsMenuOpen(false); }}
                        className="block px-4 py-2 text-sm text-red-400 hover:bg-gray-600"
                    >
                        Desconectar
                    </a>
                </div>
            )}
        </div>
    );
};

export default DriveSync;
