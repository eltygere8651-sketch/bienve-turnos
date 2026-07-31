
export const getWeekId = (date: Date): string => {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun, 1=Mon...
    const diff = d.getDate() - (day === 0 ? 6 : day - 1); // Adjust to Monday
    const monday = new Date(d.setDate(diff));
    
    // Generate ID using local timezone to prevent UTC date shift bugs
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(monday.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${dayOfMonth}`;
};

export const getWeekDays = (date: Date): Date[] => {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun, 1=Mon...
    const diff = d.getDate() - (day === 0 ? 6 : day - 1); // Adjust to Monday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const nextDay = new Date(monday);
        nextDay.setDate(monday.getDate() + i);
        days.push(nextDay);
    }
    return days;
};

export const getWeekTitle = (date: Date): string => {
    const weekDays = getWeekDays(date);
    const monday = weekDays[0];
    const sunday = weekDays[6];
    
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };

    const firstDayStr = monday.toLocaleDateString('es-ES', options);
    const lastDayStr = sunday.toLocaleDateString('es-ES', options);

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
