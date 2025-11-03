export interface ShiftPart {
    start: number; // hour as a float, e.g., 12.5 for 12:30
    end: number;
}

/**
 * Parses a time string (e.g., "12:30", "16.5", "C") into a decimal hour value.
 * This handles various user input formats for consistency.
 * @param timeStr The time string to parse.
 * @returns The time in hours as a float, or NaN if invalid.
 */
const parseTimeToHours = (timeStr: string): number => {
    if (typeof timeStr !== 'string') return NaN;

    const trimmedStr = timeStr.trim().toUpperCase();
    if (trimmedStr === 'C') {
        return 24;
    }

    const normalizedStr = trimmedStr.replace(',', '.');

    // Handles HH:MM format
    if (normalizedStr.includes(':')) {
        const [hours, minutes] = normalizedStr.split(':').map(Number);
        if (!isNaN(hours) && minutes >= 0 && minutes < 60) {
            return hours + (minutes / 60);
        }
        return NaN; // Invalid HH:MM format
    }
    
    // Handles decimal (e.g., 12.5) and integer (e.g., 12) formats
    const num = parseFloat(normalizedStr);
    return isNaN(num) ? NaN : num;
};

export const parseShiftParts = (shift: string): ShiftPart[] => {
    if (!shift || typeof shift !== 'string') return [];
    
    // Normalize the shift string to remove spaces around hyphens, e.g., "10 - 14" becomes "10-14".
    const normalizedShift = shift.replace(/\s*-\s*/g, '-');
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
                // For now, we don't support other formats like those with 3 parts due to ambiguity.
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