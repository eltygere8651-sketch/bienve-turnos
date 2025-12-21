
import { initializeApp, getApps, deleteApp, FirebaseApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    onSnapshot, 
    Firestore,
    Unsubscribe
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { 
    getAuth, 
    signInAnonymously,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { Schedule } from '../types';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: any = null;

export const initFirestore = async (config: any) => {
    try {
        if (!config || !config.apiKey) return false;
        
        const existingApps = getApps();
        for (const existingApp of existingApps) {
            await deleteApp(existingApp);
        }
        
        app = initializeApp(config);
        db = getFirestore(app);
        auth = getAuth(app);
        
        // Esperar a que la autenticación anónima se complete
        await signInAnonymously(auth);
        
        return new Promise((resolve) => {
            const unsub = onAuthStateChanged(auth, (user) => {
                if (user) {
                    console.log("Firebase Auth: Usuario identificado anónimamente", user.uid);
                    unsub();
                    resolve(true);
                }
            });
            // Timeout por si la red falla
            setTimeout(() => { unsub(); resolve(true); }, 5000);
        });
    } catch (error) {
        console.error("Error crítico en Firebase:", error);
        return false;
    }
};

const USER_DOC_ID = 'nefta'; 

export const saveScheduleToCloud = async (schedule: Schedule) => {
    if (!db) throw new Error("Base de datos no inicializada");
    try {
        const scheduleRef = doc(db, 'schedules', USER_DOC_ID);
        const serializedSchedule: any = {};
        Object.keys(schedule).forEach(weekId => {
            serializedSchedule[weekId] = schedule[weekId].map(day => ({
                ...day,
                date: day.date instanceof Date ? day.date.toISOString() : day.date
            }));
        });

        await setDoc(scheduleRef, { 
            schedule: serializedSchedule,
            lastModified: new Date().toISOString()
        }, { merge: true });
    } catch (error: any) {
        console.error("Error al guardar en Firestore:", error);
        throw error;
    }
};

export const subscribeToSchedule = (
    onUpdate: (schedule: Schedule) => void,
    onError?: (error: any) => void
): Unsubscribe | null => {
    if (!db) return null;
    
    const scheduleRef = doc(db, 'schedules', USER_DOC_ID);
    
    // onSnapshot se activa inmediatamente. Si el documento no existe, snapshot.exists() será false.
    return onSnapshot(scheduleRef, 
        (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const rawSchedule = data.schedule || {};
                
                const parsedSchedule: Schedule = {};
                Object.keys(rawSchedule).forEach(weekId => {
                    parsedSchedule[weekId] = rawSchedule[weekId].map((day: any) => ({
                        ...day,
                        date: new Date(day.date)
                    }));
                });
                
                onUpdate(parsedSchedule);
            } else {
                // IMPORTANTE: Si el documento no existe (primera vez), 
                // devolvemos un objeto vacío para que la app deje de "pensar".
                console.log("Firestore: El documento no existe todavía (base de datos limpia)");
                onUpdate({});
            }
        },
        (error) => {
            console.error("Error en suscripción de Firestore:", error);
            if (onError) onError(error);
        }
    );
};
