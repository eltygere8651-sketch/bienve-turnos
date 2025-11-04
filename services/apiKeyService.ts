export const API_KEYS_STORAGE_KEY = 'bienveAppApiKeys';

export interface ApiKeys {
    clientId: string;
    apiKey: string;
}

export const saveApiKeys = (keys: ApiKeys): void => {
    try {
        localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
    } catch (error) {
        console.error("Failed to save API keys to localStorage", error);
    }
};

export const getApiKeys = (): ApiKeys | null => {
    try {
        const storedKeys = localStorage.getItem(API_KEYS_STORAGE_KEY);
        if (storedKeys) {
            const parsed = JSON.parse(storedKeys);
            if (parsed.clientId && parsed.apiKey) {
                return parsed;
            }
        }
        return null;
    } catch (error) {
        console.error("Failed to retrieve API keys from localStorage", error);
        return null;
    }
};

export const areKeysSet = (): boolean => {
    const keys = getApiKeys();
    return !!(keys && keys.clientId && keys.apiKey);
};

export const clearApiKeys = (): void => {
    try {
        localStorage.removeItem(API_KEYS_STORAGE_KEY);
    } catch (error) {
        console.error("Failed to clear API keys from localStorage", error);
    }
};
