import { ref, computed } from 'vue';
import type { Contact, TimeRange } from '@/types';

interface TimeSlot {
  hour: number;
  score: number;
  participantStatuses: {
    contactId: string;
    contactName: string;
    localHour: number;
    status: 'working' | 'free' | 'sleeping';
  }[];
}

interface BestTimeResult {
  slots: TimeSlot[];
  hasOverlap: boolean;
}

const DEFAULT_WORKING_HOURS: TimeRange = { start: 9, end: 17 };
const DEFAULT_SLEEPING_HOURS: TimeRange = { start: 23, end: 7 };

export function useBestTime() {
  const isCalculating = ref(false);
  const results = ref<BestTimeResult | null>(null);

  /**
   * Get the hour offset between UTC and a timezone
   */
  function getTimezoneOffset(timezone: string): number {
    const now = new Date();
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    return Math.round((tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60));
  }

  /**
   * Get status for a given local hour
   */
  function getStatus(
    localHour: number,
    workingHours: TimeRange,
    sleepingHours: TimeRange
  ): 'working' | 'free' | 'sleeping' {
    // Sleeping check (handles overnight)
    if (sleepingHours.start > sleepingHours.end) {
      // e.g., 23 to 7
      if (localHour >= sleepingHours.start || localHour < sleepingHours.end) {
        return 'sleeping';
      }
    } else {
      if (localHour >= sleepingHours.start && localHour < sleepingHours.end) {
        return 'sleeping';
      }
    }

    // Working check
    if (localHour >= workingHours.start && localHour < workingHours.end) {
      return 'working';
    }

    return 'free';
  }

  /**
   * Calculate score for a time slot
   * Higher is better: working=2, free=1, sleeping=0
   */
  function calculateScore(statuses: ('working' | 'free' | 'sleeping')[]): number {
    return statuses.reduce((score, status) => {
      if (status === 'working') return score + 2;
      if (status === 'free') return score + 1;
      return score;
    }, 0);
  }

  /**
   * Find the best meeting times for selected contacts
   */
  function findBestTimes(
    contacts: Contact[],
    referenceTimezone: string = 'UTC',
    durationHours: number = 1
  ): BestTimeResult {
    isCalculating.value = true;

    try {
      const slots: TimeSlot[] = [];
      const refOffset = getTimezoneOffset(referenceTimezone);

      // Check each hour of the day (in reference timezone)
      for (let refHour = 0; refHour < 24; refHour++) {
        const participantStatuses: TimeSlot['participantStatuses'] = [];

        for (const contact of contacts) {
          const contactOffset = getTimezoneOffset(contact.timezone);
          const localHour = (refHour - refOffset + contactOffset + 24) % 24;

          const workingHours: TimeRange = {
            start: contact.working_hours_start ?? DEFAULT_WORKING_HOURS.start,
            end: contact.working_hours_end ?? DEFAULT_WORKING_HOURS.end,
          };

          const status = getStatus(localHour, workingHours, DEFAULT_SLEEPING_HOURS);

          participantStatuses.push({
            contactId: contact.id,
            contactName: contact.name,
            localHour,
            status,
          });
        }

        const statuses = participantStatuses.map((p) => p.status);
        const score = calculateScore(statuses);

        slots.push({
          hour: refHour,
          score,
          participantStatuses,
        });
      }

      // Sort by score (highest first)
      slots.sort((a, b) => b.score - a.score);

      // Check if there's any time where everyone is working
      const hasOverlap = slots.some((slot) =>
        slot.participantStatuses.every((p) => p.status === 'working')
      );

      const result: BestTimeResult = {
        slots: slots.slice(0, 5), // Top 5 slots
        hasOverlap,
      };

      results.value = result;
      return result;
    } finally {
      isCalculating.value = false;
    }
  }

  /**
   * Format hour for display
   */
  function formatHour(hour: number, use24h: boolean = true): string {
    if (use24h) {
      return `${hour.toString().padStart(2, '0')}:00`;
    }
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${period}`;
  }

  /**
   * Get status color class
   */
  function getStatusColor(status: 'working' | 'free' | 'sleeping'): string {
    switch (status) {
      case 'working':
        return 'text-green-500';
      case 'free':
        return 'text-yellow-500';
      case 'sleeping':
        return 'text-indigo-400';
    }
  }

  const topSlot = computed(() => results.value?.slots[0] ?? null);

  return {
    isCalculating,
    results,
    findBestTimes,
    formatHour,
    getStatusColor,
    topSlot,
  };
}
