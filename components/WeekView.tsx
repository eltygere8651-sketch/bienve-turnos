import React from 'react';
import { Day, DayStatus } from '../types';
import DayCard from './DayCard';
import { SunIcon, TrashIcon } from './icons';

interface WeekViewProps {
    days: Day[];
    onEditDay: (day: Day) => void;
    onSetWeekStatus: (status: DayStatus) => void;
    onClearWeek: () => void;
}

const WeekView: React.FC<WeekViewProps> = ({ days, onEditDay, onSetWeekStatus, onClearWeek }) => {
    const todayString = new Date().toDateString();
    
    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:space-x-4">
                 <button 
                    onClick={onClearWeek} 
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 active:scale-95 duration-200"
                    title="Borrar todos los turnos de esta semana"
                >
                    <TrashIcon className="w-5 h-5"/>
                    <span>Limpiar Semana</span>
                </button>
                <button 
                    onClick={() => onSetWeekStatus(DayStatus.Vacation)} 
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 active:scale-95 duration-200"
                >
                    <SunIcon className="w-5 h-5"/>
                    <span>Marcar Semana de Vacaciones</span>
                </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 md:gap-6">
                {days.map(day => (
                    <DayCard 
                        key={day.date.toISOString()} 
                        day={day} 
                        onEdit={onEditDay}
                        isToday={day.date.toDateString() === todayString}
                    />
                ))}
            </div>
        </div>
    );
};

export default WeekView;