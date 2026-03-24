
import React, { useState, useRef, useEffect } from 'react';
import { FirebaseUser } from '../types';
import { GoogleDriveIcon, CheckCircleIcon, ArrowPathIcon } from './icons';

interface UserAuthProps {
    user: FirebaseUser | null;
    isSyncing: boolean;
    onLogin: () => void;
    onLogout: () => void;
    onConfigure: () => void;
    onTestConnection: () => void;
    onForceDownload: () => void;
}

const UserAuth: React.FC<UserAuthProps> = ({ user, isSyncing, onLogin, onLogout, onConfigure, onTestConnection, onForceDownload }) => {
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

    if (!user) {
        return (
            <button
                onClick={onLogin}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-700 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors duration-200"
                title="Iniciar sesión con Google para sincronizar"
            >
                <GoogleDriveIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Conectar</span>
            </button>
        );
    }

    return (
        <div className="flex items-center space-x-3">
             <button 
                onClick={onTestConnection}
                className="flex items-center justify-center w-5 h-5 cursor-pointer hover:scale-110 transition-transform" 
                title={isSyncing ? "Sincronizando..." : "Conectado. Haz clic para probar la conexión."}
            >
                {isSyncing ? (
                    <ArrowPathIcon className="w-5 h-5 text-blue-400 animate-spin" />
                ) : (
                    <CheckCircleIcon className="w-5 h-5 text-green-400" />
                )}
            </button>

            <div className="relative" ref={menuRef}>
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)} 
                    className="flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white rounded-full"
                >
                    {user.photoURL ? (
                        <img className="h-8 w-8 rounded-full" src={user.photoURL} alt={user.displayName || "User"} />
                    ) : (
                        <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold">
                            {user.displayName?.charAt(0) || "U"}
                        </div>
                    )}
                </button>

                {isMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-700 ring-1 ring-black ring-opacity-5 z-20">
                        <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-600">
                            <p className="font-semibold truncate">{user.displayName}</p>
                            <p className="text-xs truncate text-gray-400">{user.email}</p>
                        </div>
                        <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); onForceDownload(); setIsMenuOpen(false); }}
                            className="block px-4 py-2 text-sm text-blue-400 hover:bg-gray-600"
                        >
                            Forzar Descarga de Nube
                        </a>
                        <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); onConfigure(); setIsMenuOpen(false); }}
                            className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                        >
                            Configurar Firebase
                        </a>
                        <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); onLogout(); setIsMenuOpen(false); }}
                            className="block px-4 py-2 text-sm text-red-400 hover:bg-gray-600"
                        >
                            Cerrar Sesión
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserAuth;
