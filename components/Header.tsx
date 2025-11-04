import React from 'react';
import { LogoIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from './icons';

interface HeaderProps {
    currentWeekTitle: string;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onCalendarClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentWeekTitle, onPrevWeek, onNextWeek, onCalendarClick }) => {
    
    return (
        <header className="bg-gray-800 shadow-md p-3 sm:p-4 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 items-center gap-4">
                
                {/* --- Columna Izquierda: Logo y Título --- */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <LogoIcon className="w-8 h-8 sm:w-10 sm:h-10" />
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-700">
                        Bienve App
                    </h1>
                </div>
                
                {/* --- Columna Central: Navegación de Fecha --- */}
                <div className="flex items-center justify-center sm:justify-start col-start-2 sm:col-start-2">
                    <button onClick={onPrevWeek} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors duration-200" aria-label="Semana anterior">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    
                    <button 
                        onClick={onCalendarClick}
                        className="p-3 bg-gray-900 hover:bg-red-700 border-2 border-gray-700 hover:border-red-600 rounded-full transition-all duration-300 ease-in-out transform hover:scale-110 mx-2"
                        aria-label="Seleccionar semana"
                        title={currentWeekTitle}
                    >
                        <CalendarIcon className="w-7 h-7 text-red-400" />
                    </button>
                    
                    <button onClick={onNextWeek} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors duration-200" aria-label="Semana siguiente">
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* --- Columna Derecha (espacio vacío) --- */}
                <div className="hidden sm:block"></div>
            </div>
        </header>
    );
};

export default Header;