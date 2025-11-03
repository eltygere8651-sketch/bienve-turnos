export interface ShiftPart {
    start: number; // hour as a float, e.g., 12.5 for 12:30
    end: number;
}

export const parseShiftParts = (shift: string): ShiftPart[] => {
    if (!shift || typeof shift !== 'string') return [];
    
    // Bug Fix: Normalize the shift string to remove spaces around hyphens, e.g., "10 - 14" becomes "10-14".
    // This makes parsing much more reliable for both manual and AI-generated input.
    const normalizedShift = shift.replace(/\s*-\s*/g, '-');
    const parts: ShiftPart[] = [];
    const timeSegments = normalizedShift.trim().split(/\s+/);

    timeSegments.forEach(segment => {
        const timeRange = segment.split('-');
        if (timeRange.length !== 2) return;

        let [startStr, endStr] = timeRange;
        
        if (endStr.toUpperCase() === 'C') {
            endStr = '24';
        }

        const start = parseFloat(startStr.replace(',', '.'));
        const end = parseFloat(endStr.replace(',', '.'));

        if (!isNaN(start) && !isNaN(end)) {
            let endTime = end;
            // Handle shifts crossing midnight, e.g., 22-02
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
