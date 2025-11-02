import React, { useRef } from 'react';
import { LogoIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon, BellIcon, BellSlashIcon, CalendarDownloadIcon } from './icons';
import { DriveUser } from '../types';
import DriveSync from './DriveSync';

interface HeaderProps {
    currentWeekTitle: string;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onGoToToday: () => void;
    onDateChange: (date: Date) => void;
    onRequestPermission: () => void;
    notificationStatus: NotificationPermission;
    onDownloadMonth: () => void;
    isDownloadingMonth: boolean;
    isDriveConfigured: boolean;
    driveUser: DriveUser | null;
    isDriveConnected: boolean;
    isDriveLoading: boolean;
    onSignIn: () => void;
    onSignOut: () => void;
    onForceSync: () => void;
}

const Header: React.FC<HeaderProps> = (props) => {
    const { 
        currentWeekTitle, onPrevWeek, onNextWeek, onGoToToday, onDateChange, 
        onRequestPermission, notificationStatus, onDownloadMonth, isDownloadingMonth,
        isDriveConfigured,
        ...driveProps 
    } = props;
    
    const dateInputRef = useRef<HTMLInputElement>(null);

    const handleWeekTitleClick = () => {
        dateInputRef.current?.showPicker();
    };

    const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateString = e.target.value;
        if (dateString) {
            onDateChange(new Date(dateString));
        }
    };

    const getNotificationButton = () => {
        switch (notificationStatus) {
            case 'granted':
                return (
                    <button className="p-2 rounded-full bg-green-600 text-white" aria-label="Notificaciones activadas" title="Notificaciones activadas">
                        <BellIcon className="w-5 h-5" />
                    </button>
                );
            case 'denied':
                 return (
                    <button className="p-2 rounded-full bg-red-600 text-white cursor-not-allowed" aria-label="Notificaciones bloqueadas" title="Notificaciones bloqueadas por el navegador">
                        <BellSlashIcon className="w-5 h-5" />
                    </button>
                );
            default: // 'default'
                 return (
                    <button onClick={onRequestPermission} className="p-2 rounded-full bg-gray-700 hover:bg-red-600 transition-colors duration-200" aria-label="Activar notificaciones" title="Activar notificaciones">
                        <BellIcon className="w-5 h-5" />
                    </button>
                );
        }
    };
    
    return (
        <header className="bg-gray-800 shadow-md p-3 sm:p-4 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <LogoIcon className="w-8 h-8 sm:w-10 sm:h-10" />
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-700">
                        Bienve App
                    </h1>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
                    {isDriveConfigured && <DriveSync {...driveProps} />}
                    {getNotificationButton()}
                     <button 
                        onClick={onDownloadMonth} 
                        disabled={isDownloadingMonth}
                        className="p-2 rounded-full bg-gray-700 hover:bg-red-600 transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed" 
                        aria-label="Descargar mes" 
                        title="Descargar horario del mes"
                    >
                        {isDownloadingMonth ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <CalendarDownloadIcon className="w-5 h-5" />}
                    </button>
                    <button onClick={onGoToToday} className="p-2 rounded-full bg-gray-700 hover:bg-red-600 transition-colors duration-200" aria-label="Hoy" title="Ir a la semana actual">
                        <CalendarIcon className="w-5 h-5" />
                    </button>
                    <div className="flex items-center bg-gray-700 rounded-full">
                         <button onClick={onPrevWeek} className="p-2 hover:bg-gray-600 rounded-l-full transition-colors duration-200" aria-label="Semana anterior">
                            <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        <div className="relative">
                            <button 
                                onClick={handleWeekTitleClick}
                                className="font-semibold text-xs sm:text-sm md:text-base text-center w-32 sm:w-48 md:w-64 px-1 sm:px-2 py-2 hover:bg-gray-600 transition-colors duration-200"
                                title="Seleccionar una fecha"
                            >
                                {currentWeekTitle}
                            </button>
                            <input
                                ref={dateInputRef}
                                type="date"
                                onChange={handleDateInputChange}
                                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                aria-label="Seleccionar fecha"
                            />
                        </div>
                        <button onClick={onNextWeek} className="p-2 hover:bg-gray-600 rounded-r-full transition-colors duration-200" aria-label="Semana siguiente">
                            <ChevronRightIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;