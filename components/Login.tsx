import React, { useState, useEffect } from 'react';
import { LogoIcon } from './icons';

interface LoginProps {
    onLogin: () => void;
}

const CREDENTIALS_STORAGE_KEY = 'bienveAppCredentials';

interface Credentials {
    username: string;
    password?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [isConfigured, setIsConfigured] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const storedCredentials = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
            if (storedCredentials) {
                setIsConfigured(true);
            }
        } catch (error) {
            console.error("Failed to check credentials from localStorage", error);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const storedCredentialsStr = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
            if (storedCredentialsStr) {
                const storedCredentials = JSON.parse(storedCredentialsStr) as Credentials;
                if (username === storedCredentials.username && password === storedCredentials.password) {
                    setError('');
                    onLogin();
                } else {
                    setError('Usuario o contraseña incorrectos.');
                }
            } else {
                 setError('No se han configurado las credenciales. Por favor, recarga la página.');
            }
        } catch (error) {
            setError('Ocurrió un error al verificar las credenciales.');
            console.error(error);
        }
    };

    const handleSetupSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (username.trim().length < 3 || password.length < 4) {
             setError('El usuario debe tener al menos 3 caracteres y la contraseña al menos 4.');
             return;
        }

        try {
            const credentials: Credentials = { username: username.trim(), password: password };
            localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials));
            setIsConfigured(true);
            setError('');
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            setError('No se pudieron guardar las credenciales.');
            console.error(error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-t-transparent border-red-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isConfigured) {
        return (
             <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4 animate-fade-in">
                <div className="w-full max-w-sm mx-auto">
                    <div className="flex justify-center mb-8">
                        <LogoIcon className="w-20 h-20" />
                    </div>
                    <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700 animate-fade-in-scale-up">
                        <h1 className="text-3xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-700">
                            Bienvenido
                        </h1>
                        <p className="text-center text-gray-400 mb-8">Crea tu cuenta de administrador</p>
                        
                        <form onSubmit={handleSetupSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="username-setup" className="block text-sm font-medium text-gray-300 mb-2">
                                    Usuario
                                </label>
                                <input
                                    id="username-setup"
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
                                <label htmlFor="password-setup" className="block text-sm font-medium text-gray-300 mb-2">
                                    Contraseña
                                </label>
                                <input
                                    id="password-setup"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-900 border-2 border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                             <div>
                                <label htmlFor="confirm-password-setup" className="block text-sm font-medium text-gray-300 mb-2">
                                    Confirmar Contraseña
                                </label>
                                <input
                                    id="confirm-password-setup"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-gray-900 border-2 border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                                    required
                                    autoComplete="new-password"
                                />
                            </div>

                            {error && (
                                <p className="text-red-400 text-sm text-center">{error}</p>
                            )}

                            <button
                                type="submit"
                                className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-transform transform hover:scale-105 duration-300"
                            >
                                Guardar y Continuar
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
    
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
                            className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-transform transform hover:scale-105 duration-300"
                        >
                            Acceder
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;