import React, { useState } from 'react';
import { LogoIcon } from './icons';

interface LoginProps {
    onLogin: () => void;
}

// Hardcoded credentials for simplicity
const USERNAME = 'nefta';
const PASSWORD = '2020';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === USERNAME && password === PASSWORD) {
            setError('');
            onLogin();
        } else {
            setError('Usuario o contraseña incorrectos.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-sm mx-auto">
                <div className="flex justify-center mb-8">
                    <LogoIcon className="w-20 h-20" />
                </div>
                <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700 animate-fade-in-scale-up">
                    <h1 className="text-3xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-700">
                        Bienve App
                    </h1>
                    <p className="text-center text-gray-400 mb-8">Inicia sesión para continuar</p>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                                Usuario
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-gray-900 border-2 border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                                required
                                autoFocus
                                autoComplete="username"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-900 border-2 border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm text-center">{error}</p>
                        )}

                        <button
                            type="submit"
                            className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-transform transform hover:scale-105 duration-300 disabled:bg-gray-500"
                        >
                            Acceder
                        </button>
                    </form>
                     <div className="text-center mt-4 text-xs text-gray-500">
                        <p>Usuario: nefta</p>
                        <p>Contraseña: 2020</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;