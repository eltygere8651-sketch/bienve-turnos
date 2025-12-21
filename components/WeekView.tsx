
import React from 'react';
import { Day } from '../types';
import DayCard from './DayCard';

interface WeekViewProps {
    days: Day[];
    onEditDay: (day: Day) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ days, onEditDay }) => {
    const todayStr = new Date().toDateString();
    
    return (
        <div className="max-w-xl mx-auto px-4">
            <div className="grid grid-cols-2 gap-3 pb-24">
                {days.map(day => (
                    <div key={day.date.toISOString()} className="animate-card">
                        <DayCard 
                            day={day} 
                            onEdit={onEditDay}
                            isToday={day.date.toDateString() === todayStr}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeekView;
