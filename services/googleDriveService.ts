import { DriveUser, DriveScheduleData } from '../types';

// Add type declarations for Google Sign-In and Google Drive APIs.
// These are loaded globally from script tags, so we need to inform TypeScript about their existence and shape.
declare namespace google {
    namespace accounts {
        namespace id {
            function initialize(config: { client_id: string | undefined; callback: (response: any) => void; }): void;
            function prompt(): void;
            function renderButton(parent: HTMLElement, options: { theme: string; size: string; }): void;
        }
        namespace oauth2 {
            interface TokenResponse {
                access_token: string;
                id_token: string; // This is the JWT
                error?: any;
            }

            interface TokenClient {
                callback?: (tokenResponse: TokenResponse) => void;
                requestAccessToken(options?: { prompt: string }): void;
            }

            function initTokenClient(config: {
                client_id: string | undefined;
                scope: string;
                callback: (tokenResponse: TokenResponse) => void;
            }): TokenClient;

            function revoke(accessToken: string, done: () => void): void;
        }
    }
}

declare namespace gapi {
    // FIX: Updated the gapi.load type declaration to support a configuration object.
    // This allows for more robust error handling with onerror and ontimeout callbacks,
    // helping to diagnose initialization issues.
    function load(api: 'client', config: (() => void) | {
        callback: () => void;
        onerror?: (error: any) => void;
        timeout?: number;
        ontimeout?: () => void;
    }): void;
    namespace client {
        function init(args: {
            apiKey: string | undefined;
            discoveryDocs: string[];
        }): Promise<void>;

        function getToken(): { access_token: string; id_token: string } | null;

        function setToken(token: { access_token: string; id_token: string } | null): void;

        const drive: {
            files: {
                list(args: {
                    spaces: string;
                    fields: string;
                    pageSize: number;
                }): Promise<{ result: { files?: GapiFile[] } }>;

                get(args: { fileId: string; alt: 'media' }): Promise<{ body: string }>;
            };
        };
    }
}

// Declare gapi and google on the window object to inform TypeScript
// that they are loaded globally from external scripts.
declare global {
    interface Window {
        gapi: typeof gapi;
        google: typeof google;
    }
}


const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

const FILENAME = 'bienve-app-schedule.json';

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let tokenRefreshPromise: Promise<google.accounts.oauth2.TokenResponse> | null = null;


interface GapiFile {
    id: string;
    name: string;
}

const waitForGoogleScripts = (timeout = 10000): Promise<void> => {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            clearInterval(interval);
            reject(new Error("Los scripts de la API de Google no se cargaron a tiempo. Revisa tu conexión a internet o bloqueadores de anuncios."));
        }, timeout);

        const interval = setInterval(() => {
            if (window.gapi && window.google) {
                clearInterval(interval);
                clearTimeout(timeoutId);
                resolve();
            }
        }, 100);
    });
};


/**
 * Initializes the Google API client and Google Identity Services client.
 * Handles token management and user authentication state.
 */
export async function initClient(
    clientId: string,
    apiKey: string,
    onTokenResponseCallback: (tokenResponse: google.accounts.oauth2.TokenResponse) => void
): Promise<boolean> {
    if (!clientId || !apiKey) {
        console.log("Google Drive sync is disabled because API keys are not configured.");
        return false;
    }
    
    try {
        await waitForGoogleScripts();

        await new Promise<void>((resolve, reject) => {
            // FIX: Replaced the simple gapi.load callback with a more robust configuration object.
            // This adds explicit error and timeout handling for loading the Google Drive client library,
            // which helps diagnose initialization failures like the "API discovery response missing" error.
            gapi.load('client', {
                callback: () => {
                    gapi.client.init({
                        apiKey: apiKey,
                        discoveryDocs: [DISCOVERY_DOC],
                    }).then(resolve).catch(err => {
                        console.error("Error al inicializar el cliente GAPI:", err);
                        reject(new Error("No se pudo inicializar el cliente de Google Drive."));
                    });
                },
                onerror: (err) => {
                    console.error("Error al cargar el cliente GAPI:", err);
                    reject(new Error("No se pudo cargar el cliente de GAPI. Revisa tu conexión o bloqueadores de anuncios."));
                },
                timeout: 10000,
                ontimeout: () => {
                    console.error("Timeout al cargar el cliente GAPI.");
                    reject(new Error("La carga del cliente de GAPI tardó demasiado. Revisa tu conexión a internet."));
                }
            });
        });

        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                     gapi.client.setToken({ access_token: tokenResponse.access_token, id_token: tokenResponse.id_token });
                     onTokenResponseCallback(tokenResponse);
                } else if (tokenResponse && tokenResponse.error) {
                    console.error("Error de autenticación de Google:", tokenResponse);
                }
            },
        });
        return true; // Indicate success
    } catch(error) {
        console.error("Error durante la inicialización del servicio de Google Drive:", error);
        throw error; // Propagate other errors to UI
    }
}

