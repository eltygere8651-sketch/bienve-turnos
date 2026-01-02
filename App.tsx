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
import Login from './components/Login';
import ConfirmModal from './components/ConfirmModal';
import * as ApiKeyService from './services/apiKeyService';
import ApiKeyModal from './components/ApiKeyModal';
import BackupModal from './components/BackupModal';

const SCHEDULE_STORAGE_KEY = 'bienveAppSchedule_v3';
const LEGACY_STORAGE_KEY = 'bienveAppSchedule';
// New key for automatic redundant backups
const AUTO_BACKUP_KEY = 'bienveApp_AutoBackup';
const AUTH_STORAGE_KEY = 'bienveAppIsAuthenticated';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    });

    const [currentDate, setCurrentDate] = useState(new Date());
    
    // Lógica de carga inteligente para recuperar datos de versiones anteriores y Backup Automático
    const [schedule, setSchedule] = useState<Schedule>(() => {
        try {
            const v3Raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
            const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
            const autoBackupRaw = localStorage.getItem(AUTO_BACKUP_KEY);
            
            let scheduleData: Schedule = {};

            // 1. Cargar datos V3 (prioritario)
            if (v3Raw) {
                scheduleData = JSON.parse(v3Raw);
            }

            // 2. Comprobación de seguridad: Si V3 está vacío pero existe AutoBackup, recuperar de ahí
            if (Object.keys(scheduleData).length === 0 && autoBackupRaw) {
                 console.log("Datos principales vacíos. Recuperando de Auto-Backup.");
                 scheduleData = JSON.parse(autoBackupRaw);
            }

            // 3. Fusionar datos Legacy si existen (para recuperar Diciembre u otros datos perdidos)
            if (legacyRaw) {
                const legacyData = JSON.parse(legacyRaw);
                
                Object.keys(legacyData).forEach(weekId => {
                    const legacyWeek = legacyData[weekId];
                    const currentWeek = scheduleData[weekId];

                    const legacyHasContent = legacyWeek.some((d: any) => d.shift || d.status !== 0);

                    if (legacyHasContent) {
                        const currentHasContent = currentWeek ? currentWeek.some((d: any) => d.shift || d.status !== 0) : false;
                        
                        if (!currentHasContent) {
                            console.log(`Recuperando semana ${weekId} de los datos antiguos.`);
                            scheduleData[weekId] = legacyWeek;
                        }
                    }
                });
            }

            // 4. Hidratar fechas
            Object.keys(scheduleData).forEach(weekId => {
                scheduleData[weekId] = scheduleData[weekId].map((day: any) => ({
                    ...day,
                    date: new Date(day.date),
                }));
            });

            return scheduleData;
        } catch (error) {
            console.error("Error al cargar o fusionar horarios:", error);
            return {};
        }
    });
    
    const [editingDay, setEditingDay] = useState<Day | null>(null);
    const { templates, addTemplate, deleteTemplate } = useShiftTemplates();
    const [isManagingTemplates, setIsManagingTemplates] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloadingMonth, setIsDownloadingMonth] = useState(false);
    const [isDownloadingCustomPeriod, setIsDownloadingCustomPeriod] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isCustomPeriodModalOpen, setIsCustomPeriodModalOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem(AUTH_STORAGE_KEY, String(isAuthenticated));
    }, [isAuthenticated]);
    
    useEffect(() => {
        try {
            const json = JSON.stringify(schedule);
            // Guardar en la clave principal
            localStorage.setItem(SCHEDULE_STORAGE_KEY, json);
            // Guardar AUTOMÁTICAMENTE en la clave de respaldo de seguridad
            localStorage.setItem(AUTO_BACKUP_KEY, json);
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
        const scheduledDaysMap = new Map(schedule[weekId].map(d => [new Date(d.date).toISOString().slice(0, 10), d]));
        return days.map(date => scheduledDaysMap.get(date.toISOString().slice(0, 10)) || { date, shift: '', status: DayStatus.Work });
    }, [currentDate, schedule, weekId]);

    const handleUpdateDay = useCallback((updatedDay: Day) => {
        setSchedule(prevSchedule => {
            const currentWeekData = prevSchedule[weekId] || weekDays;
            const newWeekDays = [...currentWeekData];
            const dayIndex = newWeekDays.findIndex(d => new Date(d.date).toISOString().slice(0, 10) === updatedDay.date.toISOString().slice(0, 10));
            if (dayIndex !== -1) {
                newWeekDays[dayIndex] = updatedDay;
            } else {
                newWeekDays.push(updatedDay);
            }
            return { ...prevSchedule, [weekId]: newWeekDays };
        });
        setEditingDay(null);
    }, [weekId, weekDays]);
    
    const { totalHours, overtimeHours } = useMemo(() => {
        let physicalHours = 0;
        let workDaysCount = 0;

        weekDays.forEach(day => {
            if (day.status === DayStatus.Work) {
                workDaysCount++;
                physicalHours += calculateHoursFromShift(day.shift);
            }
        });
        
        const roundedTotal = Math.round(physicalHours * 100) / 100;
        const targetHours = workDaysCount * 8;
        const extra = Math.max(0, roundedTotal - targetHours);
        
        return { totalHours: roundedTotal, overtimeHours: extra };
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

    // --- PDF Downloads ---
    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            await downloadScheduleAsPdf({ weekDays, currentDate, totalHours, overtimeHours });
        } catch (error) {
            console.error("PDF Download failed:", error);
            alert(error instanceof Error ? error.message : "Error al generar PDF.");
        } finally { setIsDownloading(false); }
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
            const monthDaysForPdf = daysInMonth.map(date => {
                const dayKey = date.toISOString().slice(0, 10);
                return scheduleMap.get(dayKey) || { date, shift: '', status: DayStatus.Work };
            });
            let totalWorked = 0;
            let workDaysInMonth = 0;
            monthDaysForPdf.forEach(day => {
                if (day.status === DayStatus.Work) {
                    workDaysInMonth++;
                    totalWorked += calculateHoursFromShift(day.shift);
                }
            });
            const roundedTotal = Math.round(totalWorked * 100) / 100;
            const target = workDaysInMonth * 8;
            const extra = Math.max(0, roundedTotal - target);
            
            await downloadMonthScheduleAsPdf({
                monthDays: monthDaysForPdf.filter(day => day.shift.trim() !== '' || day.status !== DayStatus.Work),
                currentDate,
                totalHours: roundedTotal,
                overtimeHours: extra
            });
        } catch (error) {
            console.error("Monthly PDF Download failed:", error);
            alert("Error al generar PDF mensual.");
        } finally { setIsDownloadingMonth(false); }
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
            let totalWorked = 0;
            let workDaysInPeriod = 0;
            periodDaysWithData.forEach(day => {
                 if (day.status === DayStatus.Work) {
                    workDaysInPeriod++;
                    totalWorked += calculateHoursFromShift(day.shift);
                }
            });
            const roundedTotal = Math.round(totalWorked * 100) / 100;
            const target = workDaysInPeriod * 8;
            const extra = Math.max(0, roundedTotal - target);
            await downloadCustomPeriodPdf({
                periodDays: periodDaysWithData.filter(day => day.shift.trim() !== '' || day.status !== DayStatus.Work),
                startDate, endDate, totalHours: roundedTotal, overtimeHours: extra
            });
        } catch (error) {
            console.error("Custom Period PDF failed:", error);
            alert("Error al generar PDF personalizado.");
        } finally { setIsDownloadingCustomPeriod(false); }
    };

    // --- JSON Backup Feature ---
    const handleExportBackup = () => {
        const dataStr = JSON.stringify(schedule, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `bienve_app_backup_${new Date().toISOString().slice(0,10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleImportBackup = (file: File): Promise<void> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target?.result as string);
                    
                    // Basic validation: check if it looks like a schedule object
                    if (typeof json !== 'object' || json === null) {
                        throw new Error('Formato de archivo inválido');
                    }

                    // Re-hydrate dates
                    const hydratedSchedule: Schedule = {};
                    Object.keys(json).forEach(key => {
                        if (Array.isArray(json[key])) {
                            hydratedSchedule[key] = json[key].map((day: any) => ({
                                ...day,
                                date: new Date(day.date)
                            }));
                        }
                    });

                    // Merge strategy: Overwrite local schedule with imported one? 
                    // Or merge? Here we merge, preferring imported data for same weeks.
                    setSchedule(prev => ({
                        ...prev,
                        ...hydratedSchedule
                    }));
                    
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = error => reject(error);
            reader.readAsText(file);
        });
    };

    const handleLogin = () => setIsAuthenticated(true);
    const handleLogout = () => {
        setIsAuthenticated(false);
        setIsLogoutModalOpen(false);
    };

    if (!isAuthenticated) return <Login onLogin={handleLogin} />;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
            <Header
                currentWeekTitle={getWeekTitle(currentDate)}
                onPrevWeek={handlePrevWeek}
                onNextWeek={handleNextWeek}
                onCalendarClick={() => setIsCalendarOpen(true)}
                onLogout={() => setIsLogoutModalOpen(true)}
                onOpenBackup={() => setIsBackupModalOpen(true)}
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
            {isLogoutModalOpen && (
                <ConfirmModal
                    isOpen={isLogoutModalOpen}
                    title="Cerrar Sesión"
                    message="¿Estás seguro de que quieres cerrar la sesión?"
                    onConfirm={handleLogout}
                    onCancel={() => setIsLogoutModalOpen(false)}
                    confirmText="Cerrar Sesión"
                />
            )}
             {showApiKeyModal && (
                <ApiKeyModal 
                    onSave={(keys) => {
                        ApiKeyService.saveApiKeys(keys);
                        setShowApiKeyModal(false);
                    }}
                />
            )}
            {isBackupModalOpen && (
                <BackupModal 
                    isOpen={isBackupModalOpen}
                    onClose={() => setIsBackupModalOpen(false)}
                    onExport={handleExportBackup}
                    onImport={handleImportBackup}
                />
            )}
        </div>
    );
};

export default App;