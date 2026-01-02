
export interface ShiftPart {
    start: number; // hour as a float, e.g., 12.5 for 12:30
    end: number;
}

/**
 * Parses a time string (e.g., "12:30", "16.5", "16.30", "C", "1") into a decimal hour value.
 */
const parseTimeToHours = (timeStr: string): number => {
    if (!timeStr || typeof timeStr !== 'string') return NaN;

    const trimmedStr = timeStr.trim().toUpperCase();
    
    // Prevent empty strings from being parsed as 0
    if (trimmedStr === '') return NaN;

    // Handle "Cierre"
    if (trimmedStr === 'C') return 24;
    
    // Safety check: a time token shouldn't contain a range separator here
    if (trimmedStr.includes('-')) return NaN;

    const normalizedStr = trimmedStr.replace(',', '.');

    // 1. Handle HH:MM format explicitly (Standard)
    if (normalizedStr.includes(':')) {
        const parts = normalizedStr.split(':');
        if (parts.length !== 2) return NaN;
        
        const hours = Number(parts[0]);
        const minutes = Number(parts[1]);

        if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 24 && minutes >= 0 && minutes < 60) {
            if (hours === 24 && minutes > 0) return NaN; 
            return hours + (minutes / 60);
        }
        return NaN;
    }
    
    // 2. Handle Decimal format (e.g. 17.5 OR 17.30 meaning 17:30)
    // This is ambiguous in user input, but we prioritize standard decimal (17.5 = 17:30).
    // However, users often type 16.30 to mean 16:30.
    if (normalizedStr.includes('.')) {
        const parts = normalizedStr.split('.');
        if (parts.length === 2) {
            const hours = Number(parts[0]);
            const fractionalStr = parts[1];
            
            // Heuristic: If user types "17.30" (2 digits), treat as minutes -> 17.5
            if (fractionalStr.length === 2) {
                const minutes = Number(fractionalStr);
                if (!isNaN(hours) && !isNaN(minutes) && minutes < 60) {
                     return hours + (minutes / 60);
                }
            }
            // Otherwise treat as mathematical decimal: "17.5" -> 17.5 hours
            return Number(normalizedStr);
        }
    }
    
    // 3. Handle Integer hours (e.g. "20", "1", "00")
    const num = Number(normalizedStr);
    if (!isNaN(num) && num >= 0 && num <= 24) {
        return num;
    }
    
    return NaN;
};

/**
 * Parses a shift string into parts using a robust regex approach.
 * Handles: "12-16", "12-16:30", "20-1", "20-C", "20-00", "20-23:30"
 */
export const parseShiftParts = (shift: string): ShiftPart[] => {
    if (!shift || typeof shift !== 'string') return [];

    // Normalize spacing around hyphens: "20 - 1" -> "20-1"
    const normalizedShift = shift.replace(/\s*-\s*/g, '-');
    
    // Split by spaces to get tokens like ["12-16:30", "20-1"]
    const tokens = normalizedShift.trim().split(/\s+/);
    const parts: ShiftPart[] = [];

    for (const token of tokens) {
        // We only care about explicit ranges "Start-End"
        if (token.includes('-')) {
            const rangeParts = token.split('-');
            // Must have exactly 2 parts: Start and End
            if (rangeParts.length === 2) {
                const startStr = rangeParts[0];
                const endStr = rangeParts[1];

                // If end part is empty (e.g. "20-"), ignore it completely (0 hours)
                if (startStr === '' || endStr === '') continue;

                const start = parseTimeToHours(startStr);
                const end = parseTimeToHours(endStr);

                if (!isNaN(start) && !isNaN(end)) {
                    let endTime = end;
                    
                    // Logic for crossing midnight:
                    // If End < Start (e.g. 20 to 1), add 24 to End.
                    // Special case: 20 to 00 (0) -> 0 < 20 -> 24. Diff 4.
                    // Special case: 20 to 24 (C) -> 24 !< 20. Diff 4.
                    if (endTime < start) {
                        endTime += 24;
                    }
                    // Handle "00" explicitly as 24 if it's the end time and equals 0
                    else if (endTime === 0 && start > 0) {
                        endTime = 24;
                    }

                    parts.push({ start, end: endTime });
                }
            }
        }
    }

    return parts;
};


export const calculateHoursFromShift = (shift: string): number => {
    const parts = parseShiftParts(shift);
    const rawTotal = parts.reduce((total, part) => total + (part.end - part.start), 0);
    // Round to 2 decimals to avoid floating point weirdness (e.g. 14.4999999)
    return Math.round(rawTotal * 100) / 100;
};
