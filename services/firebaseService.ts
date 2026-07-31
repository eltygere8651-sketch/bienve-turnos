
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, Auth, User, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, Firestore, enableIndexedDbPersistence, getDocFromServer } from 'firebase/firestore';
import { FirebaseConfig, Schedule } from '../types';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const initFirebase = (config: FirebaseConfig) => {
    if (app) return; // Already initialized
    try {
        app = initializeApp(config);
        auth = getAuth(app);
        // Use firestoreDatabaseId if provided
        db = config.firestoreDatabaseId ? getFirestore(app, config.firestoreDatabaseId) : getFirestore(app);
        
        // Habilitar persistencia offline para móviles
        enableIndexedDbPersistence(db).catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('Persistencia fallida: Múltiples pestañas abiertas.');
            } else if (err.code === 'unimplemented') {
                console.warn('El navegador actual no soporta persistencia offline.');
            }
        });

        console.log("Firebase initialized successfully with persistence");
    } catch (error) {
        console.error("Error initializing Firebase:", error);
        throw error;
    }
};

export const loginWithGoogle = async () => {
    if (!auth) throw new Error("Firebase not initialized");
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error: any) {
        console.error("Error signing in with Google:", error);
        
        let errorMessage = "Error al iniciar sesión con Google.";
        
        if (error.code === 'auth/unauthorized-domain') {
            const domain = window.location.hostname;
            errorMessage = `⚠️ DOMINIO NO AUTORIZADO (${domain})\n\nTu aplicación se está ejecutando en '${domain}', pero este dominio no está permitido en Firebase.\n\nSOLUCIÓN:\n1. Ve a console.firebase.google.com\n2. Selecciona tu proyecto\n3. Ve a Authentication > Settings > Authorized Domains\n4. Añade: ${domain}`;
        } else if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = "Has cerrado la ventana de inicio de sesión antes de terminar.";
        } else if (error.code === 'auth/operation-not-allowed') {
            errorMessage = "⚠️ El inicio de sesión con Google no está habilitado.\n\nSOLUCIÓN:\n1. Ve a Firebase Console > Authentication > Sign-in method\n2. Habilita el proveedor 'Google'.";
        } else if (error.message) {
            errorMessage = error.message;
        }

        throw new Error(errorMessage);
    }
};

export const logoutUser = async () => {
    if (!auth) return;
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out:", error);
    }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    if (!auth) return () => {};
    return onAuthStateChanged(auth, callback);
};

// Firestore Logic

export const saveScheduleToFirestore = async (userId: string, schedule: Schedule) => {
    if (!db) throw new Error("Base de datos no inicializada");
    const path = `users/${userId}`;
    try {
        // Guardamos el horario como string JSON. Firestore maneja la sincronización.
        await setDoc(doc(db, "users", userId), {
            schedule: JSON.stringify(schedule),
            lastUpdated: new Date()
        }, { merge: true });
        
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
};

export const fetchScheduleFromFirestore = async (userId: string): Promise<Schedule | null> => {
    if (!db) return null;
    const path = `users/${userId}`;
    try {
        const userDocRef = doc(db, "users", userId);
        const docSnapshot = await getDoc(userDocRef);
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            if (data && data.schedule) {
                const parsedSchedule = JSON.parse(data.schedule);
                const rehydratedSchedule: Schedule = {};
                for (const weekId in parsedSchedule) {
                    rehydratedSchedule[weekId] = parsedSchedule[weekId].map((day: any) => ({
                        ...day,
                        date: new Date(day.date)
                    }));
                }
                return rehydratedSchedule;
            }
        }
        return null;
    } catch (error: any) {
        handleFirestoreError(error, OperationType.GET, path);
        return null;
    }
};

export const migrateNeftaSchedule = async (userId: string): Promise<Schedule | null> => {
    if (!db) return null;
    try {
        const neftaDocRef = doc(db, "users", "nefta");
        const neftaDoc = await getDoc(neftaDocRef);
        if (neftaDoc.exists()) {
            const data = neftaDoc.data();
            if (data && data.schedule) {
                const parsedSchedule = JSON.parse(data.schedule);
                const rehydratedSchedule: Schedule = {};
                for (const weekId in parsedSchedule) {
                    rehydratedSchedule[weekId] = parsedSchedule[weekId].map((day: any) => ({
                        ...day,
                        date: new Date(day.date)
                    }));
                }
                // Save it to the new user
                await saveScheduleToFirestore(userId, rehydratedSchedule);
                return rehydratedSchedule;
            }
        }
    } catch (error) {
        console.error("Error during nefta migration:", error);
    }
    return null;
};

export const subscribeToSchedule = (userId: string, onUpdate: (schedule: Schedule) => void, onEmpty?: () => void) => {
    if (!db) return () => {};
    
    const path = `users/${userId}`;
    const userDocRef = doc(db, "users", userId);
    
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            if (data && data.schedule) {
                try {
                    const parsedSchedule = JSON.parse(data.schedule);
                    // Re-hidratar fechas
                    Object.keys(parsedSchedule).forEach(weekId => {
                        parsedSchedule[weekId] = parsedSchedule[weekId].map((day: any) => ({
                            ...day,
                            date: new Date(day.date),
                        }));
                    });
                    onUpdate(parsedSchedule);
                } catch (e) {
                    console.error("Error parsing schedule from Firestore:", e);
                }
            } else if (onEmpty) {
                onEmpty();
            }
        } else if (onEmpty) {
            onEmpty();
        }
    }, (error) => {
        handleFirestoreError(error, OperationType.GET, path);
    });

    return unsubscribe;
};

export const testFirestoreConnection = async (userId: string) => {
    if (!db) throw new Error("Firebase no inicializado");
    const path = `users/${userId}`;
    try {
        // Test connection by fetching from server
        try {
            await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (error) {
            if (error instanceof Error && error.message.includes('the client is offline')) {
                console.error("Please check your Firebase configuration.");
                throw new Error("⚠️ ERROR DE CONFIGURACIÓN\n\nEl cliente está offline. Revisa tu configuración de Firebase.");
            }
            // Skip logging for other errors, as this is simply a connection test.
        }

        const userDocRef = doc(db, "users", userId);
        // Escribimos un campo simple de timestamp para verificar permisos y conexión
        await setDoc(userDocRef, { lastConnectionCheck: new Date().toISOString() }, { merge: true });
        return true;
    } catch (error: any) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
};
