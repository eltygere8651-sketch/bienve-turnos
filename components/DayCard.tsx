import React from 'react';
import { Day, DayStatus } from '../types';
import { calculateHoursFromShift } from '../services/scheduleService';
import { formatDayDate, formatDayName } from '../utils/dateUtils';
import { StarIcon } from './icons';

interface DayCardProps {
    day: Day;
    onEdit: (day: Day) => void;
    isToday: boolean;
}

const DayCard: React.FC<DayCardProps> = ({ day, onEdit, isToday }) => {
    const hours = calculateHoursFromShift(day.shift);

    const getCardClasses = () => {
        let classes = 'bg-gray-800 border-gray-700 hover:border-red-500'; // Default
        if (day.status === DayStatus.Vacation) {
            classes = 'bg-green-800/50 border-green-500';
        } else if (day.status === DayStatus.Holiday) {
            classes = 'bg-blue-800/50 border-blue-500';
        }

        if (isToday) {
            classes += ' border-red-500 ring-2 ring-red-500 shadow-red-500/30';
        }
        
        return classes;
    };
    
    const getStatusText = () => {
        switch (day.status) {
            case DayStatus.Vacation:
                return 'VACACIONES';
            case DayStatus.Holiday:
                return 'FESTIVO';
            default:
                return day.shift || 'Sin turno';
        }
    };

    return (
        <div 
            className={`rounded-xl shadow-lg p-3 flex flex-col justify-between border-2 transition-all duration-300 ease-in-out transform hover:-translate-y-1 active:scale-95 cursor-pointer ${getCardClasses()}`}
            onClick={() => onEdit(day)}
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-base capitalize">{formatDayName(day.date)}</p>
                    <p className="text-gray-400 text-xs">{formatDayDate(day.date)}</p>
                </div>
                {day.status === DayStatus.Holiday && <StarIcon className="w-5 h-5 text-yellow-400" />}
            </div>
            <div className="text-center my-4 flex-grow flex items-center justify-center min-h-[40px]">
                <p className="text-xl font-mono font-bold text-red-300">{getStatusText()}</p>
            </div>
            <div className="text-right">
                <p className="text-base font-semibold text-white">
                    {day.status === DayStatus.Work ? `${hours.toFixed(1)}h` : '0h'}
                </p>
            </div>
        </div>
    );
};

export default DayCard;