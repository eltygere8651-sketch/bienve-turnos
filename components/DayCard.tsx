
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

    // Lógica de colores según estado
    let borderColor = 'border-gray-800';
    let statusTextColor = 'text-cyan-400';
    let bgGlow = '';

    if (isToday) {
        borderColor = 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
    } else if (day.status === DayStatus.Vacation) {
        borderColor = 'border-emerald-500/50';
        statusTextColor = 'text-emerald-400';
        bgGlow = 'shadow-[0_0_10px_rgba(52,211,153,0.1)]';
    } else if (day.status === DayStatus.Holiday) {
        borderColor = 'border-blue-500/50';
        statusTextColor = 'text-blue-400';
        bgGlow = 'shadow-[0_0_10px_rgba(96,165,250,0.1)]';
    }

    return (
        <button
            type="button"
            className={`relative rounded-2xl p-5 w-full h-36 flex flex-col justify-between transition-all active:scale-95 focus:outline-none bg-[#1e293b]/60 border-2 ${borderColor} ${bgGlow}`}
            onClick={() => onEdit(day)}
        >
            <div className="flex justify-between items-start w-full">
                <span className="text-sm font-bold text-gray-100 capitalize tracking-tight">
                    {formatDayName(day.date)}
                </span>
                <span className="text-sm font-black text-white">
                    {formatDayDate(day.date)}
                </span>
            </div>

            <div className="flex items-center justify-center flex-grow py-2">
                {day.status === DayStatus.Work ? (
                    day.shift ? (
                        <p className="text-sm font-black text-cyan-400 uppercase tracking-tighter text-center leading-tight whitespace-pre-line">
                            {day.shift.replace(' ', '\n')}
                        </p>
                    ) : (
                        <div className="w-10 h-1.5 bg-cyan-400 rounded-full glow-cyan"></div>
                    )
                ) : day.status === DayStatus.Vacation ? (
                    <div className="flex flex-col items-center gap-1">
                        <SunIcon className="w-6 h-6 text-emerald-400" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">VACACIONES</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-1">
                        <StarIcon className="w-6 h-6 text-blue-400" />
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">FESTIVO</span>
                    </div>
                )}
            </div>

            <div className="flex justify-center w-full">
                {hours > 0 ? (
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {hours.toFixed(1)} HORAS
                    </span>
                ) : (
                    <span className="h-3"></span>
                )}
            </div>
        </button>
    );
};

export default DayCard;
