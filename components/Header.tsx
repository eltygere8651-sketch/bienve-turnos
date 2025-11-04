import React from 'react';
import { LogoIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon, Cog6ToothIcon } from './icons';
import { DriveUser } from '../types';
import DriveSync from './DriveSync';

interface HeaderProps {
    currentWeekTitle: string;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onCalendarClick: () => void;
    driveUser: DriveUser | null;
    isDriveConnected: boolean;
    isDriveLoading: boolean;
    onSignIn: () => void;
    onSignOut: () => void;
    onForceSync: () => void;
    driveSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
    onRetrySync: () => void;
    driveInitError: string | null;
    isDriveAvailable: boolean;
    onConfigureApi: () => void;
}

const Header: React.FC<HeaderProps> = (props) => {
    const { 
        currentWeekTitle, onPrevWeek, onNextWeek, onCalendarClick,
        isDriveAvailable,
        onConfigureApi,
        ...driveProps 
    } = props;
    
    return (
        <header className="bg-gray-800 shadow-md p-3 sm:p-4 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto grid grid-cols-3 items-center gap-4">
                
                {/* --- Columna Izquierda: Logo y Título --- */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <LogoIcon className="w-8 h-8 sm:w-10 sm:h-10" />
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-700">
                        Bienve App
                    </h1>
                </div>
                
                {/* --- Columna Central: Navegación de Fecha --- */}
                <div className="flex items-center justify-center space-x-2">
                    <button onClick={onPrevWeek} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors duration-200" aria-label="Semana anterior">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    
                    <button 
                        onClick={onCalendarClick}
                        className="p-3 bg-gray-900 hover:bg-red-700 border-2 border-gray-700 hover:border-red-600 rounded-full transition-all duration-300 ease-in-out transform hover:scale-110"
                        aria-label="Seleccionar semana"
                        title={currentWeekTitle}
                    >
                        <CalendarIcon className="w-7 h-7 text-red-400" />
                    </button>
                    
                    <button onClick={onNextWeek} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors duration-200" aria-label="Semana siguiente">
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* --- Columna Derecha: Sincronización con Drive --- */}
                <div className="flex items-center justify-end">
                    {isDriveAvailable 
                        ? <DriveSync {...driveProps} onConfigureApi={onConfigureApi} />
                        : (
                            <button
                                onClick={onConfigureApi}
                                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-700 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors duration-200"
                                title="Configura tus claves de API para habilitar la sincronización"
                            >
                                <Cog6ToothIcon className="w-5 h-5" />
                                <span className="hidden sm:inline">Configurar API</span>
                            </button>
                        )
                    }
                </div>
            </div>
        </header>
    );
};

export default Header;
