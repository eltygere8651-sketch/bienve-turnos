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

export const parseShiftParts = (shift: string): ShiftPart[] => {
    if (!shift || typeof shift !== 'string') return [];
    
    // Pre-processing step to pair up adjacent, space-separated time values (e.g., "13:30 18:30" -> "13:30-18:30")
    const initialTokens = shift.trim().split(/\s+/);
    const pairedTokens = [];
    for (let i = 0; i < initialTokens.length; i++) {
        const current = initialTokens[i];
        const next = initialTokens[i + 1];

        const isCurrentTime = !isNaN(parseTimeToHours(current));
        const isNextTime = next ? !isNaN(parseTimeToHours(next)) : false;

        // If the current token and the next token are both valid time values, pair them into a single shift range.
        if (isCurrentTime && isNextTime) {
            pairedTokens.push(`${current}-${next}`);
            i++; // Skip the next token as it has now been paired
        } else {
            pairedTokens.push(current);
        }
    }
    const processedShift = pairedTokens.join(' ');
    
    // Normalize the shift string to remove spaces around hyphens, e.g., "10 - 14" becomes "10-14".
    const normalizedShift = processedShift.replace(/\s*-\s*/g, '-');
    const parts: ShiftPart[] = [];
    const timeSegments = normalizedShift.trim().split(/\s+/);

    timeSegments.forEach(segment => {
        const timeRange = segment.split('-');
        
        let startStr = '';
        let endStr = '';

        switch (timeRange.length) {
            case 2: // Standard format: HH-HH, HH:MM-HH, etc.
                startStr = timeRange[0];
                endStr = timeRange[1];
                break;
            case 4: // Assumes HH-MM-HH-MM format, e.g., 16-00-16-30
                startStr = `${timeRange[0]}:${timeRange[1]}`;
                endStr = `${timeRange[2]}:${timeRange[3]}`;
                break;
            default:
                // We don't support other formats and will ignore invalid segments.
                return;
        }

        const start = parseTimeToHours(startStr);
        const end = parseTimeToHours(endStr);

        if (!isNaN(start) && !isNaN(end)) {
            let endTime = end;
            // Handle shifts crossing midnight, e.g., 22-02 or 22-00-02-00
            if (endTime < start) {
                endTime += 24;
            }
            parts.push({ start: start, end: endTime });
        }
    });

    return parts;
};


export const calculateHoursFromShift = (shift: string): number => {
    const parts = parseShiftParts(shift);
    return parts.reduce((total, part) => total + (part.end - part.start), 0);
};