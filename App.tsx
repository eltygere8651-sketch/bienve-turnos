import React, { useState, useMemo, useCallback, useEffect } from 'react';
import 'jspdf'; // Import for side-effect to load the library
import { Day, Schedule, DayStatus } from './types';
import { getWeekId, getWeekDays, getWeekTitle } from './utils/dateUtils';
import { calculateHoursFromShift } from './services/scheduleService';
import * as notificationService from './services/notificationService';
import Header from './components/Header';
import WeekView from './components/WeekView';
import Summary from './components/Summary';
import EditShiftModal from './components/EditShiftModal';
import { useShiftTemplates } from './hooks/useShiftTemplates';
import ManageTemplatesModal from './components/ManageTemplatesModal';

const LOGO_SVG = `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 2H16L19 7L12 22L5 7L8 2ZM12 8L9.5 4H8.5L12 5.5L15.5 4H14.5L12 8Z" fill="white" />
  <path d="M8 7.5H10.5V9.5H8V7.5Z" fill="#FBBF24" />
  <path d="M8 8.5H10.5" stroke="#334155" stroke-width="0.3" />
  <path d="M9.25 7.5V8.5" stroke="#334155" stroke-width="0.3" />
</svg>
`;

const SCHEDULE_STORAGE_KEY = 'bienveAppSchedule';

/**
 * Converts an SVG string to a PNG data URL using a canvas.
 * This is necessary because jspdf does not support SVG images directly.
 * @param svgString The SVG content as a string.
 * @param width The desired width of the output PNG.
 * @param height The desired height of the output PNG.
 * @returns A promise that resolves with the PNG data URL.
 */
const svgToPngDataUrl = (svgString: string, width: number, height: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                const pngDataUrl = canvas.toDataURL('image/png');
                URL.revokeObjectURL(url);
                resolve(pngDataUrl);
            } else {
                URL.revokeObjectURL(url);
                reject(new Error('Could not get canvas context for SVG conversion.'));
            }
        };

        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(new Error(`Failed to load SVG image for conversion: ${err}`));
        };

        img.src = url;
    });
};

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


    useEffect(() => {
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
        // Generate PNG version of the logo for notifications and PDF
        svgToPngDataUrl(LOGO_SVG, 100, 100).then(setLogoPngUrl).catch(console.error);
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
        return schedule[weekId];
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
            const newWeekDays = [...(prevSchedule[weekId] || weekDays)];
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

    const downloadSchedule = async () => {
        const { jsPDF } = (window as any).jspdf;
        const doc = new jsPDF();
        
        // Use a dark version of the logo for the white PDF background
        const logoSvgForPdf = LOGO_SVG.replace('fill="white"', 'fill="#334155"'); // Replace white with dark slate gray
        try {
            const pdfLogoPngUrl = await svgToPngDataUrl(logoSvgForPdf, 100, 100);
            doc.addImage(pdfLogoPngUrl, 'PNG', 15, 15, 25, 25);
        } catch (error) {
            console.error("Failed to generate logo for PDF:", error);
        }

        doc.setFontSize(22);
        doc.setTextColor("#D97706"); // Gold color for title to match logo accent
        doc.text("Bienve App", 50, 28);
        
        doc.setFontSize(14);
        doc.setTextColor("#64748B");
        doc.text(getWeekTitle(currentDate), 50, 36);

        let yPos = 60;
        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        
        doc.setFontSize(12);
        doc.setTextColor("#0F172A");
        doc.setFont('courier', 'normal');

        weekDays.forEach((day, index) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            let statusText = '';
            if (day.status === DayStatus.Vacation) {
                statusText = "Vacaciones";
            } else if (day.status === DayStatus.Holiday) {
                statusText = "Festivo";
            } else {
                statusText = day.shift || 'Sin turno';
            }
            doc.text(`${dayNames[index].padEnd(11)}: ${statusText}`, 20, yPos);
            yPos += 7;
        });

        yPos += 10;
        
        doc.setLineWidth(0.5);
        doc.line(20, yPos, 190, yPos);
        yPos += 10;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor("#334155"); // Dark text color for totals
        doc.text(`Total de Horas: ${totalHours.toFixed(2)}`, 20, yPos);
        yPos += 8;
        doc.text(`Horas Extraordinarias: ${overtimeHours.toFixed(2)}`, 20, yPos);
        
        doc.save(`horario_Bienve_App_${weekId}.pdf`);
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
                onDownload={downloadSchedule}
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