
export interface ShiftPart {
    start: number;
    end: number;
}

const parseTimeToHours = (timeStr: string): number => {
    if (!timeStr) return NaN;
    const trimmed = timeStr.trim().toUpperCase().replace(/,/g, '.');
    
    if (trimmed === 'C' || trimmed === 'CIERRE') return 24;
    
    // Handle HH:MM
    if (trimmed.includes(':')) {
        const [h, m] = trimmed.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) return h + m / 60;
    }
    
    // Handle Decimal
    const num = Number(trimmed);
    if (!isNaN(num)) {
        return num;
    }
    
    return NaN;
};

export const parseShiftParts = (shift: string): ShiftPart[] => {
    if (!shift) return [];
    
    // Normalize format: replace dashes and trim
    const normalized = shift.replace(/[–—]/g, '-').trim();
    
    const parts: ShiftPart[] = [];
    const tokens = normalized.split(/\s+/); // Split by one or more spaces
    
    let i = 0;
    while (i < tokens.length) {
        const token = tokens[i];
        
        if (token.includes('-')) {
            // Case 1: Range with hyphen (e.g., "20-00", "12-16")
            const [startStr, endStr] = token.split('-');
            if (startStr && endStr) {
                const start = parseTimeToHours(startStr);
                let end = parseTimeToHours(endStr);
                
                if (!isNaN(start) && !isNaN(end)) {
                    if (end < start) end += 24;
                    if (end === 0 && start > 0) end = 24;
                    parts.push({ start, end });
                }
            }
            i++;
        } else {
            // Case 2: Space separated times (e.g., "19:30 23:30")
            const startStr = token;
            const nextToken = tokens[i + 1];
            
            if (nextToken && !nextToken.includes('-')) {
                const start = parseTimeToHours(startStr);
                let end = parseTimeToHours(nextToken);
                
                if (!isNaN(start) && !isNaN(end)) {
                    if (end < start) end += 24;
                    if (end === 0 && start > 0) end = 24;
                    parts.push({ start, end });
                    i += 2; // Consume both tokens
                    continue;
                }
            }
            i++;
        }
    }
    
    return parts;
};

export const calculateHoursFromShift = (shift: string): number => {
    const parts = parseShiftParts(shift);
    const total = parts.reduce((acc, part) => acc + (part.end - part.start), 0);
    return Math.round(total * 100) / 100;
};

// Formatter for PDF output
const formatTimeVal = (val: number) => {
    let h = Math.floor(val);
    const m = Math.round((val - h) * 60);
    if (h >= 24) h -= 24;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
};

export const formatShift = (shift: string): string => {
    const parts = parseShiftParts(shift);
    if (parts.length === 0) return shift; // Return original if not parseable
    return parts.map(p => `${formatTimeVal(p.start)}-${formatTimeVal(p.end)}`).join(' ');
};
