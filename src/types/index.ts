export interface Person {
  id: string;
  name: string;
  timezone: string;
  currentTime: string;
  currentDate: string;
}

export interface User {
  id: string;
  email: string;
  timezone: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  timezone: string;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface ContactAvailability {
  timezone: string;
  workingHours: TimeRange;
  sleepingHours: TimeRange;
}

export interface TimeFormat extends Intl.DateTimeFormatOptions {
  timeZone: string;
  hour12: boolean;
}

export interface DateFormat extends Intl.DateTimeFormatOptions {
  timeZone: string;
  hour12: boolean;
}