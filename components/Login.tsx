import React, { useState } from 'react';
import { LogoIcon } from './icons';
import { loginWithGoogle } from '../services/firebaseService';

interface LoginProps {
    onLogin: () => void;
}

// Credenciales fijas para el administrador solicitadas por el usuario
const ADMIN_USERNAME = 'nefta';
const ADMIN_PASSWORD = '2020';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            setError('');
            onLogin();
        } else {
            setError('Usuario o contraseña incorrectos.');
        }
    };
    
    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
        } catch (error: any) {
            setError(error.message);
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-sm mx-auto">
                <div className="flex justify-center mb-8">
                    <LogoIcon className="w-20 h-20" title="Bienve App Logo" />
                </div>
                <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700 animate-fade-in-scale-up">
                    <h1 className="text-3xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-700">
                        Bienve App
                    </h1>
                    <p className="text-center text-gray-400 mb-8 font-medium">Panel de Administración</p>
                    
                    <button
                        onClick={handleGoogleLogin}
                        type="button"
                        className="w-full mb-6 px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 duration-200 flex items-center justify-center gap-3"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continuar con Google
                    </button>
                    
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gray-800 text-gray-400">O acceder con contraseña</span>
                        </div>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                                Usuario
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-gray-900 border-2 border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition outline-none"
                                required
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
                                className="w-full bg-gray-900 border-2 border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition outline-none"
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm text-center font-medium animate-pulse">{error}</p>
                        )}

                        <button
                            type="submit"
                            className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 duration-200"
                        >
                            Acceder
                        </button>
                    </form>
                </div>
                <p className="text-center text-gray-500 text-xs mt-8">
                    © {new Date().getFullYear()} Bienve App - Acceso Restringido
                </p>
            </div>
        </div>
    );
};

export default Login;
