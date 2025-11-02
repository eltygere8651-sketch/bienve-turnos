import 'jspdf';
import { Day, DayStatus } from '../types';
import { getWeekTitle } from '../utils/dateUtils';
import { LOGO_SVG_STRING } from '../constants';

interface PdfData {
    weekDays: Day[];
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

export const downloadScheduleAsPdf = async (data: PdfData) => {
    const { weekDays, currentDate, totalHours, overtimeHours } = data;
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();
    
    // Use a dark version of the logo for the white PDF background
    const logoSvgForPdf = LOGO_SVG_STRING.replace('fill="white"', 'fill="#334155"'); // Replace white with dark slate gray
    try {
        const pdfLogoPngUrl = await svgToPngDataUrl(logoSvgForPdf, 100, 100);
        doc.addImage(pdfLogoPngUrl, 'PNG', 15, 15, 25, 25);
    } catch (error) {
        console.error("Failed to generate logo for PDF:", error);
    }

    doc.setFontSize(22);
    doc.setTextColor("#D97706"); // Gold color for title to match logo accent
    doc.text("Bienve App", 50, 28);
    
    doc.setFontSize(14);
    doc.setTextColor("#64748B");
    doc.text(getWeekTitle(currentDate), 50, 36);

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
    
    const weekId = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    doc.save(`horario_Bienve_App_${weekId}.pdf`);
};
