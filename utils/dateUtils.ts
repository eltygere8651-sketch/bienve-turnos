
// Helper to get the week number for a date
const getWeekNumber = (d: Date): number => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}

export const getWeekId = (date: Date): string => {
    const year = date.getFullYear();
    const week = getWeekNumber(date);
    return `${year}-${week.toString().padStart(2, '0')}`;
};

export const getWeekDays = (date: Date): Date[] => {
    const days: Date[] = [];
    const currentDay = date.getDay();
    // Adjust to start week on Monday (Sunday is 0, Monday is 1)
    const dayOfWeek = currentDay === 0 ? 6 : currentDay - 1;
    const firstDayOfWeek = new Date(date);
    firstDayOfWeek.setDate(date.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
        const day = new Date(firstDayOfWeek);
        day.setDate(firstDayOfWeek.getDate() + i);
        days.push(day);
    }
    return days;
};

export const getWeekTitle = (date: Date): string => {
    const weekDays = getWeekDays(date);
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };

    const firstDayStr = firstDay.toLocaleDateString('es-ES', options);
    const lastDayStr = lastDay.toLocaleDateString('es-ES', options);

    return `Semana del ${firstDayStr} al ${lastDayStr}`;
};

export const formatDayDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', { day: 'numeric' });
};

export const formatDayName = (date: Date): string => {
    return date.toLocaleDateString('es-ES', { weekday: 'long' });
};
