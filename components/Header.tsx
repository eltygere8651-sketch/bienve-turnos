
import React from 'react';
import { LogoIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon, LogoutIcon, CheckCircleIcon, ArrowPathIcon, ExclamationCircleIcon } from './icons';

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
    syncStatus,
    onConfigureApi,
    onForceSync
}) => {
    return (
        <header className="bg-[#0b0f1a] p-4 sticky top-0 z-30 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <LogoIcon className="w-8 h-8 text-red-600" />
                        <h1 className="text-xl font-bold text-red-600 tracking-tight hidden sm:block">Bienve App</h1>
                    </div>
                    
                    <button 
                        onClick={onConfigureApi}
                        className="flex items-center gap-2 bg-[#1e293b] px-3 py-1.5 rounded-full border border-gray-700"
                    >
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Nube</span>
                        {syncStatus === 'syncing' ? (
                            <ArrowPathIcon className="w-4 h-4 text-blue-400 animate-spin" />
                        ) : syncStatus === 'success' ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        ) : (
                            <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
                        )}
                    </button>
                </div>

                <div className="flex items-center bg-[#1e293b] rounded-full px-2 py-1 gap-2">
                    <button onClick={onPrevWeek} className="p-1 text-gray-400 hover:text-white transition"><ChevronLeftIcon className="w-5 h-5" /></button>
                    <button onClick={onCalendarClick} className="flex items-center space-x-2 px-2 text-sm font-bold text-red-400 hover:text-red-300">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="whitespace-nowrap">{currentWeekTitle}</span>
                    </button>
                    <button onClick={onNextWeek} className="p-1 text-gray-400 hover:text-white transition"><ChevronRightIcon className="w-5 h-5" /></button>
                </div>
                
                <button onClick={onLogout} className="p-2 text-gray-400 hover:text-white transition">
                    <LogoutIcon className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
};

export default Header;
