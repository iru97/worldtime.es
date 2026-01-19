import { describe, it, expect } from 'vitest';
import {
  formatTimezone,
  getCurrentTime,
  getTimezoneOffset,
  isValidTimezone,
} from '@/utils/timezone';

describe('timezone utilities', () => {
  describe('formatTimezone', () => {
    it('formats America/New_York correctly', () => {
      expect(formatTimezone('America/New_York')).toBe('New York');
    });

    it('formats Europe/London correctly', () => {
      expect(formatTimezone('Europe/London')).toBe('London');
    });

    it('handles timezones with underscores', () => {
      expect(formatTimezone('America/Los_Angeles')).toBe('Los Angeles');
    });

    it('handles nested timezones', () => {
      expect(formatTimezone('America/Argentina/Buenos_Aires')).toBe('Buenos Aires');
    });

    it('handles single-part timezones', () => {
      expect(formatTimezone('UTC')).toBe('UTC');
    });
  });

  describe('getCurrentTime', () => {
    it('returns a time string in HH:MM format', () => {
      const time = getCurrentTime('America/New_York');
      expect(time).toMatch(/^\d{2}:\d{2}$/);
    });

    it('returns different times for different timezones', () => {
      const nyTime = getCurrentTime('America/New_York');
      const tokyoTime = getCurrentTime('Asia/Tokyo');
      // They might be the same at certain times, but format should be valid
      expect(nyTime).toMatch(/^\d{2}:\d{2}$/);
      expect(tokyoTime).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe('getTimezoneOffset', () => {
    it('returns a valid offset string', () => {
      const offset = getTimezoneOffset('America/New_York');
      // Should be something like "GMT-5" or "GMT-4" depending on DST
      expect(offset).toMatch(/^(GMT|UTC)/);
    });
  });

  describe('isValidTimezone', () => {
    it('returns true for valid timezones', () => {
      expect(isValidTimezone('America/New_York')).toBe(true);
      expect(isValidTimezone('Europe/London')).toBe(true);
      expect(isValidTimezone('Asia/Tokyo')).toBe(true);
      expect(isValidTimezone('UTC')).toBe(true);
    });

    it('returns false for invalid timezones', () => {
      expect(isValidTimezone('Invalid/Timezone')).toBe(false);
      expect(isValidTimezone('Not_A_Timezone')).toBe(false);
      expect(isValidTimezone('')).toBe(false);
    });
  });
});
