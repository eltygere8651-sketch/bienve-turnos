
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Day, Schedule, DayStatus } from './types';
import { getWeekId, getWeekDays, getWeekTitle } from './utils/dateUtils';
import { calculateHoursFromShift } from './services/scheduleService';
import { downloadScheduleAsPdf } from './services/pdfService';
import Header from './components/Header';
import WeekView from './components/WeekView';
import Summary from './components/Summary';
import EditShiftModal from './components/EditShiftModal';
import { useShiftTemplates } from './hooks/useShiftTemplates';
import CalendarPickerModal from './components/CalendarPickerModal';
import ManageTemplatesModal from './components/ManageTemplatesModal';
import CustomPeriodModal from './components/CustomPeriodModal';
import Login from './components/Login';
import ConfirmModal from './components/ConfirmModal';
import ApiKeyModal from './components/ApiKeyModal';
import * as FirestoreService from './services/firestoreService';
import * as ApiKeyService from './services/apiKeyService';
import { ExclamationCircleIcon } from './components/icons';

const SCHEDULE_STORAGE_KEY = 'bienveAppSchedule_v3';
const AUTH_STORAGE_KEY = 'bienveAppIsAuthenticated';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    });

    const [currentDate, setCurrentDate] = useState(new Date());
    const [cloudConfigVersion, setCloudConfigVersion] = useState(0); 
    
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
        } catch (error) { console.error(error); }
        return {};
    });
    
    const [isCloudConnected, setIsCloudConnected] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
    const [cloudError, setCloudError] = useState<string | null>(null);
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);

    const [editingDay, setEditingDay] = useState<Day | null>(null);
    const { templates, addTemplate, deleteTemplate } = useShiftTemplates();
    const [isManagingTemplates, setIsManagingTemplates] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isCustomPeriodModalOpen, setIsCustomPeriodModalOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const syncTimeoutRef = useRef<number | null>(null);
    const isInitialLoadRef = useRef(true);
    const unsubscribeRef = useRef<(() => void) | null>(null);
    const scheduleRef = useRef<Schedule>(schedule);

    useEffect(() => {
        scheduleRef.current = schedule;
    }, [schedule]);

    const handleCloudError = useCallback((error: any) => {
        const errorMsg = (error.message || "").toLowerCase();
        const errorCode = (error.code || "").toLowerCase();
        
        if (errorMsg.includes('network') || errorMsg.includes('offline')) {
            setSyncStatus('error');
            setCloudError("Error de red: móvil sin internet.");
            return;
        }

        setSyncStatus('error');
        if (errorCode.includes('permission')) {
            setCloudError("Error: Revisa las Reglas en tu Firebase.");
        } else {
            setCloudError("Error de sincronización.");
        }
    }, []);

    const initializeCloud = useCallback(async () => {
        if (!isAuthenticated) return false;
        
        const keys = ApiKeyService.getApiKeys();
        if (!keys) {
            setIsCloudConnected(false);
            return false;
        }

        if (unsubscribeRef.current) unsubscribeRef.current();

        try {
            setSyncStatus('syncing');
            const config = JSON.parse(keys.apiKey);
            const success = await FirestoreService.initFirestore(config);
            setIsCloudConnected(success);
            
            if (success) {
                unsubscribeRef.current = FirestoreService.subscribeToSchedule(
                    (cloudSchedule) => {
                        const localString = JSON.stringify(scheduleRef.current);
                        const cloudString = JSON.stringify(cloudSchedule);

                        if (localString !== cloudString) {
                            console.log("Sincronización entrante exitosa.");
                            setSchedule(cloudSchedule);
                            localStorage.setItem(SCHEDULE_STORAGE_KEY, cloudString);
                        }
                        
                        setSyncStatus('success');
                        setCloudError(null);
                        isInitialLoadRef.current = false;
                    },
                    handleCloudError
                );
                return true;
            }
        } catch (e: any) {
            handleCloudError(e);
            return false;
        }
        return false;
    }, [isAuthenticated, cloudConfigVersion, handleCloudError]);

    useEffect(() => {
        initializeCloud();
        return () => { if (unsubscribeRef.current) unsubscribeRef.current(); };
    }, [initializeCloud]);

    useEffect(() => {
        if (!isCloudConnected || isInitialLoadRef.current || syncStatus === 'error') return;

        if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
        
        syncTimeoutRef.current = window.setTimeout(async () => {
            try {
                setSyncStatus('syncing');
                await FirestoreService.saveScheduleToCloud(scheduleRef.current);
                setSyncStatus('success');
            } catch (e: any) {
                handleCloudError(e);
            }
        }, 3000);
    }, [schedule, isCloudConnected, handleCloudError]);

    const weekId = useMemo(() => getWeekId(currentDate), [currentDate]);
    
    const weekDays = useMemo(() => {
        const days = getWeekDays(currentDate);
        if (!schedule[weekId]) return days.map(date => ({ date, shift: '', status: DayStatus.Work }));
        const scheduledDaysMap = new Map(schedule[weekId].map(d => [new Date(d.date).toISOString().slice(0, 10), d]));
        return days.map(date => scheduledDaysMap.get(date.toISOString().slice(0, 10)) || { date, shift: '', status: DayStatus.Work });
    }, [currentDate, schedule, weekId]);

    const handleUpdateDay = useCallback((updatedDay: Day) => {
        isInitialLoadRef.current = false;
        setSchedule(prevSchedule => {
            const currentWeekData = prevSchedule[weekId] || weekDays;
            const newWeekDays = [...currentWeekData];
            const dayKey = updatedDay.date.toISOString().slice(0, 10);
            const dayIndex = newWeekDays.findIndex(d => new Date(d.date).toISOString().slice(0, 10) === dayKey);
            if (dayIndex !== -1) newWeekDays[dayIndex] = updatedDay;
            else newWeekDays.push(updatedDay);
            const newSchedule = { ...prevSchedule, [weekId]: newWeekDays };
            localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(newSchedule));
            return newSchedule;
        });
        setEditingDay(null);
    }, [weekId, weekDays]);
    
    const { totalHours, overtimeHours } = useMemo(() => {
        const workHours = weekDays.reduce((acc, day) => day.status === DayStatus.Work ? acc + calculateHoursFromShift(day.shift) : acc, 0);
        const daysOff = weekDays.filter(d => d.status !== DayStatus.Work).length;
        const weeklyTarget = Math.max(0, 40 - (Math.max(0, daysOff - 2) * 8));
        return { totalHours: workHours, overtimeHours: workHours - weeklyTarget };
    }, [weekDays]);

    if (!isAuthenticated) return <Login onLogin={() => { localStorage.setItem(AUTH_STORAGE_KEY, 'true'); setIsAuthenticated(true); }} />;
    
    if (showApiKeyModal) return (
        <ApiKeyModal 
            onSave={(keys) => { ApiKeyService.saveApiKeys(keys); setShowApiKeyModal(false); setCloudConfigVersion(v => v + 1); isInitialLoadRef.current = true; }}
            onCancel={() => setShowApiKeyModal(false)}
        />
    );

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
            {cloudError && syncStatus === 'error' && (
                <div onClick={initializeCloud} className="bg-red-700 p-2 text-white text-center text-[10px] font-black flex items-center justify-center gap-2 sticky top-0 z-50 shadow-2xl animate-fade-in cursor-pointer">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    <span className="uppercase">{cloudError} - PULSA PARA REINTENTAR</span>
                </div>
            )}
            <Header
                currentWeekTitle={getWeekTitle(currentDate)}
                onPrevWeek={() => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
                onNextWeek={() => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
                onCalendarClick={() => setIsCalendarOpen(true)}
                onLogout={() => setIsLogoutModalOpen(true)}
                isCloudConnected={isCloudConnected}
                syncStatus={syncStatus}
                cloudError={cloudError}
                onConfigureApi={() => setShowApiKeyModal(true)}
                onForceSync={() => {
                    isInitialLoadRef.current = true;
                    initializeCloud();
                }}
            />
            <main className="flex-grow py-4">
                <WeekView days={weekDays} onEditDay={setEditingDay} />
            </main>
            <Summary 
                totalHours={totalHours} 
                overtimeHours={overtimeHours}
                onDownload={async () => { setIsDownloading(true); await downloadScheduleAsPdf({ weekDays, currentDate, totalHours, overtimeHours }); setIsDownloading(false); }}
                isDownloading={isDownloading}
                onDownloadMonth={() => {}}
                isDownloadingMonth={false}
                onOpenCustomPeriodModal={() => setIsCustomPeriodModalOpen(true)}
                isDownloadingCustomPeriod={false}
            />
            {editingDay && <EditShiftModal day={editingDay} onClose={() => setEditingDay(null)} onSave={handleUpdateDay} templates={templates} onManageTemplates={() => setIsManagingTemplates(true)} />}
            {isManagingTemplates && <ManageTemplatesModal templates={templates} onAddTemplate={addTemplate} onDeleteTemplate={deleteTemplate} onClose={() => setIsManagingTemplates(false)} />}
            {isCalendarOpen && <CalendarPickerModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} currentDate={currentDate} onDateSelect={(d) => { setCurrentDate(d); setIsCalendarOpen(false); }} />}
            {isLogoutModalOpen && <ConfirmModal isOpen={isLogoutModalOpen} title="Cerrar Sesión" message="¿Estás seguro?" onConfirm={() => { localStorage.removeItem(AUTH_STORAGE_KEY); setIsAuthenticated(false); }} onCancel={() => setIsLogoutModalOpen(false)} />}
        </div>
    );
};

export default App;
