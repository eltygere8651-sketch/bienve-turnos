

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

interface CustomPeriodPdfData {
    periodDays: Day[];
    startDate: Date;
    endDate: Date;
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
    
    doc.setFontSize(13);
    doc.setTextColor("#64748B");
    doc.text(`Resumen Semanal: ${getWeekTitle(currentDate)}`, 15, 45);

    let yPos = 55;
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    doc.setFontSize(11);
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
        yPos += 6.5;
    });

    yPos += 8;
    
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor("#334155"); // Dark text color for totals
    doc.text(`Total de Horas: ${totalHours.toFixed(2)}`, 20, yPos);
    yPos += 7;
    doc.text(`Horas Extraordinarias: ${overtimeHours.toFixed(2)}`, 20, yPos);
    
    const weekId = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    doc.save(`horario_semanal_${weekId}.pdf`);
};

export const downloadMonthScheduleAsPdf = async (data: MonthPdfData) => {
    const { monthDays, currentDate, totalHours, overtimeHours } = data;
    const doc = new jsPDF('p', 'mm', 'a4');
    await addHeader(doc);

    const displayDate = monthDays.length > 0 ? monthDays[0].date : currentDate;

    doc.setFontSize(15);
    doc.setTextColor("#64748B");
    doc.text(`Horario Mensual: ${getMonthTitle(displayDate)}`, 15, 45);

    let yPos = 50;
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

        if (yPos > 275) { // Page break check
            doc.addPage();
            await addHeader(doc);
            yPos = 40;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor("#334155");
        const weekTitle = getWeekTitle(weekDays[0].date);
        doc.text(weekTitle, 15, yPos);
        yPos += 5;

        doc.setFontSize(8);
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
            yPos += 4;
        });

        yPos += 3;
    }

    if (yPos > 275) {
        doc.addPage();
        await addHeader(doc);
        yPos = 40;
    }
    
    doc.setLineWidth(0.5);
    doc.line(15, yPos, doc.internal.pageSize.getWidth() - 15, yPos);
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor("#334155");
    doc.text(`Total de Horas: ${totalHours.toFixed(2)}`, 15, yPos);
    yPos += 7;
    doc.text(`Horas Extraordinarias: ${overtimeHours.toFixed(2)}`, 15, yPos);

    const monthId = `${displayDate.getFullYear()}-${String(displayDate.getMonth() + 1).padStart(2, '0')}`;
    doc.save(`horario_mensual_${monthId}.pdf`);
};

export const downloadCustomPeriodPdf = async (data: CustomPeriodPdfData) => {
    const { periodDays, startDate, endDate, totalHours, overtimeHours } = data;
    const doc = new jsPDF('p', 'mm', 'a4');
    await addHeader(doc);

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' };
    const formattedStartDate = startDate.toLocaleDateString('es-ES', options);
    const formattedEndDate = endDate.toLocaleDateString('es-ES', options);
    const title = `Horario: ${formattedStartDate} - ${formattedEndDate}`;
    const periodId = `${startDate.toISOString().slice(0, 10)}_a_${endDate.toISOString().slice(0, 10)}`;

    doc.setFontSize(15);
    doc.setTextColor("#64748B");
    doc.text(title, 15, 45);

    let yPos = 50;
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    const weeks: { [weekId: string]: Day[] } = {};
    periodDays.forEach(day => {
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

        if (yPos > 275) { // Page break check
            doc.addPage();
            await addHeader(doc);
            yPos = 40;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor("#334155");
        const weekTitle = getWeekTitle(weekDays[0].date);
        doc.text(weekTitle, 15, yPos);
        yPos += 5;

        doc.setFontSize(8);
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
            yPos += 4;
        });

        yPos += 3;
    }

    if (yPos > 275) {
        doc.addPage();
        await addHeader(doc);
        yPos = 40;
    }
    
    doc.setLineWidth(0.5);
    doc.line(15, yPos, doc.internal.pageSize.getWidth() - 15, yPos);
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor("#334155");
    doc.text(`Total de Horas (en periodo): ${totalHours.toFixed(2)}`, 15, yPos);
    yPos += 7;
    doc.text(`Horas Extra (calculadas en periodo): ${overtimeHours.toFixed(2)}`, 15, yPos);
    
    doc.save(`horario_periodo_${periodId}.pdf`);
};