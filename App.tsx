
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Day, Schedule, DayStatus, FirebaseUser, FirebaseConfig } from './types';
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
import FirebaseConfigModal from './components/FirebaseConfigModal';

import { saveFirebaseConfig, getFirebaseConfig, isFirebaseConfigured } from './services/apiKeyService';
import { initFirebase, loginWithGoogle, logoutUser, subscribeToAuthChanges, subscribeToSchedule, saveScheduleToFirestore, testFirestoreConnection } from './services/firebaseService';
import { useDebouncedCallback } from './hooks/useDebouncedCallback';

const SCHEDULE_STORAGE_KEY = 'bienveAppSchedule';
const AUTH_STORAGE_KEY = 'bienveAppIsAuthenticated';

const App: React.FC = () => {
    // --- Authentication State (App Local) ---
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    });

    // --- Core Data State ---
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

    // --- Firebase Integration State ---
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [isFirebaseConfigModalOpen, setIsFirebaseConfigModalOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const isRemoteUpdate = useRef(false);

    // --- UI State ---
    const [editingDay, setEditingDay] = useState<Day | null>(null);
    const { templates, addTemplate, deleteTemplate } = useShiftTemplates();
    const [isManagingTemplates, setIsManagingTemplates] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloadingMonth, setIsDownloadingMonth] = useState(false);
    const [isDownloadingCustomPeriod, setIsDownloadingCustomPeriod] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isCustomPeriodModalOpen, setIsCustomPeriodModalOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem(AUTH_STORAGE_KEY, String(isAuthenticated));
    }, [isAuthenticated]);
    
    useEffect(() => {
        try {
            localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedule));
        } catch (error) {
            console.error("Failed to save schedule to localStorage", error);
        }
    }, [schedule]);

    // --- Firebase Logic ---
    useEffect(() => {
        if (isAuthenticated && isFirebaseConfigured()) {
            const config = getFirebaseConfig();
            if (config) {
                try {
                    initFirebase(config);
                    const unsubscribeAuth = subscribeToAuthChanges((user) => {
                        if (user) {
                            setFirebaseUser({
                                uid: user.uid,
                                displayName: user.displayName,
                                email: user.email,
                                photoURL: user.photoURL
                            });
                        } else {
                            setFirebaseUser(null);
                        }
                    });
                    return () => unsubscribeAuth();
                } catch (e) {
                    console.error("Firebase init failed", e);
                }
            }
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (firebaseUser?.uid) {
            setIsSyncing(true);
            const unsubscribeSchedule = subscribeToSchedule(firebaseUser.uid, (remoteSchedule) => {
                isRemoteUpdate.current = true;
                setSchedule(remoteSchedule);
                setIsSyncing(false);
                setTimeout(() => { isRemoteUpdate.current = false; }, 100);
            });
            return () => unsubscribeSchedule();
        }
    }, [firebaseUser?.uid]);

    const debouncedSaveToFirestore = useDebouncedCallback(async (currentSchedule: Schedule, uid: string) => {
        if (!uid) return;
        setIsSyncing(true);
        try {
            await saveScheduleToFirestore(uid, currentSchedule);
        } catch (e) {
            console.error("Save to firestore failed", e);
        } finally {
            setIsSyncing(false);
        }
    }, 1000);

    useEffect(() => {
        if (firebaseUser?.uid && !isRemoteUpdate.current) {
            debouncedSaveToFirestore(schedule, firebaseUser.uid);
        }
    }, [schedule, firebaseUser, debouncedSaveToFirestore]);

    // --- Handlers ---

    const handleFirebaseLogin = async () => {
        if (!isFirebaseConfigured()) {
            setIsFirebaseConfigModalOpen(true);
            return;
        }
        try {
            const config = getFirebaseConfig();
            if (config) initFirebase(config);
            await loginWithGoogle();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleFirebaseLogout = async () => {
        await logoutUser();
        setFirebaseUser(null);
    };

    const handleTestConnection = async () => {
        if (!firebaseUser?.uid) return;
        setIsSyncing(true);
        try {
            await testFirestoreConnection(firebaseUser.uid);
            alert("✅ Conexión exitosa: Tus datos se guardan en la nube correctamente.");
        } catch (error: any) {
            alert(`❌ Error de conexión: ${error.message || 'No se pudo contactar con Firestore.'}`);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleConfigSave = (config: FirebaseConfig) => {
        saveFirebaseConfig(config);
        setIsFirebaseConfigModalOpen(false);
        try {
            initFirebase(config);
            handleFirebaseLogin(); 
        } catch (e) {
            alert("Error inicializando Firebase con esa configuración.");
        }
    };

    // --- Generate Temp Data ---
    const handleGenerateTempData = () => {
        const year = new Date().getFullYear();
        const start = new Date(year, 11, 1); // 1 de Diciembre
        const end = new Date(year, 11, 28); 
        
        setSchedule(prevSchedule => {
            const newSchedule = { ...prevSchedule };
            let loopDate = new Date(start);

            while (loopDate <= end) {
                const wId = getWeekId(loopDate);
                
                if (!newSchedule[wId]) {
                    const weekDaysForId = getWeekDays(loopDate);
                    newSchedule[wId] = weekDaysForId.map(d => ({
                        date: d,
                        shift: '',
                        status: DayStatus.Work
                    }));
                }

                const dayStr = loopDate.toDateString();
                const dayIndex = newSchedule[wId].findIndex(d => d.date.toDateString() === dayStr);

                if (dayIndex !== -1) {
                    newSchedule[wId][dayIndex] = {
                        ...newSchedule[wId][dayIndex],
                        shift: '10-14 17-21',
                        status: DayStatus.Work
                    };
                }

                loopDate.setDate(loopDate.getDate() + 1);
            }
            return newSchedule;
        });

        setCurrentDate(start);
        alert("Generados turnos del 1 al 28 de Diciembre.");
    };

    // --- Date & Schedule Logic ---

    const weekId = useMemo(() => getWeekId(currentDate), [currentDate]);
    
    // Restaurado: Uso simple de toDateString() como funcionaba antes
    const weekDays = useMemo(() => {
        const days = getWeekDays(currentDate);
        if (!schedule[weekId]) {
            return days.map(date => ({ date, shift: '', status: DayStatus.Work }));
        }
        
        // Mapeo simple basado en toDateString para evitar líos de UTC
        return days.map(date => {
            const found = schedule[weekId].find(d => d.date.toDateString() === date.toDateString());
            return found ? { ...found, date: date } : { date, shift: '', status: DayStatus.Work };
        });
    }, [currentDate, schedule, weekId]);

    const handleUpdateDay = useCallback((updatedDay: Day) => {
        setSchedule(prevSchedule => {
            const newWeekDays = weekDays.map(d => {
                if (d.date.toDateString() === updatedDay.date.toDateString()) {
                    return updatedDay;
                }
                return d;
            });
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

    // --- Report Downloads ---
    
    // Función auxiliar para calcular horas en un periodo arbitrario usando lógica simple
    const calculatePeriodData = (days: Date[]) => {
        let totalH = 0;
        let totalOvertime = 0;
        
        // Agrupar días por semana para calcular horas extras semanales y permitir compensación
        const daysByWeek: { [key: string]: Day[] } = {};

        days.forEach(date => {
            const wId = getWeekId(date);
            if (!daysByWeek[wId]) daysByWeek[wId] = [];
            
            // Buscar en el horario existente usando toDateString (Restaurado)
            const weekData = schedule[wId];
            const foundDay = weekData?.find(d => d.date.toDateString() === date.toDateString());
            
            // Usar el día encontrado o crear uno vacío por defecto
            const dayToUse = foundDay || { date, shift: '', status: DayStatus.Work };
            daysByWeek[wId].push(dayToUse);
        });

        // Iterar por cada semana encontrada en el rango
        Object.keys(daysByWeek).forEach(wId => {
            const weekDaysData = daysByWeek[wId];
            
            // Solo si la semana tiene datos relevantes (evitar semanas vacías si no se cargaron)
            // Pero debemos considerar todos los días pasados para sumar sus horas
            
            // 1. Calcular horas trabajadas en ESTOS días de la semana
            const weekHours = weekDaysData.reduce((acc, day) => {
                if (day.status === DayStatus.Work) {
                    return acc + calculateHoursFromShift(day.shift);
                }
                return acc;
            }, 0);
            
            // Para el cálculo de horas extras, necesitamos el contexto de la semana COMPLETA
            // Si el periodo corta la semana, el cálculo de extras puede ser parcial, 
            // pero para ser fieles a la "semana", deberíamos ver si tenemos la semana completa en memoria.
            
            // Estrategia Robust: Recuperar la semana completa del state si existe
            const fullWeekData = schedule[wId];
            
            if (fullWeekData) {
                const fullWeekWorkHours = fullWeekData.reduce((acc, day) => 
                     day.status === DayStatus.Work ? acc + calculateHoursFromShift(day.shift) : acc, 0);
                
                const daysOff = fullWeekData.filter(d => d.status === DayStatus.Holiday || d.status === DayStatus.Vacation).length;
                const extraDaysOff = Math.max(0, daysOff - 2);
                const weeklyTarget = Math.max(0, 40 - (extraDaysOff * 8));
                
                // Aquí está la clave: Overtime de la semana (positivo o negativo)
                // Al sumar esto al totalOvertime, permitimos la compensación.
                // PERO, solo sumamos UNA VEZ por semana. 
                // El problema de iterar días es que sumaríamos esto múltiples veces.
                // Por eso iteramos por `daysByWeek` keys.
                
                totalOvertime += (fullWeekWorkHours - weeklyTarget);
            }
            
            // Total Hours es simplemente la suma de las horas de los días seleccionados
            totalH += weekHours;
        });

        // Aplanar todos los días para el PDF
        const allDays = Object.values(daysByWeek).flat().sort((a,b) => a.date.getTime() - b.date.getTime());
        
        return {
            periodDays: allDays.filter(d => d.shift || d.status !== DayStatus.Work), // Filtrar vacíos para el PDF
            totalHours: totalH,
            overtimeHours: totalOvertime
        };
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        try { await downloadScheduleAsPdf({ weekDays, currentDate, totalHours, overtimeHours }); } 
        catch (e) { console.error(e); alert("Error al generar PDF."); } 
        finally { setIsDownloading(false); }
    };
    
    const handleDownloadMonth = async () => {
        setIsDownloadingMonth(true);
        try {
            const daysInMonth = getDaysInMonth(currentDate);
            const { periodDays, totalHours, overtimeHours } = calculatePeriodData(daysInMonth);
            
            await downloadMonthScheduleAsPdf({ 
                monthDays: periodDays, 
                currentDate, 
                totalHours, 
                overtimeHours 
            });

        } catch (e) { console.error(e); alert("Error PDF Mensual"); } 
        finally { setIsDownloadingMonth(false); }
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
            
            const { periodDays, totalHours, overtimeHours } = calculatePeriodData(periodDates);

            await downloadCustomPeriodPdf({ 
                periodDays, 
                startDate, 
                endDate, 
                totalHours, 
                overtimeHours 
            });
        } catch (e) { console.error(e); alert("Error PDF Personalizado"); }
        finally { setIsDownloadingCustomPeriod(false); }
    };

    const handleLogin = () => { setIsAuthenticated(true); };
    const handleLogout = () => { 
        setIsAuthenticated(false); 
        setIsLogoutModalOpen(false); 
        logoutUser(); 
    };

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
            <Header
                currentWeekTitle={getWeekTitle(currentDate)}
                onPrevWeek={handlePrevWeek}
                onNextWeek={handleNextWeek}
                onCalendarClick={() => setIsCalendarOpen(true)}
                onLogout={() => setIsLogoutModalOpen(true)}
                user={firebaseUser}
                isSyncing={isSyncing}
                onLogin={handleFirebaseLogin}
                onSignOut={handleFirebaseLogout}
                onConfigure={() => setIsFirebaseConfigModalOpen(true)}
                onTestConnection={handleTestConnection}
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
                onGenerateTempData={handleGenerateTempData}
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
            {isLogoutModalOpen && (
                <ConfirmModal
                    isOpen={isLogoutModalOpen}
                    title="Cerrar Sesión"
                    message="¿Estás seguro de que quieres cerrar la sesión de la aplicación?"
                    onConfirm={handleLogout}
                    onCancel={() => setIsLogoutModalOpen(false)}
                    confirmText="Cerrar Sesión"
                />
            )}
            {isFirebaseConfigModalOpen && (
                <FirebaseConfigModal onSave={handleConfigSave} />
            )}
        </div>
    );
};

export default App;
