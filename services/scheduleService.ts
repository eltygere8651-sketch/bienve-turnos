
export interface ShiftPart {
    start: number; // hour as a float, e.g., 12.5 for 12:30
    end: number;
}

/**
 * Parses a time string (e.g., "12:30", "16.5", "16.30", "C", "1") into a decimal hour value.
 */
const parseTimeToHours = (timeStr: string): number => {
    if (!timeStr || typeof timeStr !== 'string') return NaN;

    // Normalize: replace commas with dots, trim, uppercase
    const trimmedStr = timeStr.trim().toUpperCase().replace(/,/g, '.');
    
    if (trimmedStr === '') return NaN;
    if (trimmedStr === 'C' || trimmedStr === 'CIERRE') return 24; // Treat Cierre as 24:00 (midnight) or 00:00 next day conceptually
    
    // Safety check: a time token shouldn't contain a range separator here
    if (trimmedStr.includes('-')) return NaN;

    // 1. Handle HH:MM format explicitly (Standard)
    if (trimmedStr.includes(':')) {
        const parts = trimmedStr.split(':');
        if (parts.length >= 2) {
            const hours = Number(parts[0]);
            const minutes = Number(parts[1]);

            if (!isNaN(hours) && !isNaN(minutes)) {
                // Validate logical ranges
                if (hours < 0 || hours > 24 || minutes < 0 || minutes >= 60) return NaN;
                if (hours === 24 && minutes > 0) return NaN; 
                return hours + (minutes / 60);
            }
        }
        return NaN;
    }
    
    // 2. Handle Decimal format (e.g. 17.5 OR 17.30 meaning 17:30)
    if (trimmedStr.includes('.')) {
        const parts = trimmedStr.split('.');
        if (parts.length === 2) {
            const hours = Number(parts[0]);
            const fractionalStr = parts[1];
            
            // Critical Fix: Ambiguity between 17.5 (17:30) and 17.50 (17:50).
            if (fractionalStr.length === 2) {
                const minutes = Number(fractionalStr);
                if (!isNaN(hours) && !isNaN(minutes) && minutes < 60) {
                     return hours + (minutes / 60);
                }
            }
            return Number(trimmedStr);
        }
    }
    
    // 3. Handle Integer hours (e.g. "20", "1", "00")
    const num = Number(trimmedStr);
    if (!isNaN(num) && num >= 0 && num <= 24) {
        return num;
    }
    
    return NaN;
};

// Helper to handle shift duration logic consistently
const createShiftPart = (start: number, end: number): ShiftPart => {
    let endTime = end;
    
    // Logic for crossing midnight:
    // If End < Start (e.g. 20 to 1), add 24 to End.
    if (endTime < start) {
        endTime += 24;
    }
    // Explicitly handle 00 as 24 if it is the end time and start is not 0
    else if (endTime === 0 && start > 0) {
        endTime = 24;
    }
    
    return { start, end: endTime };
};

/**
 * Parses a shift string into parts.
 * Restored to standard parsing logic.
 */
export const parseShiftParts = (shift: string): ShiftPart[] => {
    if (!shift || typeof shift !== 'string') return [];

    // Pre-process: 
    let normalizedShift = shift
        .replace(/[–—]/g, '-') 
        .replace(/\s*-\s*/g, '-')
        .trim();
    
    if (!normalizedShift) return [];
    
    const parts: ShiftPart[] = [];
    const tokens = normalizedShift.split(/\s+/);

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.includes('-')) {
            const subTokens = token.split('-');
            
            for (let j = 0; j < subTokens.length - 1; j += 2) {
                const startStr = subTokens[j];
                const endStr = subTokens[j+1]; 
                
                if (startStr && endStr) {
                    const start = parseTimeToHours(startStr);
                    const end = parseTimeToHours(endStr);

                    if (!isNaN(start) && !isNaN(end)) {
                        parts.push(createShiftPart(start, end));
                    }
                }
            }
        }
    }

    return parts;
};

export const calculateHoursFromShift = (shift: string): number => {
    const parts = parseShiftParts(shift);
    const rawTotal = parts.reduce((total, part) => total + (part.end - part.start), 0);
    return Math.round(rawTotal * 100) / 100;
};

// --- New Formatter Function for PDF ---
export const formatTime = (decimalTime: number): string => {
    let hours = Math.floor(decimalTime);
    const minutes = Math.round((decimalTime - hours) * 60);

    // Handle crossing midnight for display (e.g. 25h -> 01:00)
    if (hours >= 24) hours -= 24;

    const hStr = hours.toString().padStart(2, '0');
    const mStr = minutes.toString().padStart(2, '0');
    return `${hStr}:${mStr}`;
};

export const formatShift = (shift: string): string => {
    const parts = parseShiftParts(shift);
    if (parts.length === 0) return shift;

    return parts.map(part => {
        return `${formatTime(part.start)}-${formatTime(part.end)}`;
    }).join(' ');
};
