
export const API_KEYS_STORAGE_KEY = 'bienve_cloud_config_v3';

export interface ApiKeys {
    clientId: string;
    apiKey: string;
}

/**
 * Intenta obtener la configuración de la nube.
 * Prioridad: Variable de Entorno > LocalStorage > Backup.
 */
export const getApiKeys = (): ApiKeys | null => {
    try {
        // 1. PRIORIDAD ABSOLUTA: Variable de Entorno (Vercel)
        // Esto permite que la app sea automática en producción
        const envConfig = process.env.FIREBASE_CONFIG;
        if (envConfig) {
            // Si es un objeto, lo stringificamos; si es string, lo usamos tal cual
            const configStr = typeof envConfig === 'string' ? envConfig : JSON.stringify(envConfig);
            if (configStr.includes('apiKey') && configStr.includes('projectId')) {
                return {
                    clientId: 'vercel_env',
                    apiKey: configStr
                };
            }
        }

        // 2. Intentar desde LocalStorage principal (configuración manual previa)
        let storedData = localStorage.getItem(API_KEYS_STORAGE_KEY);
        
        // 3. Intentar desde Backup
        if (!storedData) {
            storedData = localStorage.getItem(API_KEYS_STORAGE_KEY + '_backup');
        }

        if (storedData) {
            const parsed = JSON.parse(storedData);
            if (parsed && parsed.apiKey) {
                return parsed;
            }
        }
    } catch (error) {
        console.error("Error al recuperar configuración:", error);
    }
    return null;
};

export const saveApiKeys = (keys: ApiKeys): void => {
    try {
        if (!keys.apiKey || keys.apiKey.trim() === '') return;
        const data = JSON.stringify(keys);
        localStorage.setItem(API_KEYS_STORAGE_KEY, data);
        localStorage.setItem(API_KEYS_STORAGE_KEY + '_backup', data);
    } catch (error) {
        console.error("Error al guardar configuración:", error);
    }
};

export const areKeysSet = (): boolean => {
    return getApiKeys() !== null;
};

export const clearApiKeys = (): void => {
    try {
        localStorage.removeItem(API_KEYS_STORAGE_KEY);
        localStorage.removeItem(API_KEYS_STORAGE_KEY + '_backup');
    } catch (error) {
        console.error("Error al borrar configuración:", error);
    }
};
