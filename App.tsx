

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Day, Schedule, DayStatus } from './types';
import { getWeekId, getWeekDays, getWeekTitle, getDaysInMonth } from './utils/dateUtils';
import { calculateHoursFromShift } from './services/scheduleService';
import { downloadScheduleAsPdf, downloadMonthScheduleAsPdf, downloadCustomPeriodPdf } from './services/pdfService';
import Header from './components/Header';
import WeekView from './components/WeekView';
import Summary from './components/Summary';
import EditShiftModal from './components/EditShiftModal';
import { useShiftTemplates } from './hooks/useShiftTemplates';
import CalendarPickerModal from './components/CalendarPickerModal';
import ManageTemplatesModal from './components/ManageTemplatesModal';
import CustomPeriodModal from './components/CustomPeriodModal';

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
    const [isDownloadingCustomPeriod, setIsDownloadingCustomPeriod] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isCustomPeriodModalOpen, setIsCustomPeriodModalOpen] = useState(false);

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
        const workHours = weekDays.reduce((acc, day) => {
            if (day.status === DayStatus.Work) {
                return acc + calculateHoursFromShift(day.shift);
            }
            return acc;
        }, 0);
    
        // Only calculate deficit for weeks that are meant for work.
        // If all days are holiday/vacation, there is no deficit.
        const isWorkWeek = weekDays.some(day => day.status === DayStatus.Work);
        const overtime = isWorkWeek ? workHours - 40 : 0;
    
        return { totalHours: workHours, overtimeHours: overtime };
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
    
            const totalHoursMonth = daysInMonth.reduce((acc, date) => {
                const dayKey = date.toISOString().slice(0, 10);
                const day = scheduleMap.get(dayKey);
                if (day && day.status === DayStatus.Work) {
                    return acc + calculateHoursFromShift(day.shift);
                }
                return acc;
            }, 0);
    
            let overtimeBalanceMonth = 0.0;
            const processedWeekIds = new Set<string>();
    
            daysInMonth.forEach(dateInMonth => {
                const weekId = getWeekId(dateInMonth);
                if (processedWeekIds.has(weekId)) {
                    return;
                }
    
                const fullWeekDays = getWeekDays(dateInMonth);
                const fullWeekDaysWithData = fullWeekDays.map(dateOfWeek => {
                    const dayKey = dateOfWeek.toISOString().slice(0, 10);
                    return scheduleMap.get(dayKey) || { date: dateOfWeek, shift: '', status: DayStatus.Work };
                });

                const isWorkWeek = fullWeekDaysWithData.some(day => day.status === DayStatus.Work);

                if (isWorkWeek) {
                    const workHoursInWeek = fullWeekDaysWithData.reduce((acc, day) => {
                        if (day.status === DayStatus.Work) {
                            return acc + calculateHoursFromShift(day.shift);
                        }
                        return acc;
                    }, 0);
                    overtimeBalanceMonth += (workHoursInWeek - 40);
                }
                
                processedWeekIds.add(weekId);
            });
            
            const totalOvertimeMonth = overtimeBalanceMonth;
    
            const monthDaysForPdf = daysInMonth
                .map(date => {
                    const dayKey = date.toISOString().slice(0, 10);
                    return scheduleMap.get(dayKey) || { date, shift: '', status: DayStatus.Work };
                })
                .filter(day => day.shift.trim() !== '' || day.status !== DayStatus.Work);
    
            await downloadMonthScheduleAsPdf({
                monthDays: monthDaysForPdf,
                currentDate,
                totalHours: totalHoursMonth,
                overtimeHours: totalOvertimeMonth
            });
    
        } catch (error) {
            console.error("Monthly PDF Download failed:", error);
            alert(error instanceof Error ? error.message : "Ocurrió un error inesperado al generar el PDF del mes.");
        } finally {
            setIsDownloadingMonth(false);
        }
    };
    
    const handleDownloadCustomPeriod = async (startDate: Date, endDate: Date) => {
        setIsDownloadingCustomPeriod(true);
        setIsCustomPeriodModalOpen(false);

        try {
            const periodDates: Date[] = [];
            let loopDate = new Date(startDate);
            while (loopDate <= endDate) {
                periodDates.push(new Date(loopDate));
                loopDate.setDate(loopDate.getDate() + 1);
            }
    
            const scheduleMap = new Map<string, Day>();
            Object.values(schedule).flat().forEach((day: Day) => {
                const dayKey = new Date(day.date).toISOString().slice(0, 10);
                scheduleMap.set(dayKey, day);
            });
    
            const periodDaysWithData = periodDates.map(date => {
                const dayKey = date.toISOString().slice(0, 10);
                return scheduleMap.get(dayKey) || { date, shift: '', status: DayStatus.Work };
            });
    
            const totalHoursPeriod = periodDaysWithData.reduce((acc, day) => {
                if (day && day.status === DayStatus.Work) {
                    return acc + calculateHoursFromShift(day.shift);
                }
                return acc;
            }, 0);
    
            const processedWeekIds = new Set<string>();
            let overtimeBalancePeriod = 0.0;

            periodDaysWithData.forEach(dayInPeriod => {
                const weekId = getWeekId(dayInPeriod.date);
                
                if (!processedWeekIds.has(weekId)) {
                    const fullWeekDays = getWeekDays(dayInPeriod.date);
                    const fullWeekDaysWithData = fullWeekDays.map(dateOfWeek => {
                        const dayKey = dateOfWeek.toISOString().slice(0, 10);
                        return scheduleMap.get(dayKey) || { date: dateOfWeek, shift: '', status: DayStatus.Work };
                    });

                    const isWorkWeek = fullWeekDaysWithData.some(day => day.status === DayStatus.Work);

                    if (isWorkWeek) {
                        const workHoursInWeek = fullWeekDaysWithData.reduce((acc, day) => {
                            if (day.status === DayStatus.Work) {
                                return acc + calculateHoursFromShift(day.shift);
                            }
                            return acc;
                        }, 0);
                        overtimeBalancePeriod += (workHoursInWeek - 40);
                    }
                    
                    processedWeekIds.add(weekId);
                }
            });
            
            const totalOvertimePeriod = overtimeBalancePeriod;
    
            const periodDaysForPdf = periodDaysWithData.filter(day => day.shift.trim() !== '' || day.status !== DayStatus.Work);

            await downloadCustomPeriodPdf({
                periodDays: periodDaysForPdf,
                startDate,
                endDate,
                totalHours: totalHoursPeriod,
                overtimeHours: totalOvertimePeriod
            });
    
        } catch (error) {
            console.error("Custom Period PDF Download failed:", error);
            alert(error instanceof Error ? error.message : "Ocurrió un error inesperado al generar el PDF del periodo personalizado.");
        } finally {
            setIsDownloadingCustomPeriod(false);
        }
    };

    const handleGenerateShifts = useCallback(() => {
        const shiftPatterns = [
            { shift: '08-16', status: DayStatus.Work },
            { shift: '10-18', status: DayStatus.Work },
            { shift: '16-C', status: DayStatus.Work },
            { shift: '12-16 20-C', status: DayStatus.Work },
            { shift: '18-02', status: DayStatus.Work },
            { shift: '09-17', status: DayStatus.Work },
            { shift: '14-22', status: DayStatus.Work },
            { shift: '', status: DayStatus.Work }, // Day off
            { shift: '', status: DayStatus.Work }, // Day off (higher probability)
            { shift: '', status: DayStatus.Work }, // Day off (higher probability)
        ];

        const rarePatterns = [
            { shift: '', status: DayStatus.Holiday },
            { shift: '', status: DayStatus.Vacation },
        ];

        const newWeekData = weekDays.map(day => {
            let randomPattern;
            // Make holidays and vacations rare
            if (Math.random() < 0.1) { // 10% chance for a rare event
                randomPattern = rarePatterns[Math.floor(Math.random() * rarePatterns.length)];
            } else {
                randomPattern = shiftPatterns[Math.floor(Math.random() * shiftPatterns.length)];
            }

            return {
                date: day.date,
                shift: randomPattern.shift,
                status: randomPattern.status,
            };
        });

        setSchedule(prevSchedule => ({
            ...prevSchedule,
            [weekId]: newWeekData,
        }));
    }, [weekId, weekDays]);


    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
            <Header
                currentWeekTitle={getWeekTitle(currentDate)}
                onPrevWeek={handlePrevWeek}
                onNextWeek={handleNextWeek}
                onCalendarClick={() => setIsCalendarOpen(true)}
                onGenerateShifts={handleGenerateShifts}
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
                onOpenCustomPeriodModal={() => setIsCustomPeriodModalOpen(true)}
                isDownloadingCustomPeriod={isDownloadingCustomPeriod}
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
            {isCustomPeriodModalOpen && (
                <CustomPeriodModal
                    isOpen={isCustomPeriodModalOpen}
                    onClose={() => setIsCustomPeriodModalOpen(false)}
                    onConfirm={handleDownloadCustomPeriod}
                />
            )}
        </div>
    );
};

export default App;