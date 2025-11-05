export interface ShiftPart {
    start: number; // hour as a float, e.g., 12.5 for 12:30
    end: number;
}

/**
 * Parses a time string (e.g., "12:30", "16.5", "C") into a decimal hour value.
 * This is a strict parser, ensuring the token represents a single point in time.
 * @param timeStr The time string to parse.
 * @returns The time in hours as a float, or NaN if invalid.
 */
const parseTimeToHours = (timeStr: string): number => {
    if (typeof timeStr !== 'string') return NaN;

    const trimmedStr = timeStr.trim().toUpperCase();
    if (trimmedStr === 'C') {
        return 24;
    }
    
    // A valid time token for this function should not be a range (e.g., "12-16").
    if (trimmedStr.includes('-')) {
        return NaN;
    }

    const normalizedStr = trimmedStr.replace(',', '.');

    // Handles HH:MM format
    if (normalizedStr.includes(':')) {
        const parts = normalizedStr.split(':');
        if (parts.length !== 2) return NaN;
        
        const hours = Number(parts[0]);
        const minutes = Number(parts[1]);

        // Allow hours up to 24 for end-of-day times like "24:00"
        if (!isNaN(hours) && hours >= 0 && hours <= 24 && !isNaN(minutes) && minutes >= 0 && minutes < 60) {
            if (hours === 24 && minutes > 0) return NaN; // 24:00 is valid, but 24:01 is not
            return hours + (minutes / 60);
        }
        return NaN; // Invalid HH:MM format
    }
    
    // Handles decimal (e.g., 12.5) and integer (e.g., 12) formats. Use Number() for stricter parsing than parseFloat().
    const num = Number(normalizedStr);
    if (isNaN(num) || num < 0 || num > 24) { 
        return NaN;
    }
    return num;
};

/**
 * Parses a shift string (e.g., "12-16 20-C" or "12 16 20 C") into a list of shift parts.
 * This implementation is robust and handles various user input styles.
 */
export const parseShiftParts = (shift: string): ShiftPart[] => {
    if (!shift || typeof shift !== 'string') return [];

    // Normalize string: remove spaces around hyphens, then split into potential time tokens.
    const normalizedShift = shift.trim().replace(/\s*-\s*/g, '-');
    const tokens = normalizedShift.split(/\s+/);

    const parts: ShiftPart[] = [];

    // Process tokens. A shift part can be an explicit range "10-14" or an implicit pair "10 14".
    for (let i = 0; i < tokens.length; i++) {
        const currentToken = tokens[i];

        // Case 1: Token is an explicit range (e.g., "10-14", "20-C").
        if (currentToken.includes('-')) {
            const timeRange = currentToken.split('-');
            if (timeRange.length === 2) {
                const start = parseTimeToHours(timeRange[0]);
                const end = parseTimeToHours(timeRange[1]);

                if (!isNaN(start) && !isNaN(end)) {
                    let endTime = end;
                    // Handle shifts crossing midnight (e.g., 22-06).
                    if (endTime < start) {
                        endTime += 24;
                    }
                    parts.push({ start: start, end: endTime });
                }
            }
            // Silently ignore invalid ranges like "10-12-14" or "-12".
        }
        // Case 2: Token is a single number; check for a subsequent number to form an implicit pair (e.g., "10" followed by "14").
        else {
            const nextToken = tokens[i + 1];
            // The next token must not be an explicit range itself.
            if (nextToken && !nextToken.includes('-')) {
                const start = parseTimeToHours(currentToken);
                const end = parseTimeToHours(nextToken);

                if (!isNaN(start) && !isNaN(end)) {
                    let endTime = end;
                    // Handle shifts crossing midnight.
                    if (endTime < start) {
                        endTime += 24;
                    }
                    parts.push({ start: start, end: endTime });
                    i++; // Skip the next token as it has been processed as part of the pair.
                }
            }
        }
    }

    return parts;
};


export const calculateHoursFromShift = (shift: string): number => {
    const parts = parseShiftParts(shift);
    return parts.reduce((total, part) => total + (part.end - part.start), 0);
};
