
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
                    // Handle midnight crossing (20-02 -> 20 to 26)
                    if (end < start) end += 24;
                    // Handle 00 as 24 if it's the end of a shift starting later
                    if (end === 0 && start > 0) end = 24;
                    
                    parts.push({ start, end });
                }
            }
            i++;
        } else {
            // Case 2: Space separated range? (e.g., "13:30 17:30")
            // Check if this token is a time AND the next token is a time (and not a range itself)
            const start = parseTimeToHours(token);
            
            if (!isNaN(start)) {
                // Peek at next token
                if (i + 1 < tokens.length) {
                    const nextToken = tokens[i+1];
                    // Verify next token is NOT a hyphenated range (e.g. avoid merging "16" with "20-23")
                    if (!nextToken.includes('-')) {
                        const end = parseTimeToHours(nextToken);
                        if (!isNaN(end)) {
                            // We found a pair: "start" "end"
                            let adjustedEnd = end;
                            if (adjustedEnd < start) adjustedEnd += 24;
                            if (adjustedEnd === 0 && start > 0) adjustedEnd = 24;
                            
                            parts.push({ start, end: adjustedEnd });
                            i += 2; // Consume both tokens
                            continue;
                        }
                    }
                }
            }
            // If no pattern matched, move to next token
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
