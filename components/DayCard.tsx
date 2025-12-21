
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

    return (
        <button
            type="button"
            className={`relative rounded-2xl p-5 w-full h-36 flex flex-col justify-between transition-all active:scale-95 focus:outline-none bg-[#1e293b]/60 border-2 ${
                isToday ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-gray-800'
            }`}
            onClick={() => onEdit(day)}
        >
            {/* Header de la tarjeta: Nombre a la izq, número a la derecha */}
            <div className="flex justify-between items-start w-full">
                <span className="text-sm font-bold text-gray-100 capitalize tracking-tight">
                    {formatDayName(day.date)}
                </span>
                <span className="text-sm font-black text-white">
                    {formatDayDate(day.date)}
                </span>
            </div>

            {/* Centro: El indicador cian brillante de la foto */}
            <div className="flex items-center justify-center flex-grow py-2">
                {day.status === DayStatus.Work ? (
                    day.shift ? (
                        <p className="text-sm font-black text-cyan-400 uppercase tracking-tighter text-center leading-tight">
                            {day.shift.replace(' ', '\n')}
                        </p>
                    ) : (
                        <div className="w-10 h-1.5 bg-cyan-400 rounded-full glow-cyan"></div>
                    )
                ) : day.status === DayStatus.Vacation ? (
                    <SunIcon className="w-8 h-8 text-emerald-400" />
                ) : (
                    <StarIcon className="w-8 h-8 text-indigo-400" />
                )}
            </div>

            {/* Footer de la tarjeta: Horas totales si existen */}
            <div className="flex justify-center w-full">
                {hours > 0 && (
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {hours.toFixed(1)} HORAS
                    </span>
                )}
            </div>
        </button>
    );
};

export default DayCard;
