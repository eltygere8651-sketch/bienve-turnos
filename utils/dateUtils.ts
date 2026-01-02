
// Helper to get the week number for a date (Local Time implementation)
const getWeekNumber = (d: Date): number => {
    // Copy date so don't modify original
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    // Get first day of year
    const yearStart = new Date(d.getFullYear(), 0, 1);
    // Calculate full weeks to nearest Thursday
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
    const current = new Date(date);
    
    // Get Monday of the current week
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    
    const monday = new Date(current.setDate(diff));
    monday.setHours(0, 0, 0, 0); // Normalize time

    for (let i = 0; i < 7; i++) {
        const nextDay = new Date(monday);
        nextDay.setDate(monday.getDate() + i);
        days.push(nextDay);
    }
    return days;
};

export const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days: Date[] = [];
    const day = new Date(year, month, 1);

    while (day.getMonth() === month) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
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

export const getMonthTitle = (date: Date): string => {
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
};

export const formatDayDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', { day: 'numeric' });
};

export const formatDayName = (date: Date): string => {
    return date.toLocaleDateString('es-ES', { weekday: 'long' });
};