export function signIn() {
    if (tokenClient) {
        // By not providing a prompt, the Google Identity Service will determine the best user experience.
        // It will only show a popup if the user is not signed in or has not previously granted consent.
        // FIX: The `requestAccessToken` method should be called without arguments for default behavior,
        // rather than with an empty object, which violates the type signature.
        tokenClient.requestAccessToken();
    }
}

export function signOut() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {});
        gapi.client.setToken(null);
    }
}

export function getProfile(): DriveUser | null {
    const token = gapi.client.getToken();
    if (token && token.id_token) {
        try {
            const payload = JSON.parse(atob(token.id_token.split('.')[1]));
            return {
                name: payload.name,
                email: payload.email,
                picture: payload.picture,
            };
        } catch (e) {
            console.error('Error decoding token:', e);
            return null;
        }
    }
    return null;
}

function refreshToken(): Promise<google.accounts.oauth2.TokenResponse> {
    if (tokenRefreshPromise) {
        return tokenRefreshPromise;
    }

    tokenRefreshPromise = new Promise((resolve, reject) => {
        if (!tokenClient) {
            return reject(new Error("Drive client not initialized. Cannot refresh token."));
        }

        const originalCallback = tokenClient.callback;

        // Temporarily override callback to resolve this promise
        if(tokenClient) {
            tokenClient.callback = (tokenResponse) => {
                if (tokenClient) tokenClient.callback = originalCallback; // Restore original callback
                if (originalCallback) originalCallback(tokenResponse); // Execute original logic

                if (tokenResponse && !tokenResponse.error) {
                    resolve(tokenResponse);
                } else {
                    reject(new Error("Token refresh failed. The user may need to sign in again."));
                }
                tokenRefreshPromise = null; // Reset for future refreshes
            };
        }
        
        // Use `prompt: 'none'` for a true silent refresh attempt.
        tokenClient.requestAccessToken({ prompt: 'none' }); 
    });

    return tokenRefreshPromise;
}

async function callDriveApi<T>(apiFunction: () => Promise<T>): Promise<T> {
  try {
    return await apiFunction();
  } catch (error: any) {
    const isAuthError = (error.result && error.result.error && error.result.error.code === 401) ||
                        (error.status === 401);
    
    if (isAuthError) {
      console.warn("Authentication error detected. Refreshing token...");
      await refreshToken();
      console.log("Token refreshed. Retrying API call.");
      return await apiFunction();
    } else {
      throw error;
    }
  }
}

async function getFileIdInternal(): Promise<string | null> {
    const response = await gapi.client.drive.files.list({
        spaces: 'appDataFolder',
        fields: 'files(id, name)',
        pageSize: 10
    });
    const files = response.result.files;
    const existingFile = files?.find((file: GapiFile) => file.name === FILENAME);
    return existingFile ? existingFile.id : null;
}

export async function getSchedule(): Promise<DriveScheduleData | null> {
    return callDriveApi(async () => {
        const fileId = await getFileIdInternal();
        if (!fileId) {
            return null;
        }

        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        
        if (!response.body) return null;

        const driveData: DriveScheduleData = JSON.parse(response.body);

        // Re-hydrate date objects after parsing from JSON
        if (driveData && driveData.schedule) {
            Object.keys(driveData.schedule).forEach(weekId => {
                driveData.schedule[weekId] = driveData.schedule[weekId].map((day: any) => ({
                    ...day,
                    date: new Date(day.date),
                }));
            });
        }
        return driveData;
    });
}

async function saveScheduleInternal(scheduleData: DriveScheduleData): Promise<void> {
    const fileId = await getFileIdInternal();
    const content = JSON.stringify(scheduleData);
    const blob = new Blob([content], { type: 'application/json' });

    const metadata = {
        name: FILENAME,
        mimeType: 'application/json',
        parents: fileId ? undefined : ['appDataFolder']
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);

    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files${fileId ? `/${fileId}` : ''}?uploadType=multipart`;
    const method = fileId ? 'PATCH' : 'POST';

    const token = gapi.client.getToken();
    if (!token) {
        throw new Error("Cannot save schedule: user not authenticated.");
    }

    const res = await fetch(uploadUrl, {
        method,
        headers: new Headers({ 'Authorization': `Bearer ${token.access_token}` }),
        body: form
    });
    
    if (!res.ok) {
        if (res.status === 401) {
            throw res;
        }
        const errorBody = await res.json();
        throw new Error(`Failed to save to Google Drive: ${errorBody.error.message}`);
    }
}

export async function saveSchedule(scheduleData: DriveScheduleData): Promise<void> {
    await callDriveApi(() => saveScheduleInternal(scheduleData));
}