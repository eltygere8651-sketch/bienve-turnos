
const getWeekNumber = (d: Date): number => {
    const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNr = (target.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNr + 3);
    const firstThursday = target.getTime();
    target.setUTCMonth(0, 1);
    if (target.getUTCDay() !== 4) {
        target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target.getTime()) / 604800000);
}

export const getWeekId = (date: Date): string => {
    // Para la base de datos mantenemos una lógica estable, 
    // pero para ordenación interna el PDF usará fechas reales.
    const year = date.getUTCFullYear();
    const week = getWeekNumber(date);
    return `${year}-${week.toString().padStart(2, '0')}`;
};

export const getWeekDays = (date: Date): Date[] => {
    const days: Date[] = [];
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayOfWeek = utcDate.getUTCDay();
    const diff = utcDate.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    
    for (let i = 0; i < 7; i++) {
        const day = new Date(utcDate);
        day.setUTCDate(diff + i);
        days.push(day);
    }
    return days;
};

export const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const days: Date[] = [];
    const day = new Date(Date.UTC(year, month, 1));
    while (day.getUTCMonth() === month) {
        days.push(new Date(day));
        day.setUTCDate(day.getUTCDate() + 1);
    }
    return days;
};

export const getWeekTitle = (date: Date): string => {
    const weekDays = getWeekDays(date);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' };
    return `Semana del ${weekDays[0].toLocaleDateString('es-ES', options)} al ${weekDays[6].toLocaleDateString('es-ES', options)}`;
};

export const getMonthTitle = (date: Date): string => {
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' });
};

export const formatDayDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', { day: 'numeric', timeZone: 'UTC' });
};

export const formatDayName = (date: Date): string => {
    return date.toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'UTC' });
};
