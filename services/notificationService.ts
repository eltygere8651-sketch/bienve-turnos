import { Day, DayStatus } from '../types';
import { parseShiftParts } from './scheduleService';

let scheduledTimers: number[] = [];
const NOTIFIED_VACATIONS_KEY = 'notifiedVacations';

const getNotifiedVacations = (): string[] => {
    try {
        const stored = localStorage.getItem(NOTIFIED_VACATIONS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to parse notified vacations from localStorage", e);
        return [];
    }
};

const addNotifiedVacation = (weekId: string) => {
    const notified = getNotifiedVacations();
    if (!notified.includes(weekId)) {
        notified.push(weekId);
        localStorage.setItem(NOTIFIED_VACATIONS_KEY, JSON.stringify(notified));
    }
};

export const requestPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notification');
        return 'denied';
    }
    return Notification.requestPermission();
};

export const clearAllNotifications = () => {
    scheduledTimers.forEach(timerId => clearTimeout(timerId));
    scheduledTimers = [];
};

const showNotification = (title: string, options: NotificationOptions) => {
    if (Notification.permission === 'granted') {
        new Notification(title, options);
    }
};

const scheduleNotification = (date: Date, title: string, options: NotificationOptions) => {
    const now = new Date();
    const delay = date.getTime() - now.getTime();

    if (delay > 0 && delay < 2147483647) { // setTimeout max delay
        const timerId = setTimeout(() => {
            showNotification(title, options);
        }, delay);
        scheduledTimers.push(timerId as any);
    }
};

export const scheduleNotificationsForWeek = (currentWeekDays: Day[], nextWeekDays: Day[], nextWeekId: string, logoUrl?: string) => {
    if (Notification.permission !== 'granted') {
        return;
    }
    
    clearAllNotifications();
    const icon = logoUrl || '/vite.svg';

    // 1. Vacation Notification for the NEXT week
    const isNextWeekVacation = nextWeekDays.length > 0 && nextWeekDays.every(d => d.status === DayStatus.Vacation);
    const notifiedVacations = getNotifiedVacations();
    
    if (isNextWeekVacation && !notifiedVacations.includes(nextWeekId)) {
        const firstDayOfNextWeek = nextWeekDays[0];
        const notificationDate = new Date(firstDayOfNextWeek.date);
        notificationDate.setDate(notificationDate.getDate() - 2); // 2 days in advance
        notificationDate.setHours(9, 0, 0, 0); // At 9 AM

        scheduleNotification(
            notificationDate,
            'Vacaciones Próximas',
            { 
                body: `Tus vacaciones comienzan en 2 días. ¡Disfruta!`,
                icon: icon
            }
        );
        addNotifiedVacation(nextWeekId);
    }

    // 2. Shift and Break Notifications for the CURRENT week
    currentWeekDays.forEach(day => {
        if (day.status !== DayStatus.Work || !day.shift) return;

        const shiftParts = parseShiftParts(day.shift);
        if (shiftParts.length === 0) return;

        // Shift start notification (1 hour before)
        const firstShift = shiftParts[0];
        const shiftStartDate = new Date(day.date);
        shiftStartDate.setHours(Math.floor(firstShift.start), (firstShift.start % 1) * 60, 0, 0);

        const shiftNotificationDate = new Date(shiftStartDate.getTime() - 60 * 60 * 1000); 
        const startTimeString = shiftStartDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        
        scheduleNotification(
            shiftNotificationDate,
            'Comienzo de Turno',
            { 
                body: `Tu turno empieza en 1 hora, a las ${startTimeString}.`,
                icon: icon
            }
        );

        // Break notification for split shifts
        if (shiftParts.length > 1) {
            const breakStartTime = new Date(day.date);
            const firstPartEnd = shiftParts[0].end;
            breakStartTime.setHours(Math.floor(firstPartEnd), (firstPartEnd % 1) * 60, 0, 0);

            const secondPartStart = shiftParts[1].start;
            const nextShiftTime = new Date(day.date);
            nextShiftTime.setHours(Math.floor(secondPartStart), (secondPartStart % 1) * 60, 0, 0);
            const nextStartTimeString = nextShiftTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

            scheduleNotification(
                breakStartTime,
                'Inicio de Descanso',
                { 
                    body: `Tu descanso ha comenzado. El próximo turno es a las ${nextStartTimeString}.`,
                    icon: icon
                }
            );
        }
    });
};
