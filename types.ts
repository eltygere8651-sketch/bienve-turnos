
export enum DayStatus {
  Work,
  Holiday,
  Vacation,
}

export interface Day {
  date: Date;
  shift: string; // e.g., "12-16 20-23" or "14-C"
  status: DayStatus;
}

export interface Schedule {
  [weekId: string]: Day[]; // weekId is "YYYY-WW"
}

export interface FirebaseUser {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
}

export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}

export interface DriveUser {
    name: string;
    email: string;
    picture: string;
}

export interface DriveScheduleData {
    schedule: Schedule;
}

export interface CustomPeriodPdfData {
    periodDays: Day[];
    startDate: Date;
    endDate: Date;
    totalHours: number;
    overtimeHours: number;
}
