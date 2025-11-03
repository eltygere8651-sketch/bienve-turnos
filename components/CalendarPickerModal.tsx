import React, { useState, useMemo } from 'react';
import { getWeekDays, getMonthTitle } from '../utils/dateUtils';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface CalendarPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate: Date; // The currently selected date in the app
    onDateSelect: (date: Date) => void;
}

const CalendarPickerModal: React.FC<CalendarPickerModalProps> = ({ isOpen, onClose, currentDate, onDateSelect }) => {
    const [displayDate, setDisplayDate] = useState(new Date(currentDate));

    const daysInMonth = useMemo(() => {
        const date = displayDate;
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        
        const days = [];
        // Days from previous month
        const startDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1; // 0=Mon, 6=Sun
        for (let i = 0; i < startDayOfWeek; i++) {
            const day = new Date(firstDayOfMonth);
            day.setDate(day.getDate() - (startDayOfWeek - i));
            days.push({ date: day, isCurrentMonth: false });
        }
        
        // Days of current month
        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }

        // Days from next month
        const endDayOfWeek = lastDayOfMonth.getDay() === 0 ? 6 : lastDayOfMonth.getDay() - 1;
        for (let i = 1; i < 7 - endDayOfWeek; i++) {
            const day = new Date(lastDayOfMonth);
            day.setDate(day.getDate() + i);
            days.push({ date: day, isCurrentMonth: false });
        }
        
        return days;
    }, [displayDate]);

    const handlePrevMonth = () => {
        setDisplayDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setDisplayDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
    };
    
    if (!isOpen) return null;

    const today = new Date();
    const todayString = today.toDateString();
    
    const selectedWeekDays = getWeekDays(currentDate).map(d => d.toDateString());

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-4 border border-gray-700 animate-fade-in-scale-up" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-700 rounded-full"><ChevronLeftIcon className="w-6 h-6" /></button>
                    <h3 className="text-lg font-semibold text-red-400 capitalize">{getMonthTitle(displayDate)}</h3>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-gray-700 rounded-full"><ChevronRightIcon className="w-6 h-6" /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {daysInMonth.map(({ date, isCurrentMonth }) => {
                        const dateString = date.toDateString();
                        const isToday = dateString === todayString;
                        const isSelectedWeek = selectedWeekDays.includes(dateString);

                        let buttonClasses = 'w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-200';
                        if (!isCurrentMonth) {
                            buttonClasses += ' text-gray-500';
                        }
                        if (isSelectedWeek) {
                            buttonClasses += ' bg-red-800/50 text-white font-semibold';
                        }
                        if (isToday) {
                            buttonClasses += ' ring-2 ring-red-500';
                        }
                        if (isCurrentMonth && !isSelectedWeek) {
                            buttonClasses += ' hover:bg-gray-700';
                        }

                        return (
                            <button 
                                key={dateString}
                                onClick={() => onDateSelect(date)}
                                className={buttonClasses}
                            >
                                {date.getDate()}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CalendarPickerModal;