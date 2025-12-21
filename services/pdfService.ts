
import jsPDF from 'jspdf';
import { Day, DayStatus } from '../types';
import { getWeekTitle, getMonthTitle, getWeekDays } from '../utils/dateUtils';
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

export const svgToPngDataUrl = (svgString: string, width: number, height: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
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
                reject(new Error('Canvas context error'));
            }
        };
        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        };
        img.src = url;
    });
};

const addHeader = async (doc: jsPDF) => {
    try {
        const pdfLogoPngUrl = await svgToPngDataUrl(LOGO_SVG_STRING_PDF, 100, 100);
        doc.addImage(pdfLogoPngUrl, 'PNG', 15, 10, 20, 20);
    } catch (e) { console.error(e); }
};

const formatDayLine = (day: Day): string => {
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    let dIdx = day.date.getUTCDay() - 1;
    if (dIdx === -1) dIdx = 6;
    const dayName = dayNames[dIdx];
    const dateStr = `${String(day.date.getUTCDate()).padStart(2, '0')}/${String(day.date.getUTCMonth() + 1).padStart(2, '0')}`;
    
    let statusText = '';
    if (day.status === DayStatus.Vacation) statusText = "Vacaciones";
    else if (day.status === DayStatus.Holiday) statusText = "Festivo";
    else statusText = day.shift || 'Sin turno';
    
    return `${dayName.padEnd(11)} (${dateStr}): ${statusText}`;
};

export const downloadScheduleAsPdf = async (data: WeekPdfData) => {
    const { weekDays, currentDate, totalHours, overtimeHours } = data;
    const doc = new jsPDF();
    await addHeader(doc);
    
    doc.setFontSize(13);
    doc.setTextColor("#64748B");
    doc.text(`${getWeekTitle(currentDate)}`, 15, 45);

    let yPos = 55;
    doc.setFontSize(11);
    doc.setTextColor("#0F172A");
    doc.setFont('courier', 'normal');

    weekDays.forEach((day) => {
        doc.text(formatDayLine(day), 20, yPos);
        yPos += 6.5;
    });

    yPos += 8;
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total de Horas Físicas Trabajadas: ${totalHours.toFixed(2)}h`, 20, yPos);
    yPos += 8;
    doc.text(`Balance Extra (Base 40h/semana): ${overtimeHours.toFixed(2)}h`, 20, yPos);
    
    doc.save(`horario_semanal.pdf`);
};

const renderPeriodDays = (doc: jsPDF, days: Day[], startY: number): number => {
    let yPos = startY;
    let lastMondayStr = "";

    doc.setFontSize(8);
    doc.setFont('courier', 'normal');
    doc.setTextColor("#0F172A");

    days.forEach((day) => {
        const dayOfWeek = day.date.getUTCDay();
        const diff = day.date.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
        const monday = new Date(day.date);
        monday.setUTCDate(diff);
        const mondayStr = monday.toISOString().split('T')[0];

        if (mondayStr !== lastMondayStr) {
            if (yPos > 260) { doc.addPage(); yPos = 20; } else { yPos += 4; }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor("#334155");
            doc.text(getWeekTitle(day.date), 15, yPos);
            yPos += 5;
            doc.setFont('courier', 'normal');
            doc.setFontSize(8);
            doc.setTextColor("#0F172A");
            lastMondayStr = mondayStr;
        }

        if (yPos > 280) { doc.addPage(); yPos = 20; }
        doc.text(formatDayLine(day), 20, yPos);
        yPos += 4.5;
    });

    return yPos;
};

export const downloadMonthScheduleAsPdf = async (data: MonthPdfData) => {
    const { monthDays, currentDate, totalHours, overtimeHours } = data;
    const doc = new jsPDF('p', 'mm', 'a4');
    await addHeader(doc);

    doc.setFontSize(15);
    doc.setTextColor("#64748B");
    doc.text(`Horario Mensual: ${getMonthTitle(currentDate)}`, 15, 45);

    const sortedDays = [...monthDays].sort((a, b) => a.date.getTime() - b.date.getTime());
    let yPos = renderPeriodDays(doc, sortedDays, 50);

    yPos += 10;
    if (yPos > 270) { doc.addPage(); yPos = 20; }
    
    doc.setLineWidth(0.5);
    doc.line(15, yPos, 195, yPos);
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total de Horas Físicas Trabajadas: ${totalHours.toFixed(2)}h`, 15, yPos);
    yPos += 8;
    doc.text(`Balance Total de Horas Extra: ${overtimeHours.toFixed(2)}h`, 15, yPos);

    doc.save(`horario_mensual.pdf`);
};

export const downloadCustomPeriodPdf = async (data: CustomPeriodPdfData) => {
    const { periodDays, startDate, endDate, totalHours, overtimeHours } = data;
    const doc = new jsPDF('p', 'mm', 'a4');
    await addHeader(doc);

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' };
    const title = `Horario: ${startDate.toLocaleDateString('es-ES', options)} - ${endDate.toLocaleDateString('es-ES', options)}`;

    doc.setFontSize(15);
    doc.setTextColor("#64748B");
    doc.text(title, 15, 45);

    const sortedDays = [...periodDays].sort((a, b) => a.date.getTime() - b.date.getTime());
    let yPos = renderPeriodDays(doc, sortedDays, 50);

    yPos += 10;
    if (yPos > 270) { doc.addPage(); yPos = 20; }
    
    doc.setLineWidth(0.5);
    doc.line(15, yPos, 195, yPos);
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total de Horas Físicas Trabajadas: ${totalHours.toFixed(2)}h`, 15, yPos);
    yPos += 8;
    doc.text(`Balance Total de Horas Extra: ${overtimeHours.toFixed(2)}h`, 15, yPos);
    
    doc.save(`horario_personalizado.pdf`);
};
