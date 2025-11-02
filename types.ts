
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

export interface DriveUser {
    name: string;
    email: string;
    picture: string;
}
