
import jsPDF from 'jspdf';
import { Day, DayStatus } from '../types';
import { getWeekTitle, getMonthTitle, getWeekId } from '../utils/dateUtils';
import { LOGO_SVG_STRING_PDF } from '../constants';

interface WeekPdfData {
    weekDays: Day[];
    currentDate: Date;
    totalHours: number;
    overtimeHours: number;
}

interface MonthPdfData {
    monthDays: Day[];
    currentDate: Date;
    totalHours: number;
    overtimeHours: number;
}

/**
 * Converts an SVG string to a PNG data URL using a canvas.
 * This is necessary because jspdf does not support SVG images directly.
 * @param svgString The SVG content as a string.
 * @param width The desired width of the output PNG.
 * @param height The desired height of the output PNG.
 * @returns A promise that resolves with the PNG data URL.
 */
export const svgToPngDataUrl = (svgString: string, width: number, height: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        // Use btoa to handle SVG content properly in the data URL
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-t' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                const pngDataUrl = canvas.toDataURL('image/png');
                URL.revokeObjectURL(url);
                resolve(pngDataUrl);
            } else {
                URL.revokeObjectURL(url);
                reject(new Error('Could not get canvas context for SVG conversion.'));
            }
        };

        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(new Error(`Failed to load SVG image for conversion: ${err}`));
        };

        img.src = url;
    });
};

const addHeader = async (doc: jsPDF) => {
    try {
        const pdfLogoPngUrl = await svgToPngDataUrl(LOGO_SVG_STRING_PDF, 100, 100);
        doc.addImage(pdfLogoPngUrl, 'PNG', 15, 10, 20, 20);
    } catch (error) {
        console.error("Failed to generate logo for PDF:", error);
    }
};

export const downloadScheduleAsPdf = async (data: WeekPdfData) => {
    const { weekDays, currentDate, totalHours, overtimeHours } = data;
    
    const doc = new jsPDF();
    
    await addHeader(doc);
    
    doc.setFontSize(14);
    doc.setTextColor("#64748B");
    doc.text(`Resumen Semanal: ${getWeekTitle(currentDate)}`, 15, 45);

    let yPos = 60;
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    doc.setFontSize(12);
    doc.setTextColor("#0F172A");
    doc.setFont('courier', 'normal');

    weekDays.forEach((day, index) => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
        let statusText = '';
        if (day.status === DayStatus.Vacation) {
            statusText = "Vacaciones";
        } else if (day.status === DayStatus.Holiday) {
            statusText = "Festivo";
        } else {
            statusText = day.shift || 'Sin turno';
        }
        doc.text(`${dayNames[index].padEnd(11)}: ${statusText}`, 20, yPos);
        yPos += 7;
    });

    yPos += 10;
    
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor("#334155"); // Dark text color for totals
    doc.text(`Total de Horas: ${totalHours.toFixed(2)}`, 20, yPos);
    yPos += 8;
    doc.text(`Horas Extraordinarias: ${overtimeHours.toFixed(2)}`, 20, yPos);
    
    const weekId = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    doc.save(`horario_semanal_${weekId}.pdf`);
};

export const downloadMonthScheduleAsPdf = async (data: MonthPdfData) => {
    const { monthDays, currentDate, totalHours, overtimeHours } = data;
    const doc = new jsPDF('p', 'mm', 'a4');
    await addHeader(doc);

    const displayDate = monthDays.length > 0 ? monthDays[0].date : currentDate;

    doc.setFontSize(16);
    doc.setTextColor("#64748B");
    doc.text(`Horario Mensual: ${getMonthTitle(displayDate)}`, 15, 45);

    let yPos = 55; // Optimized starting position
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    const weeks: { [weekId: string]: Day[] } = {};
    monthDays.forEach(day => {
        const weekId = getWeekId(day.date);
        if (!weeks[weekId]) {
            weeks[weekId] = [];
        }
        weeks[weekId].push(day);
    });

    const sortedWeekIds = Object.keys(weeks).sort();

    for (const weekId of sortedWeekIds) {
        const weekDays = weeks[weekId];
        if (weekDays.length === 0) continue;

        if (yPos > 250) { // Page break check
            doc.addPage();
            await addHeader(doc);
            yPos = 40;
        }

        doc.setFontSize(11); // Smaller font for week title
        doc.setFont('helvetica', 'bold');
        doc.setTextColor("#334155");
        const weekTitle = getWeekTitle(weekDays[0].date);
        doc.text(weekTitle, 15, yPos);
        yPos += 6; // Reduced space after title

        doc.setFontSize(9); // Smaller font for days
        doc.setFont('courier', 'normal');
        doc.setTextColor("#0F172A");

        weekDays.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        weekDays.forEach(day => {
            const dayIndex = day.date.getUTCDay() === 0 ? 6 : day.date.getUTCDay() - 1;
            const dayName = dayNames[dayIndex];
            const dateStr = `${String(day.date.getUTCDate()).padStart(2, '0')}/${String(day.date.getUTCMonth() + 1).padStart(2, '0')}`;
            
            let statusText = '';
            if (day.status === DayStatus.Vacation) {
                statusText = "Vacaciones";
            } else if (day.status === DayStatus.Holiday) {
                statusText = "Festivo";
            } else {
                statusText = day.shift || 'Sin turno';
            }
            
            const line = `${dayName.padEnd(11)} (${dateStr}): ${statusText}`;
            doc.text(line, 20, yPos);
            yPos += 4.5; // Reduced line height
        });

        yPos += 4; // Reduced space between weeks
    }

    if (yPos > 260) {
        doc.addPage();
        await addHeader(doc);
        yPos = 40;
    }
    
    doc.setLineWidth(0.5);
    doc.line(15, yPos, doc.internal.pageSize.getWidth() - 15, yPos);
    yPos += 10;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor("#334155");
    doc.text(`Total de Horas: ${totalHours.toFixed(2)}`, 15, yPos);
    yPos += 8;
    doc.text(`Horas Extraordinarias: ${overtimeHours.toFixed(2)}`, 15, yPos);

    const monthId = `${displayDate.getFullYear()}-${String(displayDate.getMonth() + 1).padStart(2, '0')}`;
    doc.save(`horario_mensual_${monthId}.pdf`);
};
