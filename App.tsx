
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Day, Schedule, DayStatus, DriveUser, DriveScheduleData } from './types';
import { getWeekId, getWeekDays, getWeekTitle, getDaysInMonth } from './utils/dateUtils';
import { calculateHoursFromShift } from './services/scheduleService';
import * as driveService from './services/googleDriveService';
import { downloadScheduleAsPdf, downloadMonthScheduleAsPdf } from './services/pdfService';
import * as notificationService from './services/notificationService';
import Header from './components/Header';
import WeekView from './components/WeekView';
import Summary from './components/Summary';
import EditShiftModal from './components/EditShiftModal';
import { useShiftTemplates } from './hooks/useShiftTemplates';
import { useDebouncedCallback } from './hooks/useDebouncedCallback';
import ConfirmModal from './components/ConfirmModal';
import CalendarPickerModal from './components/CalendarPickerModal';
import ManageTemplatesModal from './components/ManageTemplatesModal';
import * as apiKeyService from './services/apiKeyService';
import { initializeGemini } from './services/geminiService';
import ApiKeyModal from './components/ApiKeyModal';

const SCHEDULE_STORAGE_KEY = 'bienveAppSchedule';
const TIMESTAMP_STORAGE_KEY = 'bienveAppScheduleTimestamp';

type DriveSyncStatus = 'idle' | 'syncing' | 'success' | 'error';

