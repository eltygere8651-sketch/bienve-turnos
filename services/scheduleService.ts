
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
    if (trimmedStr === 'C' || trimmedStr === 'CIERRE') return 24;
    
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
            // Logic:
            // - If length is 2 (e.g., .30, .50), treat as minutes directly.
            // - If length is 1 (e.g., .5), treat as mathematical fraction (0.5h = 30m).
            
            if (fractionalStr.length === 2) {
                const minutes = Number(fractionalStr);
                if (!isNaN(hours) && !isNaN(minutes) && minutes < 60) {
                     return hours + (minutes / 60);
                }
            }
            // Standard float fallback (17.5 -> 17.5h)
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
 * Handles mixed formats robustly: 
 * - "12-16 20-23" (Standard)
 * - "12-16-20-23" (Mashed ranges - previously caused bugs)
 * - "12 16 20 23" (Space separated pairs)
 * - "12:30-16:30" (Time format)
 */
export const parseShiftParts = (shift: string): ShiftPart[] => {
    if (!shift || typeof shift !== 'string') return [];

    // Pre-process: 
    // 1. Replace various dash types with hyphen.
    // 2. Remove spaces around hyphens (e.g. "20 - 1" -> "20-1").
    let normalizedShift = shift
        .replace(/[–—]/g, '-') 
        .replace(/\s*-\s*/g, '-')
        .trim();
    
    if (!normalizedShift) return [];
    
    const parts: ShiftPart[] = [];
    const tokens = normalizedShift.split(/\s+/);

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        // Case 1: Token contains dashes (Ranges)
        if (token.includes('-')) {
            // FIX: Handle multiple ranges mashed together (e.g., "12-16-20-23")
            const subTokens = token.split('-');
            
            // We expect pairs: 0-1, 2-3, etc.
            // If we have odd number of tokens > 1 (e.g. 12-16-20), the last one is ignored or needs context.
            // We iterate by 2s.
            for (let j = 0; j < subTokens.length - 1; j += 2) {
                const startStr = subTokens[j];
                const endStr = subTokens[j+1]; // This exists because loop goes to length-1
                
                if (startStr) {
                    const start = parseTimeToHours(startStr);
                    let end = NaN;

                    // Handle "20-" (open ended implies close)
                    if (!endStr || endStr.trim() === '') {
                        end = 24; 
                    } else {
                        end = parseTimeToHours(endStr);
                    }

                    if (!isNaN(start) && !isNaN(end)) {
                        parts.push(createShiftPart(start, end));
                    }
                }
            }
            
            // If we have an odd token left over (e.g., 12-16-20), '20' is dangling.
            // In a mashed string logic, it's safer to ignore it unless we look ahead, 
            // but usually 12-16-20-23 is the error pattern.
        }
        // Case 2: Token is likely a Start time of a space-separated pair (e.g. "13:30" followed by "17:30")
        else {
            if (i + 1 < tokens.length) {
                const nextToken = tokens[i + 1];
                
                // Ensure the next token isn't a range itself (e.g. "12 16-20" -> 12 shouldn't consume 16-20)
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
