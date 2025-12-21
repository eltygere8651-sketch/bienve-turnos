
export interface ShiftPart {
    start: number; // hour as a float, e.g., 12.5 for 12:30
    end: number;
}

/**
 * Convierte un string de tiempo (13:30, 13.5, 13.30, C) a valor decimal.
 */
const parseTimeToHours = (timeStr: string): number => {
    if (!timeStr) return NaN;
    const trimmed = timeStr.trim().toUpperCase();
    
    if (trimmed === 'C' || trimmed === 'CIERRE') return 24;

    // Normalizar separadores
    const normalized = trimmed.replace(',', ':').replace('.', ':');
    
    if (normalized.includes(':')) {
        const parts = normalized.split(':');
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) || 0;
        if (isNaN(h)) return NaN;
        return h + (m / 60);
    }

    const num = parseFloat(trimmed);
    return isNaN(num) ? NaN : num;
};

/**
 * Procesa el string del turno y extrae las horas de forma robusta.
 * Maneja formatos como "13:30 17:30 20-23:30" detectando pares de inicio-fin.
 */
export const parseShiftParts = (shift: string): ShiftPart[] => {
    if (!shift) return [];

    // 1. Extraer todos los tokens que parezcan tiempos (ej: 13:30, 12, 20-23:30, C)
    // Separamos por espacios primero
    const rawTokens = shift.trim().split(/\s+/);
    const parts: ShiftPart[] = [];
    
    const allTimePoints: number[] = [];

    rawTokens.forEach(token => {
        if (token.includes('-')) {
            // Es un rango explícito tipo "20-23:30"
            const range = token.split('-');
            const start = parseTimeToHours(range[0]);
            const end = parseTimeToHours(range[1]);
            if (!isNaN(start) && !isNaN(end)) {
                let finalEnd = end;
                if (finalEnd < start) finalEnd += 24;
                parts.push({ start, end: finalEnd });
            }
        } else {
            // Es un punto de tiempo aislado tipo "13:30"
            const point = parseTimeToHours(token);
            if (!isNaN(point)) {
                allTimePoints.push(point);
            }
        }
    });

    // 2. Emparejar los puntos sueltos (ej: "13:30" y "17:30" -> 4h)
    for (let i = 0; i < allTimePoints.length; i += 2) {
        if (allTimePoints[i+1] !== undefined) {
            let start = allTimePoints[i];
            let end = allTimePoints[i+1];
            if (end < start) end += 24;
            parts.push({ start, end });
        }
    }

    return parts;
};

export const calculateHoursFromShift = (shift: string): number => {
    const parts = parseShiftParts(shift);
    const total = parts.reduce((acc, part) => acc + (part.end - part.start), 0);
    // Redondeo a 2 decimales para evitar errores de precisión de punto flotante
    return Math.round(total * 100) / 100;
};
