import React from 'react';
import { Day } from '../types';
import DayCard from './DayCard';

interface WeekViewProps {
    days: Day[];
    onEditDay: (day: Day) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ days, onEditDay }) => {
    const todayString = new Date().toDateString();
    
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 md:gap-4">
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
        </div>
    );
};

export default WeekView;