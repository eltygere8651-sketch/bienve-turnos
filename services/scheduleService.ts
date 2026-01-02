
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
    
    if (trimmedStr === '') return NaN;
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

// Helper to handle shift duration logic consistently
const createShiftPart = (start: number, end: number): ShiftPart => {
    let endTime = end;
    
    // Logic for crossing midnight:
    // If End < Start (e.g. 20 to 1), add 24 to End.
    // Example: 20 to 1 -> 1 < 20 -> 25. 25-20 = 5 hours.
    // Example: 20 to 00 -> 0 < 20 -> 24. 24-20 = 4 hours.
    // Example: 20 to 2 -> 2 < 20 -> 26. 26-20 = 6 hours.
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
 * Handles mixed formats robustly: "12-16:30 20-00", "12-17:30 20-1", "20-"
 */
export const parseShiftParts = (shift: string): ShiftPart[] => {
    if (!shift || typeof shift !== 'string') return [];

    // Pre-process: Ensure space around distinct ranges if user forgot them (heuristic)
    // but primarily replace flexible hyphen spacing with a standard hyphen
    let normalizedShift = shift.replace(/\s*-\s*/g, '-').trim();
    
    if (!normalizedShift) return [];
    
    // Split by spaces to get tokens. 
    // Example: "12-16:30 20-1" -> ["12-16:30", "20-1"]
    const tokens = normalizedShift.split(/\s+/);
    const parts: ShiftPart[] = [];

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        // Case 1: Token is an explicit range "Start-End" (e.g. "12-16", "20-1", "20-")
        if (token.includes('-')) {
            const rangeParts = token.split('-');
            if (rangeParts.length === 2) {
                const startStr = rangeParts[0];
                const endStr = rangeParts[1];

                if (startStr !== '') {
                    const start = parseTimeToHours(startStr);
                    
                    // FIX: If endStr is empty (e.g. "20-"), assume it means "to closing" (24)
                    // This fixes the "incomplete schedules" issue where hours were lost.
                    let end = NaN;
                    if (endStr === '') {
                        end = 24;
                    } else {
                        end = parseTimeToHours(endStr);
                    }

                    if (!isNaN(start) && !isNaN(end)) {
                        parts.push(createShiftPart(start, end));
                    }
                }
            }
        }
        // Case 2: Token is likely a Start time of a space-separated pair (e.g. "13:30" followed by "17:30")
        else {
            if (i + 1 < tokens.length) {
                const nextToken = tokens[i + 1];
                
                // Ensure the next token isn't a range itself (e.g. "12 16-20" -> 12 is loose)
                if (!nextToken.includes('-')) {
                    const start = parseTimeToHours(token);
                    const end = parseTimeToHours(nextToken);

                    if (!isNaN(start) && !isNaN(end)) {
                        parts.push(createShiftPart(start, end));
                        // Skip the next token since we consumed it as the 'end' time
                        i++; 
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
    // Round to 2 decimals to avoid floating point weirdness (e.g. 14.4999999)
    return Math.round(rawTotal * 100) / 100;
};
