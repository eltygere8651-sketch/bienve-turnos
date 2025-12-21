
import React, { useState } from 'react';
import { Day, DayStatus } from '../types';
import { formatDayName, formatDayDate } from '../utils/dateUtils';
import { Cog6ToothIcon } from './icons';
import { ShiftTemplate } from '../hooks/useShiftTemplates';

interface EditShiftModalProps {
    day: Day;
    onClose: () => void;
    onSave: (day: Day) => void;
    templates: ShiftTemplate[];
    onManageTemplates: () => void;
}

const EditShiftModal: React.FC<EditShiftModalProps> = ({ day, onClose, onSave, templates, onManageTemplates }) => {
    const [shift, setShift] = useState(day.shift);
    const [status, setStatus] = useState(day.status);
    
    const handleSave = () => {
        onSave({ ...day, shift: status === DayStatus.Work ? shift.trim() : '', status });
    };

    const handleStatusChange = (newStatus: DayStatus) => {
        setStatus(newStatus);
        if (newStatus !== DayStatus.Work) {
            setShift('');
        }
    };

    const handleShiftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        const previousValue = shift;

        if (value.length < previousValue.length) {
            setShift(value);
            return;
        }

        value = value.replace(/(\d{2}-\d{2})\s(\d{2})$/, (match, range, minutesStr) => {
            const minutes = parseInt(minutesStr, 10);
            if (minutes >= 24 && minutes < 60) return `${range}:${minutesStr}`;
            return match;
        });

        value = value.replace(/(\d{2}(:\d{2})?-)(\d{2})(\d{2})\b/g, (match, start, _, endH, endM) => {
            if (parseInt(endH, 10) < 24 && parseInt(endM, 10) < 60) return `${start}${endH}:${endM}`;
            return match;
        });

        const parts = value.split(' ');
        const lastPartIndex = parts.length - 1;
        const lastPart = parts[lastPartIndex];

        if (/^\d{4}$/.test(lastPart)) {
            const p1 = lastPart.substring(0, 2);
            const p2 = lastPart.substring(2, 4);
            if (parseInt(p1, 10) < 24 && parseInt(p2, 10) < 24) {
                parts[lastPartIndex] = `${p1}-${p2} `;
                value = parts.join(' ');
            } else if (parseInt(p1, 10) < 24 && parseInt(p2, 10) < 60) {
                parts[lastPartIndex] = `${p1}:${p2}`;
                value = parts.join(' ');
            }
        }
        setShift(value);
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-3xl shadow-xl w-full max-w-md p-6 sm:p-8 border border-gray-700 animate-fade-in-scale-up"
                onClick={e => e.stopPropagation()}
            >
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{formatDayName(day.date)}</h2>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">{formatDayDate(day.date)}</p>
                </div>
                
                <div className="my-6 space-y-6">
                    <div className="grid grid-cols-3 gap-2">
                        <button 
                            onClick={() => handleStatusChange(DayStatus.Work)} 
                            className={`px-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                status === DayStatus.Work 
                                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20' 
                                : 'bg-gray-700 text-gray-400'
                            }`}
                        >
                            TRABAJO
                        </button>
                        <button 
                            onClick={() => handleStatusChange(DayStatus.Holiday)} 
                            className={`px-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                status === DayStatus.Holiday 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                                : 'bg-gray-700 text-gray-400'
                            }`}
                        >
                            FESTIVO
                        </button>
                        <button 
                            onClick={() => handleStatusChange(DayStatus.Vacation)} 
                            className={`px-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                status === DayStatus.Vacation 
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                                : 'bg-gray-700 text-gray-400'
                            }`}
                        >
                            VACACIONES
                        </button>
                    </div>

                    {status === DayStatus.Work ? (
                       <div className="animate-card">
                            <label htmlFor="shift-input" className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
                                Horario del Turno
                            </label>
                            <input
                                id="shift-input"
                                type="text"
                                value={shift}
                                onChange={handleShiftChange}
                                placeholder="Ej: 12-16 20-C"
                                className="w-full bg-gray-900 border-2 border-gray-700 rounded-2xl p-4 text-white font-bold focus:border-cyan-500 outline-none transition"
                                autoFocus
                            />
                            <div className="mt-4">
                                <div className="flex justify-between items-center mb-3 px-1">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Plantillas</p>
                                    <button onClick={onManageTemplates} className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1">
                                        <Cog6ToothIcon className="w-3 h-3" />
                                        Gestionar
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {templates.map(template => (
                                        <button 
                                            key={template.name}
                                            onClick={() => setShift(template.value)}
                                            className="px-3 py-2 text-[10px] font-black bg-gray-700 hover:bg-gray-600 rounded-xl transition uppercase tracking-tighter"
                                        >
                                            {template.name}
                                        </button>
                                    ))}
                                    <button 
                                        onClick={() => setShift('')}
                                        className="px-3 py-2 text-[10px] font-black bg-gray-700 hover:bg-red-900/30 text-red-500 rounded-xl transition border border-red-500/20 uppercase tracking-tighter"
                                    >
                                        Limpiar
                                    </button>
                                </div>
                            </div>
                       </div>
                    ) : (
                        <div className="bg-gray-900/50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-700 animate-card">
                            <p className="text-sm font-bold text-gray-500 italic">
                                {status === DayStatus.Vacation ? 'Disfruta de tus vacaciones 🌴' : 'Día festivo / libranza 🎉'}
                            </p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-8">
                    <button onClick={onClose} className="px-6 py-4 bg-gray-700 text-gray-300 font-black rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition">Cancelar</button>
                    <button onClick={handleSave} className="px-6 py-4 bg-red-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl active:scale-95 transition">Guardar</button>
                </div>
            </div>
        </div>
    );
};

export default EditShiftModal;
