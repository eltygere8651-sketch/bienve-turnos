import React, { useState } from 'react';
import { ShiftTemplate } from '../hooks/useShiftTemplates';
import { TrashIcon } from './icons';

interface ManageTemplatesModalProps {
    templates: ShiftTemplate[];
    onAddTemplate: (template: ShiftTemplate) => void;
    onDeleteTemplate: (name: string) => void;
    onClose: () => void;
}

const ManageTemplatesModal: React.FC<ManageTemplatesModalProps> = ({ templates, onAddTemplate, onDeleteTemplate, onClose }) => {
    const [newName, setNewName] = useState('');
    const [newValue, setNewValue] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim() && newValue.trim()) {
            onAddTemplate({ name: newName, value: newValue });
            setNewName('');
            setNewValue('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 border border-gray-700 flex flex-col animate-fade-in-scale-up"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-red-400 text-center mb-6">Gestionar Plantillas</h2>
                
                <div className="flex-grow overflow-y-auto max-h-[40vh] pr-2 space-y-2 mb-6">
                    {templates.length > 0 ? (
                        templates.map(template => (
                            <div key={template.name} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
                                <div>
                                    <p className="font-semibold text-white">{template.name}</p>
                                    <p className="text-sm text-gray-300 font-mono">{template.value}</p>
                                </div>
                                <button
                                    onClick={() => onDeleteTemplate(template.name)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-600 rounded-full transition"
                                    aria-label={`Eliminar plantilla ${template.name}`}
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-400 py-4">No tienes plantillas guardadas.</p>
                    )}
                </div>

                <form onSubmit={handleAdd} className="mt-auto border-t border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Añadir Nueva Plantilla</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Nombre (ej: Apertura)"
                            className="w-full bg-gray-900 border-2 border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                            required
                        />
                        <input
                            type="text"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            placeholder="Turno (ej: 07-15)"
                            className="w-full bg-gray-900 border-2 border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition">
                        Guardar Plantilla
                    </button>
                </form>
                
                <div className="mt-6 text-center">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default ManageTemplatesModal;