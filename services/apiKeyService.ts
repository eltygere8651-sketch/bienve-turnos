
import { FirebaseConfig } from '../types';

export const FIREBASE_CONFIG_KEY = 'bienveAppFirebaseConfig';

// Configuración Hardcoded proporcionada por el usuario
const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyC6stZ-AHOh53yRTgseTpHWW6CDZOftzjA",
  authDomain: "horarios-app-5c7f4.firebaseapp.com",
  projectId: "horarios-app-5c7f4",
  storageBucket: "horarios-app-5c7f4.firebasestorage.app",
  messagingSenderId: "601838390856",
  appId: "1:601838390856:web:7e28e13dc6b28c1ba4d27d"
};

export const saveFirebaseConfig = (config: FirebaseConfig): void => {
    try {
        localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
        console.error("Failed to save Firebase config to localStorage", error);
    }
};

export const getFirebaseConfig = (): FirebaseConfig | null => {
    try {
        // Intentamos leer de localStorage por si el usuario quiso sobreescribir la config
        const stored = localStorage.getItem(FIREBASE_CONFIG_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        // Si no hay nada en localStorage, devolvemos la configuración por defecto
        return DEFAULT_FIREBASE_CONFIG;
    } catch (error) {
        console.error("Failed to retrieve Firebase config from localStorage", error);
        return DEFAULT_FIREBASE_CONFIG;
    }
};

export const isFirebaseConfigured = (): boolean => {
    // Como tenemos una configuración por defecto, siempre devolvemos true
    return true;
};

export const clearFirebaseConfig = (): void => {
    try {
        localStorage.removeItem(FIREBASE_CONFIG_KEY);
    } catch (error) {
        console.error("Failed to clear Firebase config from localStorage", error);
    }
};
