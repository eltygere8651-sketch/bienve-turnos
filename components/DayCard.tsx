
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
            className={`relative rounded-xl p-4 w-full h-32 flex flex-col justify-between border transition-all active:scale-95 focus:outline-none bg-[#1e293b]/80 border-gray-700 ${isToday ? 'ring-2 ring-red-500 border-red-500' : ''}`}
            onClick={() => onEdit(day)}
        >
            <div className="flex justify-between items-start w-full">
                <span className="text-sm font-bold text-white capitalize">{formatDayName(day.date)}</span>
                <span className="text-sm font-bold text-white">{formatDayDate(day.date)}</span>
            </div>

            <div className="flex items-center justify-center w-full">
                {day.status === DayStatus.Work ? (
                    day.shift ? (
                        <p className="text-base font-bold text-cyan-400 uppercase tracking-tight truncate">
                            {day.shift}
                        </p>
                    ) : (
                        <div className="w-6 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                    )
                ) : day.status === DayStatus.Vacation ? (
                    <SunIcon className="w-6 h-6 text-emerald-400" />
                ) : (
                    <StarIcon className="w-6 h-6 text-indigo-400" />
                )}
            </div>

            <div className="flex justify-between items-end w-full">
                {hours > 0 ? (
                    <p className="text-[10px] font-bold text-gray-400">{hours.toFixed(1)}h</p>
                ) : <div />}
            </div>
        </button>
    );
};

export default DayCard;