const App: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [schedule, setSchedule] = useState<Schedule>(() => {
        try {
            const savedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
            if (savedSchedule) {
                const parsed = JSON.parse(savedSchedule);
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
    const [scheduleTimestamp, setScheduleTimestamp] = useState<string | null>(() => {
        return localStorage.getItem(TIMESTAMP_STORAGE_KEY);
    });
    const [editingDay, setEditingDay] = useState<Day | null>(null);
    const { templates, addTemplate, deleteTemplate } = useShiftTemplates();
    const [isManagingTemplates, setIsManagingTemplates] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloadingMonth, setIsDownloadingMonth] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    
    type DriveLoadConfirmationState = {
        isOpen: true;
        onConfirm: () => void;
    } | {
        isOpen: false;
    };
    const [driveLoadConfirmation, setDriveLoadConfirmation] = useState<DriveLoadConfirmationState>({ isOpen: false });

    // API Key Management State
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [apiKeys, setApiKeys] = useState<apiKeyService.ApiKeys | null>(null);

    // Google Drive State
    const [isDriveConnected, setIsDriveConnected] = useState(false);
    const [isDriveLoading, setIsDriveLoading] = useState(true);
    const [driveUser, setDriveUser] = useState<DriveUser | null>(null);
    const [driveInitError, setDriveInitError] = useState<string | null>(null);
    const [driveSyncStatus, setDriveSyncStatus] = useState<DriveSyncStatus>('idle');
    const [isDriveAvailable, setIsDriveAvailable] = useState(false);

    // Notification State
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(Notification.permission);

    // Check for API keys on initial load
    useEffect(() => {
        const keys = apiKeyService.getApiKeys();
        if (keys) {
            setApiKeys(keys);
        } else {
            setIsApiKeyModalOpen(true);
        }
    }, []);

    const syncWithDrive = useCallback(async () => {
        if (!isDriveConnected) return;
        setIsDriveLoading(true);
        try {
            const driveData = await driveService.getSchedule();
            const localTimestamp = localStorage.getItem(TIMESTAMP_STORAGE_KEY);
    
            if (driveData) {
                if (!localTimestamp || new Date(driveData.lastModified) > new Date(localTimestamp)) {
                    setDriveLoadConfirmation({
                        isOpen: true,
                        onConfirm: () => {
                            setSchedule(driveData.schedule);
                            setScheduleTimestamp(driveData.lastModified);
                            setDriveLoadConfirmation({ isOpen: false });
                        },
                    });
                }
            } else if (Object.keys(schedule).length > 0 && scheduleTimestamp) {
                debouncedSaveToDrive({ schedule, lastModified: scheduleTimestamp });
            }
        } catch (e) {
            alert("Error al sincronizar con Google Drive.");
            console.error(e);
        } finally {
            setIsDriveLoading(false);
        }
    }, [isDriveConnected, schedule, scheduleTimestamp]);

    // Effect to initialize services when API keys are available
    useEffect(() => {
        if (!apiKeys) {
            setIsDriveAvailable(false);
            setDriveInitError("Las claves de API no están configuradas.");
            setIsDriveLoading(false);
            return;
        }

        initializeGemini(apiKeys.apiKey);

        setIsDriveLoading(true);
        driveService.initClient(
            apiKeys.clientId, 
            apiKeys.apiKey,
            (tokenResponse) => { // onTokenResponseCallback
                setIsDriveConnected(true);
                setDriveUser(driveService.getProfile());
                syncWithDrive();
            }
        )
        .then(success => {
            setIsDriveAvailable(success);
            if (success) {
                setDriveInitError(null);
            } else {
                 setDriveInitError("No se pudo inicializar. Revisa las claves de API.");
            }
        })
        .catch(err => {
            console.error("No se pudo inicializar el servicio de Google Drive:", err.message);
            setDriveInitError(err.message);
            setIsDriveAvailable(false);
        })
        .finally(() => setIsDriveLoading(false));

    }, [apiKeys, syncWithDrive]);

    const debouncedSaveToDrive = useDebouncedCallback(async (dataToSave: DriveScheduleData) => {
        if (isDriveConnected) {
            setDriveSyncStatus('syncing');
            try {
                await driveService.saveSchedule(dataToSave);
                setDriveSyncStatus('success');
                setTimeout(() => setDriveSyncStatus('idle'), 3000);
            } catch (e) {
                console.error("Failed to save to Drive", e);
                setDriveSyncStatus('error');
            }
        }
    }, 2000);

    useEffect(() => {
        try {
            localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedule));
            if (scheduleTimestamp) {
                localStorage.setItem(TIMESTAMP_STORAGE_KEY, scheduleTimestamp);
                debouncedSaveToDrive({ schedule, lastModified: scheduleTimestamp });
            }
        } catch (error) {
            console.error("Failed to save schedule to localStorage", error);
        }
    }, [schedule, scheduleTimestamp, debouncedSaveToDrive]);


    const weekId = useMemo(() => getWeekId(currentDate), [currentDate]);
    
    const weekDays = useMemo(() => {
        const days = getWeekDays(currentDate);
        if (!schedule[weekId]) {
            return days.map(date => ({ date, shift: '', status: DayStatus.Work }));
        }
        const scheduledDaysMap = new Map(schedule[weekId].map(d => [new Date(d.date).toDateString(), d]));
        return days.map(date => scheduledDaysMap.get(date.toDateString()) || { date, shift: '', status: DayStatus.Work });
    }, [currentDate, schedule, weekId]);

    // Effect for notification scheduling
    useEffect(() => {
        if (notificationPermission === 'granted') {
            const nextWeekDate = new Date(currentDate);
            nextWeekDate.setDate(nextWeekDate.getDate() + 7);
            const nextWeekId = getWeekId(nextWeekDate);
            const nextWeekSchedule = schedule[nextWeekId] || getWeekDays(nextWeekDate).map(date => ({ date, shift: '', status: DayStatus.Work }));
            
            notificationService.scheduleNotificationsForWeek(weekDays, nextWeekSchedule, nextWeekId, '/logo.svg');
        } else {
            notificationService.clearAllNotifications();
        }
    }, [weekDays, schedule, notificationPermission, currentDate]);

    const handleRequestNotifications = async () => {
        if (Notification.permission !== 'denied') {
            const permission = await notificationService.requestPermission();
            setNotificationPermission(permission);
        } else {
            alert('Las notificaciones están bloqueadas. Por favor, habilítalas en la configuración de tu navegador si deseas usarlas.');
        }
    };

    const handleUpdateDay = useCallback((updatedDay: Day) => {
        setSchedule(prevSchedule => {
            const currentWeekData = prevSchedule[weekId] || weekDays;
            const newWeekDays = [...currentWeekData];
            const dayIndex = newWeekDays.findIndex(d => new Date(d.date).toDateString() === updatedDay.date.toDateString());
            if (dayIndex !== -1) {
                newWeekDays[dayIndex] = updatedDay;
            }
            return { ...prevSchedule, [weekId]: newWeekDays };
        });
        setScheduleTimestamp(new Date().toISOString());
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
            const weekIdsInMonth = new Set<string>();
            daysInMonth.forEach(dayInMonth => {
                weekIdsInMonth.add(getWeekId(dayInMonth));
            });
    
            const allDatesInWeeks: Date[] = [];
            const processedDates = new Set<string>();
    
            Array.from(weekIdsInMonth).forEach(weekId => {
                const refDate = daysInMonth.find(d => getWeekId(d) === weekId)!;
                const weekDays = getWeekDays(refDate);
    
                weekDays.forEach(dateOfWeek => {
                    const dateString = dateOfWeek.toDateString();
                    if (!processedDates.has(dateString)) {
                        allDatesInWeeks.push(dateOfWeek);
                        processedDates.add(dateString);
                    }
                });
            });
            
            allDatesInWeeks.sort((a,b) => a.getTime() - b.getTime());
    
            const monthSchedule: Day[] = allDatesInWeeks.map(date => {
                const weekId = getWeekId(date);
                const dayData = schedule[weekId]?.find(d => new Date(d.date).toDateString() === date.toDateString());
                return dayData || { date, shift: '', status: DayStatus.Work };
            });
    
            const totalHoursMonth = monthSchedule.reduce((acc, day) => {
                if (day.status === DayStatus.Work) {
                    return acc + calculateHoursFromShift(day.shift);
                }
                return acc;
            }, 0);
    
            const overtimeThreshold = weekIdsInMonth.size * 40;
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

    const handleSignIn = () => driveService.signIn();
    const handleSignOut = () => {
        driveService.signOut();
        setIsDriveConnected(false);
        setDriveUser(null);
    };
    
    const handleRetrySync = () => {
        if (scheduleTimestamp) {
            debouncedSaveToDrive({ schedule, lastModified: scheduleTimestamp });
        }
    };

    const handleSaveKeys = (keys: apiKeyService.ApiKeys) => {
        apiKeyService.saveApiKeys(keys);
        setApiKeys(keys);
        setIsApiKeyModalOpen(false);
    };

    const handleConfigureApi = () => {
        setIsApiKeyModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
            {isApiKeyModalOpen && <ApiKeyModal onSave={handleSaveKeys} />}
            <Header
                currentWeekTitle={getWeekTitle(currentDate)}
                onPrevWeek={handlePrevWeek}
                onNextWeek={handleNextWeek}
                onCalendarClick={() => setIsCalendarOpen(true)}
                driveUser={driveUser}
                isDriveConnected={isDriveConnected}
                isDriveLoading={isDriveLoading}
                onSignIn={handleSignIn}
                onSignOut={handleSignOut}
                onForceSync={syncWithDrive}
                driveSyncStatus={driveSyncStatus}
                onRetrySync={handleRetrySync}
                driveInitError={driveInitError}
                isDriveAvailable={isDriveAvailable}
                onConfigureApi={handleConfigureApi}
                notificationPermission={notificationPermission}
                onRequestNotifications={handleRequestNotifications}
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
            <ConfirmModal
                isOpen={driveLoadConfirmation.isOpen}
                title="Cargar desde Google Drive"
                message="Se encontró un horario más reciente en Google Drive. ¿Quieres cargarlo y reemplazar tus datos locales? Esta acción no se puede deshacer."
                confirmText="Cargar Horario"
                onConfirm={driveLoadConfirmation.isOpen ? driveLoadConfirmation.onConfirm : () => {}}
                onCancel={() => setDriveLoadConfirmation({ isOpen: false })}
            />
        </div>
    );
};

export default App;
