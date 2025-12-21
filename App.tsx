
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
import { ExclamationCircleIcon, ArrowPathIcon } from './components/icons';

const SCHEDULE_STORAGE_KEY = 'bienveAppSchedule_v2';
const AUTH_STORAGE_KEY = 'bienveAppIsAuthenticated';

const FIREBASE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /schedules/{document} {
      allow read, write: if request.auth != null;
    }
  }
}`;

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
    const [isPermissionError, setIsPermissionError] = useState(false);
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [rulesCopied, setRulesCopied] = useState(false);

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

    const handleCloudError = useCallback((error: any) => {
        const errorMsg = (error.message || "").toLowerCase();
        const errorCode = (error.code || "").toLowerCase();
        
        console.error("Cloud Error Details:", errorCode, errorMsg);

        if (errorMsg.includes('network') || errorMsg.includes('offline') || errorMsg.includes('failed to fetch')) {
            setSyncStatus('error');
            setCloudError("Sin conexión a internet. Reintentando...");
            return;
        }

        setSyncStatus('error');
        if (errorCode.includes('permission') || errorMsg.includes('permission') || errorMsg.includes('insufficient')) {
            setCloudError("REGLAS BLOQUEADAS: Acceso denegado en Firestore.");
            setIsPermissionError(true);
        } else if (errorCode.includes('not-found') || errorMsg.includes('not found')) {
            setCloudError("Base de datos no encontrada.");
            setIsPermissionError(false);
        } else {
            setCloudError("Fallo en la nube. Revisa tu configuración.");
            setIsPermissionError(false);
        }
    }, []);

    const copyRulesDirectly = () => {
        navigator.clipboard.writeText(FIREBASE_RULES);
        setRulesCopied(true);
        setTimeout(() => setRulesCopied(false), 3000);
    };

    const initializeCloud = useCallback(async () => {
        if (!isAuthenticated) return false;
        
        const keys = ApiKeyService.getApiKeys();
        if (!keys) {
            setIsCloudConnected(false);
            setSyncStatus('idle');
            return false;
        }

        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }

        try {
            setSyncStatus('syncing');
            const config = JSON.parse(keys.apiKey);
            
            const success = await FirestoreService.initFirestore(config);
            setIsCloudConnected(success);
            
            if (success) {
                const unsub = FirestoreService.subscribeToSchedule(
                    (newSchedule) => {
                        if (isInitialLoadRef.current) {
                            if (Object.keys(newSchedule).length > 0) {
                                setSchedule(newSchedule);
                            }
                            isInitialLoadRef.current = false;
                        } else {
                            setSchedule(prev => {
                                if (JSON.stringify(prev) !== JSON.stringify(newSchedule)) {
                                    return newSchedule;
                                }
                                return prev;
                            });
                        }
                        setSyncStatus('success');
                        setCloudError(null);
                        setIsPermissionError(false);
                    },
                    handleCloudError
                );
                unsubscribeRef.current = unsub;
                return true;
            } else {
                setSyncStatus('error');
                return false;
            }
        } catch (e: any) {
            handleCloudError(e);
            setIsCloudConnected(false);
            return false;
        }
    }, [isAuthenticated, cloudConfigVersion, handleCloudError]);

    useEffect(() => {
        initializeCloud();
        return () => { if (unsubscribeRef.current) unsubscribeRef.current(); };
    }, [initializeCloud]);

    // Persistencia y Sincronización
    useEffect(() => {
        localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedule));
        
        // Solo sincronizamos si estamos conectados y NO es la carga inicial
        if (isCloudConnected && !isInitialLoadRef.current && syncStatus !== 'error') {
            if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
            
            syncTimeoutRef.current = window.setTimeout(async () => {
                try {
                    await FirestoreService.saveScheduleToCloud(schedule);
                    setSyncStatus('success');
                    setCloudError(null);
                } catch (e: any) {
                    handleCloudError(e);
                }
            }, 2500); 
        }
    }, [schedule, isCloudConnected, syncStatus, handleCloudError]);

    const weekId = useMemo(() => getWeekId(currentDate), [currentDate]);
    
    const weekDays = useMemo(() => {
        const days = getWeekDays(currentDate);
        if (!schedule[weekId]) {
            return days.map(date => ({ date, shift: '', status: DayStatus.Work }));
        }
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
            
            return { ...prevSchedule, [weekId]: newWeekDays };
        });
        setEditingDay(null);
    }, [weekId, weekDays]);
    
    const { totalHours, overtimeHours } = useMemo(() => {
        const workHours = weekDays.reduce((acc, day) => day.status === DayStatus.Work ? acc + calculateHoursFromShift(day.shift) : acc, 0);
        const daysOff = weekDays.filter(d => d.status !== DayStatus.Work).length;
        const weeklyTarget = Math.max(0, 40 - (Math.max(0, daysOff - 2) * 8));
        return { totalHours: workHours, overtimeHours: workHours - weeklyTarget };
    }, [weekDays]);

    const handleLogin = () => {
        localStorage.setItem(AUTH_STORAGE_KEY, 'true');
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setIsAuthenticated(false);
        setIsLogoutModalOpen(false);
    };

    if (!isAuthenticated) return <Login onLogin={handleLogin} />;
    
    if (showApiKeyModal) return (
        <ApiKeyModal 
            onSave={(keys) => { 
                ApiKeyService.saveApiKeys(keys); 
                setShowApiKeyModal(false); 
                isInitialLoadRef.current = true; 
                setCloudConfigVersion(v => v + 1); 
            }}
            onCancel={() => setShowApiKeyModal(false)}
        />
    );

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
            {cloudError && syncStatus === 'error' && (
                <div className="bg-red-700 p-2 text-white text-center text-[10px] font-black flex items-center justify-center gap-2 sticky top-0 z-50 shadow-2xl border-b border-red-500 animate-fade-in">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    <span className="uppercase">{cloudError}</span>
                    {isPermissionError && (
                        <button onClick={copyRulesDirectly} className={`${rulesCopied ? 'bg-green-500' : 'bg-white text-red-700'} px-2 py-1 rounded ml-2 text-[8px]`}>
                            {rulesCopied ? 'COPIADO' : 'COPIAR REGLAS'}
                        </button>
                    )}
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
                onForceSync={async () => {
                    setSyncStatus('syncing');
                    try {
                        await FirestoreService.saveScheduleToCloud(schedule);
                        setSyncStatus('success');
                        setCloudError(null);
                        alert("✅ Datos subidos a la nube.");
                    } catch (e) { handleCloudError(e); }
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
            {isLogoutModalOpen && <ConfirmModal isOpen={isLogoutModalOpen} title="Cerrar Sesión" message="¿Estás seguro?" onConfirm={handleLogout} onCancel={() => setIsLogoutModalOpen(false)} />}
        </div>
    );
};

export default App;
