import { Schedule, DriveUser } from '../types';

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
            }

            interface TokenClient {
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
    function load(api: 'client', callback: () => void): void;
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


const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const API_KEY = process.env.API_KEY; // For GAPI discovery
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

const FILENAME = 'bienve-app-schedule.json';

// Always set to true to show the UI, but gate actual functionality on hasCredentials().
export const isDriveConfigured = true;

// New function to check if credentials are actually provided.
export const hasCredentials = () => !!GOOGLE_CLIENT_ID && !!API_KEY;


let tokenClient: google.accounts.oauth2.TokenClient | null = null;

interface GapiFile {
    id: string;
    name: string;
}

/**
 * Initializes the Google API client and Google Identity Services client.
 * Handles token management and user authentication state.
 */
export async function initClient(onTokenResponseCallback: (tokenResponse: google.accounts.oauth2.TokenResponse) => void) {
    if (!hasCredentials()) {
        console.warn("Google Drive Sync is in demo mode because GOOGLE_CLIENT_ID and/or API_KEY are not configured.");
        return;
    }

    await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
            if (window.gapi && window.google) {
                clearInterval(interval);
                resolve();
            }
        }, 100);
    });

    await new Promise<void>((resolve, reject) => {
        gapi.load('client', () => {
            gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: [DISCOVERY_DOC],
            }).then(resolve).catch(reject);
        });
    });

    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
                 gapi.client.setToken({ access_token: tokenResponse.access_token, id_token: tokenResponse.id_token });
                 onTokenResponseCallback(tokenResponse);
            }
        },
    });
}

export function signIn() {
    if (tokenClient) {
        // By not providing a prompt, the Google Identity Service will determine the best user experience.
        // It will only show a popup if the user is not signed in or has not previously granted consent.
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

async function getFileId(): Promise<string | null> {
    const response = await gapi.client.drive.files.list({
        spaces: 'appDataFolder',
        fields: 'files(id, name)',
        pageSize: 10
    });
    const files = response.result.files;
    const existingFile = files?.find((file: GapiFile) => file.name === FILENAME);
    return existingFile ? existingFile.id : null;
}

export async function getSchedule(): Promise<Schedule | null> {
    const fileId = await getFileId();
    if (!fileId) {
        return null;
    }

    const response = await gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
    });

    const scheduleData = JSON.parse(response.body);
    Object.keys(scheduleData).forEach(weekId => {
        scheduleData[weekId] = scheduleData[weekId].map((day: any) => ({
            ...day,
            date: new Date(day.date),
        }));
    });
    return scheduleData;
}

export async function saveSchedule(schedule: Schedule): Promise<void> {
    const fileId = await getFileId();
    const content = JSON.stringify(schedule);
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
        const errorBody = await res.json();
        throw new Error(`Failed to save to Google Drive: ${errorBody.error.message}`);
    }
}