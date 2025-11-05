import React, { useState } from 'react';

interface CustomPeriodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (startDate: Date, endDate: Date) => void;
}

const CustomPeriodModal: React.FC<CustomPeriodModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [error, setError] = useState('');

    const handleConfirm = () => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Add time to end date to make it inclusive
        end.setUTCHours(23, 59, 59, 999);
        start.setUTCHours(0,0,0,0);


        if (start > end) {
            setError('La fecha de inicio no puede ser posterior a la fecha de fin.');
            return;
        }
        setError('');
        onConfirm(start, end);
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8 border border-gray-700 animate-fade-in-scale-up"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-red-400 text-center mb-6">Seleccionar Periodo</h2>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-300 mb-2">
                            Fecha de Inicio
                        </label>
                        <input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-gray-900 border-2 border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition text-white"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>
                     <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-gray-300 mb-2">
                            Fecha de Fin
                        </label>
                        <input
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-gray-900 border-2 border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition text-white"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}

                <div className="flex justify-end space-x-4 mt-8">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition">Cancelar</button>
                    <button onClick={handleConfirm} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition">Generar Reporte</button>
                </div>
            </div>
        </div>
    );
};

export default CustomPeriodModal;