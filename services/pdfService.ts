import 'jspdf';
import { Day, DayStatus } from '../types';
import { getWeekTitle, getMonthTitle } from '../utils/dateUtils';
import { LOGO_SVG_STRING } from '../constants';

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

const addHeader = async (doc: any) => {
    const logoSvgForPdf = LOGO_SVG_STRING.replace('fill="white"', 'fill="#334155"'); // Replace white with dark slate gray
    try {
        const pdfLogoPngUrl = await svgToPngDataUrl(logoSvgForPdf, 100, 100);
        doc.addImage(pdfLogoPngUrl, 'PNG', 15, 10, 20, 20);
    } catch (error) {
        console.error("Failed to generate logo for PDF:", error);
    }

    doc.setFontSize(18);
    doc.setTextColor("#D97706");
    doc.text("Bienve App", 40, 22);
};

export const downloadScheduleAsPdf = async (data: WeekPdfData) => {
    const { weekDays, currentDate, totalHours, overtimeHours } = data;
    
    if (!(window as any).jspdf) {
        console.error("jsPDF library not loaded. The download cannot proceed.");
        throw new Error("La librería para generar PDF no se ha podido cargar. Revisa tu conexión a internet e inténtalo de nuevo.");
    }

    const { jsPDF } = (window as any).jspdf;
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
    doc.save(`horario_semanal_Bienve_App_${weekId}.pdf`);
};

export const downloadMonthScheduleAsPdf = async (data: MonthPdfData) => {
    const { monthDays, currentDate, totalHours, overtimeHours } = data;

    if (!(window as any).jspdf) {
        throw new Error("La librería para generar PDF no se ha podido cargar.");
    }

    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    await addHeader(doc);
    
    doc.setFontSize(16);
    doc.setTextColor("#64748B");
    doc.text(`Horario Mensual: ${getMonthTitle(currentDate)}`, 15, 45);

    const dayHeaders = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const margin = 15;
    const cellWidth = (doc.internal.pageSize.getWidth() - 2 * margin) / 7;
    const cellHeight = 25;
    let yPos = 60;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor("#334155");
    dayHeaders.forEach((header, i) => {
        doc.text(header, margin + i * cellWidth + (cellWidth / 2), yPos, { align: 'center' });
    });
    yPos += 5;

    const firstDayOfMonth = monthDays[0].date;
    let startDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun, 1=Mon...
    if (startDayOfWeek === 0) startDayOfWeek = 6; // Adjust Sunday to be the last day
    else startDayOfWeek -= 1;

    let currentDayIndex = 0;
    
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            if ((row === 0 && col < startDayOfWeek) || currentDayIndex >= monthDays.length) {
                continue; // Skip empty cells at the beginning/end of the month
            }
            
            const day = monthDays[currentDayIndex];
            const x = margin + col * cellWidth;
            const y = yPos + row * cellHeight;

            // Cell background color based on status
            if (day.status === DayStatus.Vacation) {
                doc.setFillColor(236, 252, 241); // Light Green
                doc.rect(x, y, cellWidth, cellHeight, 'F');
            } else if (day.status === DayStatus.Holiday) {
                doc.setFillColor(239, 246, 255); // Light Blue
                doc.rect(x, y, cellWidth, cellHeight, 'F');
            }

            doc.setDrawColor(203, 213, 225); // Grid lines color
            doc.rect(x, y, cellWidth, cellHeight);

            // Day number
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text(String(day.date.getDate()), x + cellWidth - 2, y + 4, { align: 'right' });

            // Shift text
            let statusText = day.shift || '';
            if (day.status === DayStatus.Vacation) statusText = 'Vacaciones';
            else if (day.status === DayStatus.Holiday) statusText = 'Festivo';
            
            doc.setFontSize(9);
            doc.setFont('courier', 'normal');
            doc.setTextColor(15, 23, 42);
            doc.text(statusText, x + (cellWidth / 2), y + (cellHeight / 2), { align: 'center', maxWidth: cellWidth - 4 });

            currentDayIndex++;
        }
    }

    yPos += 6 * cellHeight + 10;
    
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, doc.internal.pageSize.getWidth() - margin, yPos);
    yPos += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor("#334155");
    doc.text(`Total de Horas: ${totalHours.toFixed(2)}`, margin, yPos);
    yPos += 8;
    doc.text(`Horas Extraordinarias: ${overtimeHours.toFixed(2)}`, margin, yPos);

    const monthId = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    doc.save(`horario_mensual_Bienve_App_${monthId}.pdf`);
};