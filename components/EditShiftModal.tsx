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
        onSave({ ...day, shift: status === DayStatus.Work ? shift : '', status });
    };

    const handleStatusChange = (newStatus: DayStatus) => {
        setStatus(newStatus);
        if (newStatus !== DayStatus.Work) {
            setShift('');
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-700 animate-fade-in">
                <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold text-red-400 capitalize">{formatDayName(day.date)}</h2>
                    <p className="text-gray-400">{formatDayDate(day.date)}</p>
                </div>
                
                <div className="my-6 space-y-4">
                    <div className="flex justify-center space-x-2">
                        <button onClick={() => handleStatusChange(DayStatus.Work)} className={`px-4 py-2 rounded-lg font-semibold transition ${status === DayStatus.Work ? 'bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Trabajo</button>
                        <button onClick={() => handleStatusChange(DayStatus.Holiday)} className={`px-4 py-2 rounded-lg font-semibold transition ${status === DayStatus.Holiday ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Festivo</button>
                        <button onClick={() => handleStatusChange(DayStatus.Vacation)} className={`px-4 py-2 rounded-lg font-semibold transition ${status === DayStatus.Vacation ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Vacaciones</button>
                    </div>

                    {status === DayStatus.Work && (
                       <div>
                            <label htmlFor="shift-input" className="block text-sm font-medium text-gray-300 mb-2">
                                Turno (ej: 12-16 20-C)
                            </label>
                            <div className="relative">
                                <input
                                    id="shift-input"
                                    type="text"
                                    value={shift}
                                    onChange={(e) => setShift(e.target.value)}
                                    placeholder="Introduce el turno manualmente..."
                                    className="w-full bg-gray-900 border-2 border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                                />
                            </div>
                            <div className="mt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm font-medium text-gray-300">Acciones Rápidas</p>
                                    <button
                                        onClick={onManageTemplates}
                                        className="flex items-center space-x-1 text-sm text-red-400 hover:text-red-300 transition"
                                    >
                                        <Cog6ToothIcon className="w-4 h-4" />
                                        <span>Gestionar</span>
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {templates.map(template => (
                                        <button 
                                            key={template.name}
                                            onClick={() => setShift(template.value)}
                                            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-full transition"
                                        >
                                            {template.name}
                                        </button>
                                    ))}
                                    <button 
                                        onClick={() => setShift('')}
                                        className="px-3 py-1 text-sm bg-gray-700 hover:bg-red-700 text-red-300 hover:text-white rounded-full transition border border-red-500/50"
                                    >
                                        Limpiar
                                    </button>
                                </div>
                            </div>
                       </div>
                    )}
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition">Cancelar</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition">Guardar</button>
                </div>
            </div>
        </div>
    );
};

export default EditShiftModal;