

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Day, Schedule, DayStatus } from './types';
import { getWeekId, getWeekDays, getWeekTitle, getDaysInMonth } from './utils/dateUtils';
import { calculateHoursFromShift } from './services/scheduleService';
import { downloadScheduleAsPdf, downloadMonthScheduleAsPdf } from './services/pdfService';
import Header from './components/Header';
import WeekView from './components/WeekView';
import Summary from './components/Summary';
import EditShiftModal from './components/EditShiftModal';
import { useShiftTemplates } from './hooks/useShiftTemplates';
import CalendarPickerModal from './components/CalendarPickerModal';
import ManageTemplatesModal from './components/ManageTemplatesModal';

const SCHEDULE_STORAGE_KEY = 'bienveAppSchedule';

const App: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [schedule, setSchedule] = useState<Schedule>(() => {
        try {
            const savedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
            if (savedSchedule) {
                const parsed = JSON.parse(savedSchedule);
                // Re-hydrate Date objects
                Object.keys(parsed).forEach(weekId => {
                    parsed[weekId] = parsed[weekId].map((day: any) => ({
                        ...day,
                        date: new Date(day.date),
                    }));
                });
                return parsed;
            }
        } catch (error) {
            console.error("Failed to load schedule from localStorage", error);
        }
        return {};
    });
    
    const [editingDay, setEditingDay] = useState<Day | null>(null);
    const { templates, addTemplate, deleteTemplate } = useShiftTemplates();
    const [isManagingTemplates, setIsManagingTemplates] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloadingMonth, setIsDownloadingMonth] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedule));
        } catch (error) {
            console.error("Failed to save schedule to localStorage", error);
        }
    }, [schedule]);

    const weekId = useMemo(() => getWeekId(currentDate), [currentDate]);
    
    const weekDays = useMemo(() => {
        const days = getWeekDays(currentDate);
        if (!schedule[weekId]) {
            return days.map(date => ({ date, shift: '', status: DayStatus.Work }));
        }
        // FIX: Use ISO string (YYYY-MM-DD) for robust date keying in the map.
        // This prevents inconsistencies with `toDateString()` across different browsers and platforms (like mobile vs. desktop).
        const scheduledDaysMap = new Map(schedule[weekId].map(d => [new Date(d.date).toISOString().slice(0, 10), d]));
        return days.map(date => scheduledDaysMap.get(date.toISOString().slice(0, 10)) || { date, shift: '', status: DayStatus.Work });
    }, [currentDate, schedule, weekId]);

    const handleUpdateDay = useCallback((updatedDay: Day) => {
        setSchedule(prevSchedule => {
            const currentWeekData = prevSchedule[weekId] || weekDays;
            const newWeekDays = [...currentWeekData];
            // FIX: Use ISO string (YYYY-MM-DD) for comparison to reliably find the day to update.
            const dayIndex = newWeekDays.findIndex(d => new Date(d.date).toISOString().slice(0, 10) === updatedDay.date.toISOString().slice(0, 10));
            if (dayIndex !== -1) {
                newWeekDays[dayIndex] = updatedDay;
            } else {
                // If day is not found, it might be a new day for this week (e.g. from calendar picker)
                newWeekDays.push(updatedDay);
            }
            return { ...prevSchedule, [weekId]: newWeekDays };
        });
        setEditingDay(null);
    }, [weekId, weekDays]);
    
    const { totalHours, overtimeHours } = useMemo(() => {
        const isVacationWeek = weekDays.every(day => day.status === DayStatus.Vacation);
        if(isVacationWeek) return { totalHours: 0, overtimeHours: 0};
        
        const total = weekDays.reduce((acc, day) => {
            if (day.status === DayStatus.Work) {
                return acc + calculateHoursFromShift(day.shift);
            }
            return acc;
        }, 0);
        
        const overtime = Math.max(0, total - 40);
        return { totalHours: total, overtimeHours: overtime };
    }, [weekDays]);

    const handlePrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };
    
    const handleDateSelect = (date: Date) => {
        setCurrentDate(date);
        setIsCalendarOpen(false);
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            await downloadScheduleAsPdf({
                weekDays,
                currentDate,
                totalHours,
                overtimeHours
            });
        } catch (error) {
            console.error("PDF Download failed:", error);
            alert(error instanceof Error ? error.message : "Ocurrió un error inesperado al generar el PDF.");
        } finally {
            setIsDownloading(false);
        }
    };
    
    const handleDownloadMonth = async () => {
        setIsDownloadingMonth(true);
        try {
            const daysInMonth = getDaysInMonth(currentDate);
            
            const scheduleMap = new Map<string, Day>();
            Object.values(schedule).flat().forEach((day: Day) => {
                const dayKey = new Date(day.date).toISOString().slice(0, 10);
                scheduleMap.set(dayKey, day);
            });
    
            const weeksInMonth: { [weekId: string]: Day[] } = {};
            daysInMonth.forEach(date => {
                const weekId = getWeekId(date);
                if (!weeksInMonth[weekId]) {
                    weeksInMonth[weekId] = [];
                }
                const dayKey = date.toISOString().slice(0, 10);
                const dayData = scheduleMap.get(dayKey);
                weeksInMonth[weekId].push(dayData || { date, shift: '', status: DayStatus.Work });
            });
    
            const activeWeeks: { [weekId: string]: Day[] } = {};
            for (const weekId in weeksInMonth) {
                const weekDaysInMonth = weeksInMonth[weekId];
                const isActive = weekDaysInMonth.some(day => day.shift.trim() !== '' || day.status !== DayStatus.Work);
                if (isActive) {
                    activeWeeks[weekId] = weekDaysInMonth;
                }
            }
    
            let totalHoursMonth = 0;
            let overtimeHoursMonth = 0;
    
            for (const weekId in activeWeeks) {
                const daysForThisWeekInMonth = activeWeeks[weekId];
                
                totalHoursMonth += daysForThisWeekInMonth.reduce((acc: number, day: Day) => {
                    if (day.status === DayStatus.Work) {
                        return acc + calculateHoursFromShift(day.shift);
                    }
                    return acc;
                }, 0);
    
                const sampleDateForWeek = daysForThisWeekInMonth[0].date;
                const fullWeekDaysDates = getWeekDays(sampleDateForWeek);
                
                const totalHoursInFullWeek = fullWeekDaysDates.reduce((acc: number, date: Date) => {
                    const dayKey = date.toISOString().slice(0, 10);
                    const day = scheduleMap.get(dayKey);
                    if (day && day.status === DayStatus.Work) {
                        return acc + calculateHoursFromShift(day.shift);
                    }
                    return acc;
                }, 0);
    
                overtimeHoursMonth += Math.max(0, totalHoursInFullWeek - 40);
            }
            
            const monthScheduleForPdf = Object.values(activeWeeks).flat();
    
            await downloadMonthScheduleAsPdf({
                monthDays: monthScheduleForPdf,
                currentDate,
                totalHours: totalHoursMonth,
                overtimeHours: overtimeHoursMonth
            });
    
        } catch (error) {
            console.error("Monthly PDF Download failed:", error);
            alert(error instanceof Error ? error.message : "Ocurrió un error inesperado al generar el PDF del mes.");
        } finally {
            setIsDownloadingMonth(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
            <Header
                currentWeekTitle={getWeekTitle(currentDate)}
                onPrevWeek={handlePrevWeek}
                onNextWeek={handleNextWeek}
                onCalendarClick={() => setIsCalendarOpen(true)}
            />
            <main className="flex-grow py-4 md:py-6 lg:py-8">
                <WeekView 
                    days={weekDays} 
                    onEditDay={setEditingDay} 
                />
            </main>
            <Summary 
                totalHours={totalHours} 
                overtimeHours={overtimeHours}
                onDownload={handleDownload}
                isDownloading={isDownloading}
                onDownloadMonth={handleDownloadMonth}
                isDownloadingMonth={isDownloadingMonth}
            />
            {editingDay && (
                <EditShiftModal
                    day={editingDay}
                    onClose={() => setEditingDay(null)}
                    onSave={handleUpdateDay}
                    templates={templates}
                    onManageTemplates={() => setIsManagingTemplates(true)}
                />
            )}
            {isManagingTemplates && (
                <ManageTemplatesModal
                    templates={templates}
                    onAddTemplate={addTemplate}
                    onDeleteTemplate={deleteTemplate}
                    onClose={() => setIsManagingTemplates(false)}
                />
            )}
             {isCalendarOpen && (
                <CalendarPickerModal
                    isOpen={isCalendarOpen}
                    onClose={() => setIsCalendarOpen(false)}
                    currentDate={currentDate}
                    onDateSelect={handleDateSelect}
                />
            )}
        </div>
    );
};

export default App;
