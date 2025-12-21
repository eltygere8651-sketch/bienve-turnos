
export const API_KEYS_STORAGE_KEY = 'bienve_cloud_config_v3';

export interface ApiKeys {
    clientId: string;
    apiKey: string;
}

export const saveApiKeys = (keys: ApiKeys): void => {
    try {
        if (!keys.apiKey || keys.apiKey.trim() === '') return;
        
        // Guardamos tanto en el objeto estándar como en un backup por si acaso
        const data = JSON.stringify(keys);
        localStorage.setItem(API_KEYS_STORAGE_KEY, data);
        localStorage.setItem(API_KEYS_STORAGE_KEY + '_backup', data);
        
        console.log("Configuración de nube guardada con éxito.");
    } catch (error) {
        console.error("Error al guardar configuración en el dispositivo:", error);
    }
};

export const getApiKeys = (): ApiKeys | null => {
    try {
        let storedKeys = localStorage.getItem(API_KEYS_STORAGE_KEY);
        
        // Si falló la principal, intentamos el backup
        if (!storedKeys) {
            storedKeys = localStorage.getItem(API_KEYS_STORAGE_KEY + '_backup');
        }

        if (storedKeys) {
            const parsed = JSON.parse(storedKeys);
            // Verificación estricta de que contiene datos de Firebase
            if (parsed && parsed.apiKey && (parsed.apiKey.includes('projectId') || parsed.apiKey.includes('apiKey'))) {
                return parsed;
            }
        }
    } catch (error) {
        console.error("Error al recuperar configuración del dispositivo:", error);
    }
    return null;
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
