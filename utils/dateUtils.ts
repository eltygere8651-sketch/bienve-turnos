// Helper to get the week number for a date
const getWeekNumber = (d: Date): number => {
    d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}

export const getWeekId = (date: Date): string => {
    const year = date.getFullYear(); // Year is not affected by timezone in the way we need here
    const week = getWeekNumber(date);
    return `${year}-${week.toString().padStart(2, '0')}`;
};

const toUTCDate = (date: Date): Date => {
    // Creates a new Date object in UTC with the same year, month, and day as the local input date.
    // This effectively strips the time and timezone, treating the date as a universal "day".
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};

export const getWeekDays = (date: Date): Date[] => {
    const days: Date[] = [];
    // Always work from a normalized UTC date to prevent timezone-related day shifts
    const utcDate = toUTCDate(date);

    // getUTCDay(): Sunday is 0, Monday is 1, etc. We want Monday to be index 0.
    const dayOfWeek = utcDate.getUTCDay();
    const dayOfWeekIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0=Mon, 6=Sun

    const firstDayOfWeek = new Date(utcDate);
    firstDayOfWeek.setUTCDate(utcDate.getUTCDate() - dayOfWeekIndex);

    for (let i = 0; i < 7; i++) {
        const day = new Date(firstDayOfWeek);
        day.setUTCDate(firstDayOfWeek.getUTCDate() + i);
        days.push(day);
    }
    return days;
};

export const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days: Date[] = [];
    // Start with the first day of the month in UTC
    const day = new Date(Date.UTC(year, month, 1));

    while (day.getUTCMonth() === month) {
        days.push(new Date(day));
        day.setUTCDate(day.getUTCDate() + 1);
    }
    return days;
};

export const getWeekTitle = (date: Date): string => {
    const weekDays = getWeekDays(date);
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];
    // Specify UTC timezone for formatting to ensure the date part is correct and not shifted by the local timezone offset.
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', timeZone: 'UTC' };

    const firstDayStr = firstDay.toLocaleDateString('es-ES', options);
    const lastDayStr = lastDay.toLocaleDateString('es-ES', options);

    return `Semana del ${firstDayStr} al ${lastDayStr}`;
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