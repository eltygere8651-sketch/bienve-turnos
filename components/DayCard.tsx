import React from 'react';
import { Day, DayStatus } from '../types';
import { calculateHoursFromShift } from '../services/scheduleService';
import { formatDayDate, formatDayName } from '../utils/dateUtils';
import { StarIcon, SunIcon } from './icons';

interface DayCardProps {
    day: Day;
    onEdit: (day: Day) => void;
    isToday: boolean;
}

const DayCard: React.FC<DayCardProps> = ({ day, onEdit, isToday }) => {
    const hours = calculateHoursFromShift(day.shift);

    const baseClasses = "relative rounded-xl shadow-lg w-full h-40 flex flex-col justify-between border transition-all duration-300 ease-in-out transform hover:-translate-y-1.5 active:scale-95 focus:outline-none overflow-hidden";
    const todayClasses = isToday ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-gray-900' : '';

    let cardStyle = '';
    let content: React.ReactNode;

    switch (day.status) {
        case DayStatus.Vacation:
            cardStyle = 'bg-gradient-to-br from-emerald-800 to-green-900 border-emerald-700/50 hover:border-emerald-500';
            content = (
                <div className="flex flex-col items-center justify-center h-full text-emerald-100">
                    <SunIcon className="w-12 h-12 mb-2 opacity-80" />
                    <span className="font-bold text-lg tracking-wider">Vacaciones</span>
                </div>
            );
            break;
        case DayStatus.Holiday:
            cardStyle = 'bg-gradient-to-br from-indigo-800 to-blue-900 border-indigo-700/50 hover:border-indigo-500';
            content = (
                <div className="flex flex-col items-center justify-center h-full text-indigo-100">
                    <StarIcon className="w-12 h-12 mb-2 opacity-80" />
                    <span className="font-bold text-lg tracking-wider">Festivo</span>
                </div>
            );
            break;
        default: // DayStatus.Work
            cardStyle = 'bg-gradient-to-br from-gray-800 via-gray-900 to-black border-gray-700/80 hover:border-cyan-500';
            content = (
                <>
                    <div className="p-3">
                        <div className="flex justify-between items-start">
                            <p className="font-bold text-base capitalize text-gray-100">{formatDayName(day.date)}</p>
                            <p className="font-semibold text-sm text-gray-400">{formatDayDate(day.date)}</p>
                        </div>
                    </div>
                    <div className="flex-grow flex items-center justify-center">
                        <p className="text-3xl font-mono font-black text-cyan-400 [text-shadow:0_0_8px_theme(colors.cyan.400)]">
                            {day.shift || '—'}
                        </p>
                    </div>
                    <div className="p-3 text-right h-10 flex items-end justify-end">
                        {hours > 0 && (
                            <p className="text-lg font-semibold text-gray-200 bg-black/30 px-2 py-0.5 rounded-md">
                                {hours.toFixed(1)}h
                            </p>
                        )}
                    </div>
                </>
            );
            break;
    }

    const patternStyle = {
      backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)',
      backgroundSize: '1rem 1rem'
    };

    return (
        <button
            type="button"
            className={`${baseClasses} ${todayClasses} ${cardStyle}`}
            onClick={() => onEdit(day)}
            aria-label={`Editar turno para ${formatDayName(day.date)}, ${formatDayDate(day.date)}`}
        >
            <div className="absolute inset-0" style={patternStyle}></div>
            <div className="relative z-10 w-full h-full flex flex-col">
                {content}
            </div>
        </button>
    );
};

export default DayCard;