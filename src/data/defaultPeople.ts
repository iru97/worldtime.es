import type { Person } from '@/types';

export const defaultPeople: Person[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    timezone: 'America/New_York',
    currentTime: new Date().toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour12: false,
    }),
    currentDate: new Date().toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  },
  {
    id: '2',
    name: 'Alex Chen',
    timezone: 'Asia/Tokyo',
    currentTime: new Date().toLocaleTimeString('en-US', {
      timeZone: 'Asia/Tokyo',
      hour12: false,
    }),
    currentDate: new Date().toLocaleDateString('en-US', {
      timeZone: 'Asia/Tokyo',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  }
];