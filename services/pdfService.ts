import { jsPDF } from 'jspdf';
import { Day, DayStatus, CustomPeriodPdfData } from '../types';
import { getWeekTitle, getWeekId, formatDayDate } from '../utils/dateUtils';
import { formatShift, calculateHoursFromShift } from './scheduleService';

const addHeader = async (doc: jsPDF) => {
    // Header background
    doc.setFillColor("#1E293B");
    doc.rect(0, 0, 210, 35, 'F');
    
    // Logo (Replicating the app's LogoIcon)
    const logoX = 180;
    const logoY = 8;
    
    // The "B" shape (Red Gradient substitute)
    doc.setFillColor("#DC2626");
    // Top part of B
    doc.roundedRect(logoX + 4, logoY + 1, 8, 8, 4, 4, 'F');
    // Bottom part of B
    doc.roundedRect(logoX + 4, logoY + 8, 10, 10, 5, 5, 'F');
    // Straight left edge of B
    doc.rect(logoX + 4, logoY + 1, 4, 17, 'F');
    
    // The Tray (Darker Red)
    doc.setFillColor("#B91C1C");
    doc.roundedRect(logoX, logoY + 19, 18, 1.5, 0.7, 0.7, 'F');
    
    // Waiter Silhouette (Black, positioned like in the app)
    doc.setFillColor("#000000");
    // Head
    doc.circle(logoX + 9, logoY + 10, 1.2, 'F');
    // Torso
    doc.rect(logoX + 7.5, logoY + 12, 3, 4, 'F');
    // Arm with tray
    doc.rect(logoX + 10.5, logoY + 13.5, 3, 0.6, 'F'); // Arm
    doc.rect(logoX + 12.5, logoY + 12.5, 0.5, 2, 'F'); // Hand/Tray support
    doc.rect(logoX + 11.5, logoY + 12.5, 3, 0.4, 'F'); // Small tray
    
    doc.setTextColor("#FFFFFF");
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text("REGISTRO DE JORNADA", 15, 20);
    
    
};

const saveOrSharePdf = async (doc: jsPDF, fileName: string, shareText: string) => {
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // 1. Always trigger download by default
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    link.click();
    
    // 2. Attempt to share if supported
    if (navigator.share) {
        try {
            const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
            
            // Check if file sharing is supported by the browser
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'Bienve App - Registro de Jornada',
                    text: shareText,
                    files: [file]
                });
            } else {
                // Fallback to sharing just the text if files aren't supported
                await navigator.share({
                    title: 'Bienve App - Registro de Jornada',
                    text: shareText
                });
                alert("Tu navegador no permite compartir archivos directamente. El PDF se ha descargado en tu carpeta de descargas; puedes enviarlo manualmente desde allí.");
            }
        } catch (error) {
            // Ignore AbortError (user cancelled)
            if ((error as any).name !== 'AbortError') {
                console.error('Error sharing PDF:', error);
                alert("Hubo un problema al intentar compartir el archivo. El PDF se ha guardado en tus descargas.");
            }
        }
    } else {
        alert("La función de compartir no está disponible en este navegador. El PDF se ha descargado automáticamente.");
    }
    
    // Cleanup the URL after some time
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
};

export const downloadCustomPeriodPdf = async (data: CustomPeriodPdfData) => {
    const { periodDays, startDate, endDate, totalHours, overtimeHours } = data;
    const doc = new jsPDF('p', 'mm', 'a4');
    await addHeader(doc);

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
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
        
        let weekWorkHours = 0;
        let weekDaysOff = 0;
        
        weekDays.forEach((day: Day) => {
            if (day.status === DayStatus.Work) {
                weekWorkHours += calculateHoursFromShift(day.shift);
            } else if (day.status === DayStatus.Holiday || day.status === DayStatus.Vacation) {
                weekDaysOff++;
            }
        });

        const extraDaysOff = Math.max(0, weekDaysOff - 2);
        const weeklyTarget = Math.max(0, 40 - (extraDaysOff * 8));
        const weekOvertime = Math.max(0, weekWorkHours - weeklyTarget);

        weekDays.forEach((day: Day) => {
            const dayIndex = day.date.getDay() === 0 ? 6 : day.date.getDay() - 1;
            const dayName = dayNames[dayIndex];
            const dateStr = `${String(day.date.getDate()).padStart(2, '0')}/${String(day.date.getMonth() + 1).padStart(2, '0')}`;
            
            let statusText = '';
            if (day.status === DayStatus.Vacation) {
                statusText = "Vacaciones";
            } else if (day.status === DayStatus.Holiday) {
                statusText = "Festivo";
            } else {
                // Apply formatter here
                statusText = day.shift ? formatShift(day.shift) : 'Sin turno';
            }
            
            const line = `${dayName.padEnd(11)} (${dateStr}): ${statusText}`;
            doc.text(line, 20, yPos);
            yPos += 4;
        });

        yPos += 2;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor("#475569");
        doc.text(`Resumen semanal: Total ${weekWorkHours.toFixed(2)}h, Extra ${weekOvertime.toFixed(2)}h`, 20, yPos);
        yPos += 6;
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
    
    const shareText = `Horario del ${formatDayDate(startDate)} al ${formatDayDate(endDate)}: ${totalHours.toFixed(2)}h totales, ${overtimeHours.toFixed(2)}h extra.`;
    await saveOrSharePdf(doc, `horario_periodo_${periodId}.pdf`, shareText);
};

export const downloadWeekPdf = async (weekDays: Day[], totalHours: number, overtimeHours: number) => {
    if (weekDays.length === 0) return;
    
    const doc = new jsPDF('p', 'mm', 'a4');
    await addHeader(doc);
    
    const startDate = weekDays[0].date;
    const weekTitle = getWeekTitle(startDate);
    const fileName = `horario_${weekTitle.replace(/\s+/g, '_').toLowerCase()}.pdf`;
    
    doc.setFontSize(15);
    doc.setTextColor("#64748B");
    doc.text(weekTitle, 15, 45);
    
    let yPos = 55;
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    doc.setFontSize(10);
    doc.setFont('courier', 'normal');
    doc.setTextColor("#0F172A");
    
    weekDays.forEach((day: Day) => {
        const dayIndex = day.date.getDay() === 0 ? 6 : day.date.getDay() - 1;
        const dayName = dayNames[dayIndex];
        const dateStr = `${String(day.date.getDate()).padStart(2, '0')}/${String(day.date.getMonth() + 1).padStart(2, '0')}`;
        
        let statusText = '';
        if (day.status === DayStatus.Vacation) {
            statusText = "Vacaciones";
        } else if (day.status === DayStatus.Holiday) {
            statusText = "Festivo";
        } else {
            statusText = day.shift ? formatShift(day.shift) : 'Sin turno';
        }
        
        const line = `${dayName.padEnd(11)} (${dateStr}): ${statusText}`;
        doc.text(line, 20, yPos);
        yPos += 6;
    });
    
    yPos += 10;
    doc.setLineWidth(0.5);
    doc.line(15, yPos, doc.internal.pageSize.getWidth() - 15, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor("#334155");
    doc.text(`Total de Horas: ${totalHours.toFixed(2)}`, 15, yPos);
    yPos += 7;
    doc.text(`Horas Extra: ${overtimeHours.toFixed(2)}`, 15, yPos);
    
    const shareText = `Mi horario para la ${weekTitle}: ${totalHours.toFixed(2)}h totales, ${overtimeHours.toFixed(2)}h extra.`;
    await saveOrSharePdf(doc, fileName, shareText);
};
