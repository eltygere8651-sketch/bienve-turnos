

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
            const reportMonth = currentDate.getMonth();
    
            // Create a comprehensive map of all known schedule days for easy lookup.
            const scheduleMap = new Map<string, Day>();
            Object.values(schedule).flat().forEach((day: Day) => {
                const dayKey = new Date(day.date).toISOString().slice(0, 10);
                scheduleMap.set(dayKey, day);
            });
    
            // 1. Calculate Total Hours: Sum hours for every day that falls within the report's month.
            const totalHoursMonth = daysInMonth.reduce((acc, date) => {
                const dayKey = date.toISOString().slice(0, 10);
                const day = scheduleMap.get(dayKey);
                if (day && day.status === DayStatus.Work) {
                    return acc + calculateHoursFromShift(day.shift);
                }
                return acc;
            }, 0);
    
            // 2. Calculate Net Overtime: Implements an "hour bank" by summing weekly overtime and subtracting undertime.
            let netOvertimeBalance = 0;
            const processedWeekIds = new Set<string>();
    
            daysInMonth.forEach(dateInMonth => {
                const weekId = getWeekId(dateInMonth);
                if (processedWeekIds.has(weekId)) {
                    return; // Avoid recalculating the same week.
                }
    
                const fullWeekDays = getWeekDays(dateInMonth);
                const sundayOfWeek = fullWeekDays[6];
    
                // Only process weeks that end in the report's month to prevent double-counting.
                if (sundayOfWeek.getMonth() === reportMonth) {
                    const totalHoursInFullWeek = fullWeekDays.reduce((acc, dateOfWeek) => {
                        const dayKey = dateOfWeek.toISOString().slice(0, 10);
                        const day = scheduleMap.get(dayKey);
                        if (day && day.status === DayStatus.Work) {
                            return acc + calculateHoursFromShift(day.shift);
                        }
                        return acc;
                    }, 0);

                    if (totalHoursInFullWeek > 0) {
                        netOvertimeBalance += (totalHoursInFullWeek - 40);
                    }
                }
                
                processedWeekIds.add(weekId);
            });
            
            const finalOvertimeHoursMonth = Math.max(0, netOvertimeBalance);
    
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
                overtimeHours: finalOvertimeHoursMonth
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
            // 1. Get all dates in the range
            const periodDates: Date[] = [];
            let loopDate = new Date(startDate);
            while (loopDate <= endDate) {
                periodDates.push(new Date(loopDate));
                loopDate.setDate(loopDate.getDate() + 1);
            }
    
            // 2. Create a map of all scheduled days for efficient lookup
            const scheduleMap = new Map<string, Day>();
            Object.values(schedule).flat().forEach((day: Day) => {
                const dayKey = new Date(day.date).toISOString().slice(0, 10);
                scheduleMap.set(dayKey, day);
            });
    
            // 3. Get the Day objects for the period, creating placeholders if none exist
            const periodDaysWithData = periodDates.map(date => {
                const dayKey = date.toISOString().slice(0, 10);
                return scheduleMap.get(dayKey) || { date, shift: '', status: DayStatus.Work };
            });
    
            // 4. Calculate total hours *only* for days within the selected period
            const totalHoursPeriod = periodDaysWithData.reduce((acc, day) => {
                if (day.status === DayStatus.Work) {
                    return acc + calculateHoursFromShift(day.shift);
                }
                return acc;
            }, 0);
    
            // 5. Calculate net overtime based on weekly balances *only for hours within the period*.
            // This implements an "hour bank" where undertime in one week is subtracted from overtime in another.
            const weeklyHoursMap = new Map<string, number>();
            periodDaysWithData.forEach(day => {
                // Vacations and holidays are excluded from hour calculations, as requested.
                if (day.status === DayStatus.Work) {
                    const weekId = getWeekId(day.date);
                    const hours = calculateHoursFromShift(day.shift);
                    weeklyHoursMap.set(weekId, (weeklyHoursMap.get(weekId) || 0) + hours);
                }
            });

            let netOvertimeBalance = 0;
            for (const weeklyTotal of weeklyHoursMap.values()) {
                // Only factor in weeks where work was actually done to calculate the balance.
                if (weeklyTotal > 0) {
                   netOvertimeBalance += (weeklyTotal - 40);
                }
            }

            // The final overtime is the positive part of the balance, ensuring it doesn't go below zero.
            const totalOvertimePeriod = Math.max(0, netOvertimeBalance);
    
            // 6. Collect days that have shifts for PDF display
            const periodDaysForPdf = periodDaysWithData.filter(day => day.shift.trim() !== '' || day.status !== DayStatus.Work);

            // 7. Call PDF service with the accurately calculated data
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