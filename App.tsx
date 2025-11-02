import React, { useState, useMemo, useCallback, useEffect } from 'react';
import 'jspdf'; // Import for side-effect to load the library
import { Day, Schedule, DayStatus } from './types';
import { getWeekId, getWeekDays, getWeekTitle, getDaysInMonth } from './utils/dateUtils';
import { calculateHoursFromShift } from './services/scheduleService';
import * as notificationService from './services/notificationService';
import { downloadScheduleAsPdf, downloadMonthScheduleAsPdf, svgToPngDataUrl } from './services/pdfService';
import Header from './components/Header';
import WeekView from './components/WeekView';
import Summary from './components/Summary';
import EditShiftModal from './components/EditShiftModal';
import { useShiftTemplates } from './hooks/useShiftTemplates';
import ManageTemplatesModal from './components/ManageTemplatesModal';
import { LOGO_SVG_STRING } from './constants';

const SCHEDULE_STORAGE_KEY = 'bienveAppSchedule';

const App: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [schedule, setSchedule] = useState<Schedule>(() => {
        try {
            const savedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
            if (savedSchedule) {
                const parsed = JSON.parse(savedSchedule);
                // Dates are stored as strings in JSON, so we need to convert them back to Date objects
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
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
    const [logoPngUrl, setLogoPngUrl] = useState<string>('');
    const { templates, addTemplate, deleteTemplate } = useShiftTemplates();
    const [isManagingTemplates, setIsManagingTemplates] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloadingMonth, setIsDownloadingMonth] = useState(false);


    useEffect(() => {
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
        // Generate PNG version of the logo for notifications
        svgToPngDataUrl(LOGO_SVG_STRING, 100, 100).then(setLogoPngUrl).catch(console.error);
    }, []);

    // Effect for saving schedule to localStorage whenever it changes
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
        // Ensure the week has 7 days, even if loaded data is partial
        const scheduledDaysMap = new Map(schedule[weekId].map(d => [d.date.toDateString(), d]));
        return days.map(date => scheduledDaysMap.get(date.toDateString()) || { date, shift: '', status: DayStatus.Work });
    }, [currentDate, schedule, weekId]);

    const nextWeekDate = useMemo(() => {
         const date = new Date(currentDate);
        date.setDate(date.getDate() + 7);
        return date;
    }, [currentDate]);

    const nextWeekId = useMemo(() => getWeekId(nextWeekDate), [nextWeekDate]);

    const nextWeekDays = useMemo(() => {
        const days = getWeekDays(nextWeekDate);
        if (!schedule[nextWeekId]) {
            return days.map(date => ({ date, shift: '', status: DayStatus.Work }));
        }
        return schedule[nextWeekId];
    }, [nextWeekDate, schedule, nextWeekId]);


    useEffect(() => {
        if (notificationPermission === 'granted' && logoPngUrl) {
            notificationService.scheduleNotificationsForWeek(weekDays, nextWeekDays, nextWeekId, logoPngUrl);
        } else {
            notificationService.clearAllNotifications();
        }
        return () => {
            notificationService.clearAllNotifications();
        };
    }, [schedule, weekDays, nextWeekDays, nextWeekId, notificationPermission, logoPngUrl]);

    const handleUpdateDay = useCallback((updatedDay: Day) => {
        setSchedule(prevSchedule => {
            const currentWeekData = prevSchedule[weekId] || weekDays;
            const newWeekDays = [...currentWeekData];
            const dayIndex = newWeekDays.findIndex(d => d.date.toDateString() === updatedDay.date.toDateString());
            if (dayIndex !== -1) {
                newWeekDays[dayIndex] = updatedDay;
            }
            return { ...prevSchedule, [weekId]: newWeekDays };
        });
        setEditingDay(null);
    }, [weekId, weekDays]);
    
    const handleSetWeekStatus = useCallback((status: DayStatus) => {
        setSchedule(prevSchedule => {
            const newWeekDays = weekDays.map(day => ({...day, status, shift: status === DayStatus.Work ? day.shift : ''}));
            return {...prevSchedule, [weekId]: newWeekDays};
        });
    }, [weekId, weekDays]);

    const handleClearWeek = useCallback(() => {
        if (window.confirm('¿Estás seguro de que quieres borrar todos los turnos de esta semana?')) {
            setSchedule(prevSchedule => {
                const newWeekDays = weekDays.map(day => ({...day, shift: '', status: DayStatus.Work}));
                return {...prevSchedule, [weekId]: newWeekDays};
            });
        }
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
    
    const handleGoToToday = () => {
        setCurrentDate(new Date());
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
            const monthSchedule: Day[] = daysInMonth.map(date => {
                const weekId = getWeekId(date);
                const dayData = schedule[weekId]?.find(d => d.date.toDateString() === date.toDateString());
                return dayData || { date, shift: '', status: DayStatus.Work };
            });

            const totalHoursMonth = monthSchedule.reduce((acc, day) => {
                if (day.status === DayStatus.Work) {
                    return acc + calculateHoursFromShift(day.shift);
                }
                return acc;
            }, 0);

            const overtimeThreshold = 40 * (daysInMonth.length / 7); // ~40h/week
            const overtimeHoursMonth = Math.max(0, totalHoursMonth - overtimeThreshold);

            await downloadMonthScheduleAsPdf({
                monthDays: monthSchedule,
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

    const handleRequestPermission = async () => {
        const permission = await notificationService.requestPermission();
        setNotificationPermission(permission);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
            <Header
                currentWeekTitle={getWeekTitle(currentDate)}
                onPrevWeek={handlePrevWeek}
                onNextWeek={handleNextWeek}
                onGoToToday={handleGoToToday}
                onDateChange={setCurrentDate}
                onRequestPermission={handleRequestPermission}
                notificationStatus={notificationPermission}
                onDownloadMonth={handleDownloadMonth}
                isDownloadingMonth={isDownloadingMonth}
            />
            <main className="flex-grow p-4 md:p-6 lg:p-8">
                <WeekView 
                    days={weekDays} 
                    onEditDay={setEditingDay} 
                    onSetWeekStatus={handleSetWeekStatus}
                    onClearWeek={handleClearWeek}
                />
            </main>
            <Summary 
                totalHours={totalHours} 
                overtimeHours={overtimeHours}
                onDownload={handleDownload}
                isDownloading={isDownloading}
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
        </div>
    );
};

export default App;