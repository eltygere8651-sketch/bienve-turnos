
import React from 'react';
import { LogoIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon, LogoutIcon } from './icons';
import UserAuth from './UserAuth';
import { FirebaseUser } from '../types';

interface HeaderProps {
    currentWeekTitle: string;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onCalendarClick: () => void;
    onLogout: () => void;
    // Firebase Props
    user: FirebaseUser | null;
    isSyncing: boolean;
    onLogin: () => void;
    onSignOut: () => void;
    onConfigure: () => void;
    onTestConnection: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    currentWeekTitle, 
    onPrevWeek, 
    onNextWeek, 
    onCalendarClick, 
    onLogout,
    user,
    isSyncing,
    onLogin,
    onSignOut,
    onConfigure,
    onTestConnection
}) => {
    
    return (
        <header className="bg-gray-800 shadow-md p-3 sm:p-4 sticky top-0 z-20">
            <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
                
                {/* --- Columna Izquierda: Logo y Título --- */}
                <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                    <LogoIcon className="w-8 h-8 sm:w-10 sm:h-10" />
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-700 hidden xs:block">
                        Bienve App
                    </h1>
                </div>
                
                {/* --- Columna Central: Navegación de Fecha --- */}
                <div className="flex items-center justify-center bg-gray-900/50 rounded-full px-2 py-1 border border-gray-700">
                    <button onClick={onPrevWeek} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors duration-200" aria-label="Semana anterior">
                        <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    
                    <button 
                        onClick={onCalendarClick}
                        className="mx-1 sm:mx-2 flex flex-col items-center"
                        aria-label="Seleccionar semana"
                        title={currentWeekTitle}
                    >
                        <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 mb-0.5" />
                    </button>
                    
                    <button onClick={onNextWeek} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors duration-200" aria-label="Semana siguiente">
                        <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>

                {/* --- Columna Derecha: Sync y Logout --- */}
                <div className="flex items-center space-x-3 shrink-0">
                    <UserAuth
                        user={user}
                        isSyncing={isSyncing}
                        onLogin={onLogin}
                        onLogout={onSignOut}
                        onConfigure={onConfigure}
                        onTestConnection={onTestConnection}
                    />
                    <div className="h-6 w-px bg-gray-700 mx-1"></div>
                    <button
                        onClick={onLogout}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-full transition-colors duration-200"
                        aria-label="Cerrar sesión"
                        title="Cerrar sesión local de la app"
                    >
                        <LogoutIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
