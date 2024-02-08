import type { TimeFormat, DateFormat } from '@/types';

export class TimeService {
  formatTime(date: Date, timezone: string, locale: string): string {
    const options: TimeFormat = {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleTimeString(locale, options);
  }

  formatDate(date: Date, timezone: string, locale: string): string {
    const options: DateFormat = {
      timeZone: timezone,
      hour12: false,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString(locale, options);
  }

  getTimezones(): string[] {
    return Intl.supportedValuesOf('timeZone');
  }

  // Nuevo método para obtener la fecha y hora en una zona horaria específica
  getDateInTimezone(date: Date, timezone: string): Date {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const values: Record<string, string> = {};
    parts.forEach(part => {
      if (part.type !== 'literal') {
        values[part.type] = part.value;
      }
    });

    return new Date(
      parseInt(values.year),
      parseInt(values.month) - 1,
      parseInt(values.day),
      parseInt(values.hour),
      parseInt(values.minute),
      parseInt(values.second)
    );
  }
}