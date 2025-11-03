import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-700">
                <h2 id="modal-title" className="text-2xl font-bold text-red-400 mb-4">{title}</h2>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end space-x-4">
                    <button onClick={onCancel} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition">{cancelText}</button>
                    <button onClick={onConfirm} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition">{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
