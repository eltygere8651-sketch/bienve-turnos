


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
    
        const daysOff = weekDays.filter(d => d.status === DayStatus.Holiday || d.status === DayStatus.Vacation).length;
        // A standard work week is 40 hours with 2 days off. 
        // Any holidays or vacation days beyond the standard 2 reduce the 40-hour target by 8 hours each.
        const extraDaysOff = Math.max(0, daysOff - 2);
        const weeklyTarget = Math.max(0, 40 - (extraDaysOff * 8));
    
        const overtime = workHours - weeklyTarget;
    
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

                    const daysOff = fullWeekDaysWithData.filter(d => d.status === DayStatus.Holiday || d.status === DayStatus.Vacation).length;
                    const extraDaysOff = Math.max(0, daysOff - 2);
                    const weeklyTarget = Math.max(0, 40 - (extraDaysOff * 8));

                    overtimeBalanceMonth += (workHoursInWeek - weeklyTarget);
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

                        const daysOff = fullWeekDaysWithData.filter(d => d.status === DayStatus.Holiday || d.status === DayStatus.Vacation).length;
                        const extraDaysOff = Math.max(0, daysOff - 2);
                        const weeklyTarget = Math.max(0, 40 - (extraDaysOff * 8));

                        overtimeBalancePeriod += (workHoursInWeek - weeklyTarget);
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
        const testData = [
          // Semana del 29 de septiembre al 5 de octubre
          { date: '2025-09-29', shift: '', status: DayStatus.Holiday },
          { date: '2025-09-30', shift: '', status: DayStatus.Holiday },
          { date: '2025-10-01', shift: '12-17 20-01', status: DayStatus.Work },
          { date: '2025-10-02', shift: '13-17 20-23:30', status: DayStatus.Work },
          { date: '2025-10-03', shift: '13-16:30 20-00', status: DayStatus.Work },
          { date: '2025-10-04', shift: '12-16:30 20-00:30', status: DayStatus.Work },
          { date: '2025-10-05', shift: '12-16 20-23:30', status: DayStatus.Work },
          // Semana del 6 de octubre al 12 de octubre
          { date: '2025-10-06', shift: '', status: DayStatus.Holiday },
          { date: '2025-10-07', shift: '', status: DayStatus.Holiday },
          { date: '2025-10-08', shift: '14-23:30', status: DayStatus.Work },
          { date: '2025-10-09', shift: '14-23', status: DayStatus.Work },
          { date: '2025-10-10', shift: '14-23', status: DayStatus.Work },
          { date: '2025-10-11', shift: '13-17 20-01', status: DayStatus.Work },
          { date: '2025-10-12', shift: '13-17 20-00', status: DayStatus.Work },
          // Semana del 13 de octubre al 19 de octubre
          { date: '2025-10-13', shift: '19-00', status: DayStatus.Work },
          { date: '2025-10-14', shift: '19-00', status: DayStatus.Work },
          { date: '2025-10-15', shift: '19-00', status: DayStatus.Work },
          { date: '2025-10-16', shift: '11-16 20-00', status: DayStatus.Work },
          { date: '2025-10-17', shift: '', status: DayStatus.Holiday },
          { date: '2025-10-18', shift: '13-17 20-01', status: DayStatus.Work },
          { date: '2025-10-19', shift: '13-17 20-00:30', status: DayStatus.Work },
          // Semana del 20 de octubre al 26 de octubre
          { date: '2025-10-20', shift: '14-23:30', status: DayStatus.Work },
          { date: '2025-10-21', shift: '', status: DayStatus.Vacation },
          { date: '2025-10-22', shift: '', status: DayStatus.Vacation },
          { date: '2025-10-23', shift: '', status: DayStatus.Vacation },
          { date: '2025-10-24', shift: '', status: DayStatus.Vacation },
          { date: '2025-10-25', shift: '', status: DayStatus.Vacation },
          { date: '2025-10-26', shift: '', status: DayStatus.Vacation },
          // Semana del 27 de octubre al 2 de noviembre
          { date: '2025-10-27', shift: '', status: DayStatus.Vacation },
          { date: '2025-10-28', shift: '14-23:30', status: DayStatus.Work },
          { date: '2025-10-29', shift: '14-23', status: DayStatus.Work },
          { date: '2025-10-30', shift: '12-16:30 20-00', status: DayStatus.Work },
          { date: '2025-10-31', shift: '19-00:30', status: DayStatus.Work },
          { date: '2025-11-01', shift: '13-17 20-01', status: DayStatus.Work },
          { date: '2025-11-02', shift: '13-17 20-23', status: DayStatus.Work },
        ];
    
        const newSchedule: Schedule = {};
    
        testData.forEach(item => {
            // Use UTC to avoid timezone issues when parsing date strings
            const [y, m, d] = item.date.split('-').map(Number);
            const date = new Date(Date.UTC(y, m - 1, d));
            const weekId = getWeekId(date);
    
            if (!newSchedule[weekId]) {
                newSchedule[weekId] = [];
            }
    
            newSchedule[weekId].push({
                date,
                shift: item.shift,
                status: item.status,
            });
        });
    
        setSchedule(newSchedule);
    
        // Set current date to the beginning of the test period
        const [y, m, d] = testData[0].date.split('-').map(Number);
        setCurrentDate(new Date(Date.UTC(y, m - 1, d)));
        
        alert('Datos de prueba generados para el periodo del 29 de septiembre al 2 de noviembre de 2025.');
    }, []);


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