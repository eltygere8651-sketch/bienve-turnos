
import { Schedule } from '../types';

export const exportScheduleToJson = (schedule: Schedule) => {
    try {
        const dataStr = JSON.stringify(schedule, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const date = new Date().toISOString().slice(0, 10);
        link.href = url;
        link.download = `bienve_backup_${date}.json`;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 0);
    } catch (error) {
        console.error("Error exporting schedule:", error);
        throw new Error("No se pudo exportar la copia de seguridad.");
    }
};

export const parseAndValidateSchedule = (jsonString: string): Schedule => {
    try {
        const parsed = JSON.parse(jsonString);
        
        // Basic validation: Check if it's an object
        if (typeof parsed !== 'object' || parsed === null) {
            throw new Error("Formato de archivo inválido.");
        }

        // Re-hydrate Date objects
        // We iterate through the structure to convert date strings back to Date objects
        const hydratedSchedule: Schedule = {};
        
        Object.keys(parsed).forEach(weekId => {
            if (Array.isArray(parsed[weekId])) {
                hydratedSchedule[weekId] = parsed[weekId].map((day: any) => ({
                    ...day,
                    date: new Date(day.date),
                    // Ensure status is valid number or default to Work
                    status: typeof day.status === 'number' ? day.status : 0 
                }));
            }
        });

        return hydratedSchedule;
    } catch (error) {
        console.error("Error parsing schedule file:", error);
        throw new Error("El archivo seleccionado no es válido o está dañado.");
    }
};
