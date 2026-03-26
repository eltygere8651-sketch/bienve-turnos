
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Day, Schedule, DayStatus, FirebaseUser, FirebaseConfig } from './types';
import { getWeekId, getWeekDays, getWeekTitle } from './utils/dateUtils';
import { calculateHoursFromShift } from './services/scheduleService';
import { 
    downloadCustomPeriodPdf 
} from './services/pdfService';
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
import { initFirebase, loginWithGoogle, logoutUser, subscribeToAuthChanges, subscribeToSchedule, saveScheduleToFirestore, testFirestoreConnection, fetchScheduleFromFirestore } from './services/firebaseService';
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

    // --- UI State ---
    const [editingDay, setEditingDay] = useState<Day | null>(null);
    const { templates, addTemplate, deleteTemplate } = useShiftTemplates();
    const [isManagingTemplates, setIsManagingTemplates] = useState(false);
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

    const debouncedSaveToFirestore = useDebouncedCallback(async (currentSchedule: Schedule, uid: string) => {
        if (!uid) return;
        setIsSyncing(true);
        try {
            await saveScheduleToFirestore(uid, currentSchedule);
        } catch (e: any) {
            console.error("Save to firestore failed", e);
            alert(`⚠️ Error al sincronizar con la nube: ${e.message || 'Revisa tus permisos de Firebase.'}\nTus datos solo se han guardado localmente en este dispositivo.`);
        } finally {
            setIsSyncing(false);
        }
    }, 1000);

    useEffect(() => {
        if (firebaseUser?.uid) {
            setIsSyncing(true);
            const unsubscribeSchedule = subscribeToSchedule(firebaseUser.uid, (remoteSchedule) => {
                setSchedule(remoteSchedule);
                setIsSyncing(false);
            });
            return () => unsubscribeSchedule();
        }
    }, [firebaseUser?.uid]);

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

    const handleForceDownload = async () => {
        if (!firebaseUser?.uid) return;
        if (!confirm("¿Estás seguro de que quieres forzar la descarga? Esto sobrescribirá tus turnos locales con los de la nube.")) return;
        
        setIsSyncing(true);
        try {
            const remoteSchedule = await fetchScheduleFromFirestore(firebaseUser.uid);
            if (remoteSchedule) {
                setSchedule(remoteSchedule);
                alert("✅ Turnos descargados correctamente desde la nube.");
            } else {
                alert("ℹ️ No se encontraron turnos en la nube para tu usuario.");
            }
        } catch (error: any) {
            alert(`❌ Error al descargar: ${error.message || 'No se pudo contactar con Firestore.'}`);
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

    // --- Date & Schedule Logic ---

    const weekId = useMemo(() => getWeekId(currentDate), [currentDate]);
    
    // Original simple mapping without UTC complexity
    const weekDays = useMemo(() => {
        const days = getWeekDays(currentDate);
        if (!schedule[weekId]) {
            return days.map(date => ({ date, shift: '', status: DayStatus.Work }));
        }
        
        return days.map(date => {
            // Simple date string comparison is robust for local time apps
            const found = schedule[weekId].find(d => d.date.toDateString() === date.toDateString());
            return found ? { ...found, date: date } : { date, shift: '', status: DayStatus.Work };
        });
    }, [currentDate, schedule, weekId]);

    const handleUpdateDay = useCallback((updatedDay: Day) => {
        setSchedule(prevSchedule => {
            // 1. Calculate the ID of the week this day belongs to
            const targetWeekId = getWeekId(updatedDay.date);
            
            // 2. Get existing data for that week OR retrieve empty days
            const existingWeek = prevSchedule[targetWeekId] || [];
            
            // 3. Generate a fresh 7-day structure for that week to ensure no gaps
            const fullWeekDates = getWeekDays(updatedDay.date);
            
            const newWeekDays = fullWeekDates.map(date => {
                // If this is the specific day being updated, use the new data
                if (date.toDateString() === updatedDay.date.toDateString()) {
                    return updatedDay;
                }
                
                // Otherwise, try to find this day in the existing schedule data
                const existingDay = existingWeek.find(d => d.date.toDateString() === date.toDateString());
                
                // Return preserved data or a default empty day
                return existingDay || { date, shift: '', status: DayStatus.Work };
            });

            const newSchedule = { ...prevSchedule, [targetWeekId]: newWeekDays };
            
            if (firebaseUser?.uid) {
                debouncedSaveToFirestore(newSchedule, firebaseUser.uid);
            }
            
            return newSchedule;
        });
        setEditingDay(null);
    }, [firebaseUser, debouncedSaveToFirestore]);
    
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

    // --- Report Logic ---
    const calculatePeriodData = (days: Date[]) => {
        let totalH = 0;
        let daysOff = 0;
        const relevantDays: Day[] = [];

        days.forEach(date => {
            const wId = getWeekId(date);
            const weekData = schedule[wId];
            
            // We need to be careful with toDateString() if 'date' is UTC and 'schedule' dates are local.
            // But in handleDownloadCustomPeriod we now ensure loopDate is created correctly.
            const foundDay = weekData?.find(d => d.date.toDateString() === date.toDateString());
            const dayToUse = foundDay || { date, shift: '', status: DayStatus.Work };
            relevantDays.push(dayToUse);

            if (dayToUse.status === DayStatus.Work) {
                totalH += calculateHoursFromShift(dayToUse.shift);
            } else if (dayToUse.status === DayStatus.Holiday || dayToUse.status === DayStatus.Vacation) {
                daysOff++;
            }
        });

        // Simple calculation: 40h per 7 days.
        // If the period is exactly N weeks, target is N * 40.
        // If there are extra holidays (more than 2 per week), we subtract 8h for each.
        const totalWeeks = days.length / 7;
        const expectedDaysOff = Math.floor(totalWeeks * 2);
        const extraDaysOff = Math.max(0, daysOff - expectedDaysOff);
        const targetHours = Math.max(0, (totalWeeks * 40) - (extraDaysOff * 8));
        const totalOvertime = totalH - targetHours;

        return {
            periodDays: relevantDays.filter(d => d.shift || d.status !== DayStatus.Work),
            totalHours: totalH,
            overtimeHours: totalOvertime
        };
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
                onForceDownload={handleForceDownload}
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
