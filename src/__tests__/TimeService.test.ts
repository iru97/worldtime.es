import { describe, it, expect, beforeEach } from 'vitest';
import { TimeService } from '@/services/TimeService';

describe('TimeService', () => {
  let timeService: TimeService;

  beforeEach(() => {
    timeService = new TimeService();
  });

  describe('formatTime', () => {
    it('formats time in the correct timezone', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const formatted = timeService.formatTime(date, 'UTC');
      expect(formatted).toBe('12:00');
    });

    it('handles different timezones', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const nyFormatted = timeService.formatTime(date, 'America/New_York');
      const utcFormatted = timeService.formatTime(date, 'UTC');
      // NY is UTC-5 in January (standard time)
      expect(nyFormatted).not.toBe(utcFormatted);
    });
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const formatted = timeService.formatDate(date, 'UTC');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('January');
    });
  });

  describe('getTimezones', () => {
    it('returns an array of timezones', () => {
      const timezones = timeService.getTimezones();
      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones.length).toBeGreaterThan(0);
    });

    it('includes common timezones', () => {
      const timezones = timeService.getTimezones();
      expect(timezones).toContain('America/New_York');
      expect(timezones).toContain('Europe/London');
      expect(timezones).toContain('Asia/Tokyo');
    });
  });

  describe('getDateInTimezone', () => {
    it('returns a Date object', () => {
      const result = timeService.getDateInTimezone(new Date(), 'America/New_York');
      expect(result).toBeInstanceOf(Date);
    });

    it('returns valid date values', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = timeService.getDateInTimezone(date, 'UTC');
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(5); // June is month 5 (0-indexed)
      expect(result.getDate()).toBe(15);
    });
  });
});
