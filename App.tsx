
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
import Login from './components/Login';
import ConfirmModal from './components/ConfirmModal';
import ApiKeyModal from './components/ApiKeyModal';
import * as FirestoreService from './services/firestoreService';
import * as ApiKeyService from './services/apiKeyService';

const SCHEDULE_STORAGE_KEY = 'bienveAppSchedule_v3';
const AUTH_STORAGE_KEY = 'bienveAppIsAuthenticated';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    });

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
    const [isDownloadingMonth, setIsDownloadingMonth] = useState(false);
    const [isDownloadingCustom, setIsDownloadingCustom] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isCustomPeriodModalOpen, setIsCustomPeriodModalOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const unsubscribeRef = useRef<(() => void) | null>(null);

    const handleCloudError = useCallback((error: any) => {
        setSyncStatus('error');
        setCloudError("Error de nube.");
    }, []);

    const initializeCloud = useCallback(async () => {
        if (!isAuthenticated) return false;
        const keys = ApiKeyService.getApiKeys();
        if (!keys) return false;

        try {
            setSyncStatus('syncing');
            const config = typeof keys.apiKey === 'string' ? JSON.parse(keys.apiKey) : keys.apiKey;
            const success = await FirestoreService.initFirestore(config);
            setIsCloudConnected(success);
            if (success) {
                if (unsubscribeRef.current) unsubscribeRef.current();
                unsubscribeRef.current = FirestoreService.subscribeToSchedule((cloudSchedule) => {
                    setSchedule(cloudSchedule);
                    setSyncStatus('success');
                }, handleCloudError);
            }
        } catch (e) { handleCloudError(e); }
    }, [isAuthenticated, handleCloudError]);

    useEffect(() => { initializeCloud(); }, [initializeCloud]);

    const weekId = useMemo(() => getWeekId(currentDate), [currentDate]);
    
    const weekDays = useMemo(() => {
        const days = getWeekDays(currentDate);
        if (!schedule[weekId]) return days.map(date => ({ date, shift: '', status: DayStatus.Work }));
        const scheduledDaysMap = new Map(schedule[weekId].map(d => [new Date(d.date).toISOString().slice(0, 10), d]));
        return days.map(date => scheduledDaysMap.get(date.toISOString().slice(0, 10)) || { date, shift: '', status: DayStatus.Work });
    }, [currentDate, schedule, weekId]);

    const handleUpdateDay = useCallback((updatedDay: Day) => {
        setSchedule(prev => {
            const currentWeekData = prev[weekId] || weekDays;
            const newWeekDays = [...currentWeekData];
            const dayKey = updatedDay.date.toISOString().slice(0, 10);
            const idx = newWeekDays.findIndex(d => new Date(d.date).toISOString().slice(0, 10) === dayKey);
            if (idx !== -1) newWeekDays[idx] = updatedDay; else newWeekDays.push(updatedDay);
            const newSchedule = { ...prev, [weekId]: newWeekDays };
            localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(newSchedule));
            
            if (isCloudConnected) {
                FirestoreService.saveScheduleToCloud(newSchedule).catch(handleCloudError);
            }
            
            return newSchedule;
        });
        setEditingDay(null);
    }, [weekId, weekDays, isCloudConnected, handleCloudError]);

    const handleManualUpload = async () => {
        if (!isCloudConnected) return;
        setSyncStatus('syncing');
        try {
            await FirestoreService.saveScheduleToCloud(schedule);
            setSyncStatus('success');
        } catch (e) { handleCloudError(e); }
    };

    // Lógica Central de Horas (Solo Físicas)
    const { totalHours, overtimeHours } = useMemo(() => {
        // Sumamos únicamente las horas de los turnos de trabajo
        const workHours = weekDays.reduce((acc, day) => {
            return day.status === DayStatus.Work ? acc + calculateHoursFromShift(day.shift) : acc;
        }, 0);
        
        // Objetivo de 40h físicas. Si trabaja menos, el balance es negativo.
        return { totalHours: workHours, overtimeHours: workHours - 40 };
    }, [weekDays]);

    const handleDownloadMonth = async () => {
        setIsDownloadingMonth(true);
        const monthDates = getDaysInMonth(currentDate);
        const monthDays: Day[] = monthDates.map(date => {
            const wId = getWeekId(date);
            const dateStr = date.toISOString().slice(0, 10);
            const found = schedule[wId]?.find(d => new Date(d.date).toISOString().slice(0, 10) === dateStr);
            return found || { date, shift: '', status: DayStatus.Work };
        });

        const totalWorked = monthDays.reduce((acc, d) => d.status === DayStatus.Work ? acc + calculateHoursFromShift(d.shift) : acc, 0);
        // Objetivo proporcional a las semanas/días del mes
        const target = (monthDays.length / 7) * 40;
        const balance = totalWorked - target;

        await downloadMonthScheduleAsPdf({ 
            monthDays, 
            currentDate, 
            totalHours: totalWorked, 
            overtimeHours: balance 
        });
        setIsDownloadingMonth(false);
    };

    const handleDownloadCustom = async (start: Date, end: Date) => {
        setIsDownloadingCustom(true);
        const periodDays: Day[] = [];
        let curr = new Date(start);
        while (curr <= end) {
            const wId = getWeekId(curr);
            const dateStr = curr.toISOString().slice(0, 10);
            const found = schedule[wId]?.find(d => new Date(d.date).toISOString().slice(0, 10) === dateStr);
            periodDays.push(found || { date: new Date(curr), shift: '', status: DayStatus.Work });
            curr.setUTCDate(curr.getUTCDate() + 1);
        }
        
        const totalWorked = periodDays.reduce((acc, d) => d.status === DayStatus.Work ? acc + calculateHoursFromShift(d.shift) : acc, 0);
        const target = (periodDays.length / 7) * 40;
        const balance = totalWorked - target;

        await downloadCustomPeriodPdf({ 
            periodDays, 
            startDate: start, 
            endDate: end, 
            totalHours: totalWorked, 
            overtimeHours: balance 
        });
        setIsDownloadingCustom(false);
        setIsCustomPeriodModalOpen(false);
    };

    if (!isAuthenticated) return <Login onLogin={() => { localStorage.setItem(AUTH_STORAGE_KEY, 'true'); setIsAuthenticated(true); }} />;

    return (
        <div className="min-h-screen bg-[#0f172a] text-gray-100 flex flex-col font-sans selection:bg-red-500/30">
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
                onForceSync={() => initializeCloud()}
                onManualUpload={handleManualUpload}
            />
            <main className="flex-grow py-6 overflow-x-hidden">
                <WeekView days={weekDays} onEditDay={setEditingDay} />
            </main>
            <Summary 
                totalHours={totalHours} 
                overtimeHours={overtimeHours}
                onDownload={() => downloadScheduleAsPdf({ weekDays, currentDate, totalHours, overtimeHours })}
                onDownloadMonth={handleDownloadMonth}
                onOpenCustomPeriodModal={() => setIsCustomPeriodModalOpen(true)}
                isDownloading={isDownloading || isDownloadingMonth || isDownloadingCustom}
            />
            {editingDay && <EditShiftModal day={editingDay} onClose={() => setEditingDay(null)} onSave={handleUpdateDay} templates={templates} onManageTemplates={() => setIsManagingTemplates(true)} />}
            {isManagingTemplates && <ManageTemplatesModal templates={templates} onAddTemplate={addTemplate} onDeleteTemplate={deleteTemplate} onClose={() => setIsManagingTemplates(false)} />}
            {isCalendarOpen && <CalendarPickerModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} currentDate={currentDate} onDateSelect={(d) => { setCurrentDate(d); setIsCalendarOpen(false); }} />}
            {isCustomPeriodModalOpen && <CustomPeriodModal isOpen={isCustomPeriodModalOpen} onClose={() => setIsCustomPeriodModalOpen(false)} onConfirm={handleDownloadCustom} />}
            {isLogoutModalOpen && <ConfirmModal isOpen={isLogoutModalOpen} title="¿Cerrar Sesión?" message="Se mantendrán tus datos pero deberás volver a entrar." onConfirm={() => { localStorage.removeItem(AUTH_STORAGE_KEY); setIsAuthenticated(false); }} onCancel={() => setIsLogoutModalOpen(false)} />}
            {showApiKeyModal && <ApiKeyModal onSave={(keys) => { ApiKeyService.saveApiKeys(keys); setShowApiKeyModal(false); initializeCloud(); }} onCancel={() => setShowApiKeyModal(false)} />}
        </div>
    );
};

export default App;
