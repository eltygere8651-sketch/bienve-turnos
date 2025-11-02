import { Schedule, DriveUser } from '../types';

// FIX: Add type declarations for Google Sign-In and Google Drive APIs.
// These are loaded globally from script tags, so we need to inform TypeScript about their existence and shape.
declare namespace google {
    namespace accounts {
        namespace oauth2 {
            interface TokenResponse {
                access_token: string;
                id_token: string;
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

        function setToken(token: { access_token: string } | null): void;

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

// FIX: Declare gapi and google on the window object to inform TypeScript
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

export const isDriveConfigured = !!GOOGLE_CLIENT_ID;

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let gapiInited = false;
let gisInited = false;

interface GapiFile {
    id: string;
    name: string;
}

/**
 * Initializes the Google API client and Google Identity Services client.
 * Handles token management and user authentication state.
 */
export async function initClient(onTokenResponse: (tokenResponse: google.accounts.oauth2.TokenResponse) => void) {
    if (!isDriveConfigured) {
        console.warn("Google Drive Sync is disabled because GOOGLE_CLIENT_ID is not configured.");
        return;
    }

    // Load GAPI and GIS scripts are loaded via index.html
    // but we wait for them to be ready.
    await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
            if (window.gapi && window.google) {
                clearInterval(interval);
                resolve();
            }
        }, 100);
    });

    // Initialize GAPI client
    await new Promise<void>((resolve, reject) => {
        gapi.load('client', () => {
            gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: [DISCOVERY_DOC],
            }).then(() => {
                gapiInited = true;
                resolve();
            }).catch(reject);
        });
    });

    // Initialize GIS client
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: onTokenResponse,
    });
    gisInited = true;
}

/**
 * Triggers the Google Sign-In flow.
 */
export function signIn() {
    if (tokenClient) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    }
}

/**
 * Signs out the current user.
 */
export function signOut() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {});
        gapi.client.setToken(null);
    }
}

/**
 * Gets the user's profile information.
 */
export function getProfile(): DriveUser | null {
    // This is a workaround as gapi.client.people is not standard.
    // We decode the JWT from the token response to get user info.
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

/**
 * Finds the schedule file in the appDataFolder.
 */
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

/**
 * Retrieves and parses the schedule from Google Drive.
 */
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
     // Convert date strings back to Date objects
    Object.keys(scheduleData).forEach(weekId => {
        scheduleData[weekId] = scheduleData[weekId].map((day: any) => ({
            ...day,
            date: new Date(day.date),
        }));
    });
    return scheduleData;
}

/**
 * Saves the schedule to a file in Google Drive's appDataFolder.
 */
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
        console.error("Cannot save schedule: user not authenticated.");
        return;
    }

    await fetch(uploadUrl, {
        method,
        headers: new Headers({ 'Authorization': `Bearer ${token.access_token}` }),
        body: form
    });
}