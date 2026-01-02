
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
        // Simple heuristic: if it's 17.30, treat as 17.5 for calculation? 
        // Or assume user uses decimal hours directly (17.5 = 17:30).
        // Let's stick to standard decimal hours for simplicity as strictly requested.
        return num;
    }
    
    return NaN;
};

export const parseShiftParts = (shift: string): ShiftPart[] => {
    if (!shift) return [];
    
    // Normalize format: "12-16 20-23"
    const normalized = shift.replace(/\s*-\s*/g, '-').trim();
    const parts: ShiftPart[] = [];
    
    const tokens = normalized.split(' ');
    
    tokens.forEach(token => {
        if (token.includes('-')) {
            const [startStr, endStr] = token.split('-');
            if (startStr && endStr) {
                const start = parseTimeToHours(startStr);
                let end = parseTimeToHours(endStr);
                
                if (!isNaN(start) && !isNaN(end)) {
                    // Handle midnight crossing (20-02 -> 20 to 26)
                    if (end < start) end += 24;
                    // Handle 00 as 24
                    if (end === 0 && start > 0) end = 24;
                    
                    parts.push({ start, end });
                }
            }
        }
    });
    
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
