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
  time_format?: '12h' | '24h';
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
  working_hours_start?: number;
  working_hours_end?: number;
  group_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactGroup {
  id: string;
  user_id: string;
  name: string;
  color?: string;
  created_at: string;
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

export interface UserPreferences {
  timeFormat: '12h' | '24h';
  language: string;
  timezone: string;
}

export interface MeetingTimeSlot {
  hour: number;
  score: number;
  allWorking: boolean;
  participants: {
    id: string;
    name: string;
    localHour: number;
    status: 'working' | 'free' | 'sleeping';
  }[];
}
