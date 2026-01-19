import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { eventService } from '@/services/api/EventService';
import { useNotificationStore } from './notifications';
import type { CalendarEvent } from '@/types';

export const useEventsStore = defineStore('events', () => {
  // State
  const events = ref<CalendarEvent[]>([]);
  const currentEvent = ref<CalendarEvent | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const dateRange = ref<{ start: string; end: string } | null>(null);

  // Getters
  const hasEvents = computed(() => events.value.length > 0);

  const upcomingEvents = computed(() => {
    const now = new Date().toISOString();
    return events.value
      .filter((e) => e.status === 'confirmed' && e.start_time > now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 10);
  });

  const todayEvents = computed(() => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    return events.value
      .filter(
        (e) =>
          e.status === 'confirmed' &&
          e.start_time >= startOfDay &&
          e.start_time <= endOfDay
      )
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  });

  const eventsByDate = computed(() => {
    const grouped: Record<string, CalendarEvent[]> = {};

    for (const event of events.value) {
      if (event.status === 'cancelled') continue;

      const date = event.start_time.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    }

    // Sort events within each day
    for (const date of Object.keys(grouped)) {
      grouped[date].sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    }

    return grouped;
  });

  // Actions
  async function fetchEvents(startDate?: string, endDate?: string) {
    loading.value = true;
    error.value = null;

    try {
      const result = await eventService.getEvents(startDate, endDate);
      if (result.success && result.data) {
        events.value = result.data.data;
        if (startDate && endDate) {
          dateRange.value = { start: startDate, end: endDate };
        }
      } else {
        error.value = result.error?.message || 'Failed to fetch events';
      }
    } finally {
      loading.value = false;
    }
  }

  async function fetchEventsInRange(startDate: string, endDate: string) {
    loading.value = true;
    error.value = null;

    try {
      const result = await eventService.getEventsInRange(startDate, endDate);
      if (result.success && result.data) {
        events.value = result.data;
        dateRange.value = { start: startDate, end: endDate };
      } else {
        error.value = result.error?.message || 'Failed to fetch events';
      }
    } finally {
      loading.value = false;
    }
  }

  async function fetchUpcoming(limit: number = 10) {
    loading.value = true;

    try {
      const result = await eventService.getUpcomingEvents(limit);
      if (result.success && result.data) {
        // Merge with existing events, avoiding duplicates
        const existingIds = new Set(events.value.map((e) => e.id));
        const newEvents = result.data.filter((e) => !existingIds.has(e.id));
        events.value = [...events.value, ...newEvents];
      }
    } finally {
      loading.value = false;
    }
  }

  async function createEvent(data: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    const notifications = useNotificationStore();
    loading.value = true;

    try {
      const result = await eventService.createEvent(data);
      if (result.success && result.data) {
        events.value.push(result.data);
        // Sort by start time
        events.value.sort(
          (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );
        notifications.success('Event created successfully');
        return result.data;
      } else {
        notifications.error(result.error?.message || 'Failed to create event');
        return null;
      }
    } finally {
      loading.value = false;
    }
  }

  async function updateEvent(
    id: string,
    data: Partial<CalendarEvent>
  ): Promise<CalendarEvent | null> {
    const notifications = useNotificationStore();

    try {
      const result = await eventService.updateEvent(id, data);
      if (result.success && result.data) {
        const index = events.value.findIndex((e) => e.id === id);
        if (index >= 0) {
          events.value[index] = result.data;
        }
        if (currentEvent.value?.id === id) {
          currentEvent.value = result.data;
        }
        // Re-sort
        events.value.sort(
          (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );
        notifications.success('Event updated successfully');
        return result.data;
      } else {
        notifications.error(result.error?.message || 'Failed to update event');
        return null;
      }
    } catch {
      notifications.error('Failed to update event');
      return null;
    }
  }

  async function deleteEvent(id: string): Promise<boolean> {
    const notifications = useNotificationStore();

    try {
      const result = await eventService.deleteEvent(id);
      if (result.success) {
        events.value = events.value.filter((e) => e.id !== id);
        if (currentEvent.value?.id === id) {
          currentEvent.value = null;
        }
        notifications.success('Event deleted successfully');
        return true;
      } else {
        notifications.error(result.error?.message || 'Failed to delete event');
        return false;
      }
    } catch {
      notifications.error('Failed to delete event');
      return false;
    }
  }

  async function cancelEvent(id: string): Promise<boolean> {
    const notifications = useNotificationStore();

    try {
      const result = await eventService.cancelEvent(id);
      if (result.success && result.data) {
        const index = events.value.findIndex((e) => e.id === id);
        if (index >= 0) {
          events.value[index] = result.data;
        }
        notifications.success('Event cancelled');
        return true;
      } else {
        notifications.error(result.error?.message || 'Failed to cancel event');
        return false;
      }
    } catch {
      notifications.error('Failed to cancel event');
      return false;
    }
  }

  async function checkConflicts(
    startTime: string,
    endTime: string,
    excludeEventId?: string
  ): Promise<CalendarEvent[]> {
    try {
      const result = await eventService.checkConflicts(startTime, endTime, excludeEventId);
      if (result.success && result.data) {
        return result.data;
      }
      return [];
    } catch {
      return [];
    }
  }

  function selectEvent(event: CalendarEvent | null) {
    currentEvent.value = event;
  }

  function getEventById(id: string): CalendarEvent | undefined {
    return events.value.find((e) => e.id === id);
  }

  function getEventsForDate(date: string): CalendarEvent[] {
    return eventsByDate.value[date] || [];
  }

  function clearEvents() {
    events.value = [];
    currentEvent.value = null;
    dateRange.value = null;
    error.value = null;
  }

  return {
    // State
    events,
    currentEvent,
    loading,
    error,
    dateRange,

    // Getters
    hasEvents,
    upcomingEvents,
    todayEvents,
    eventsByDate,

    // Actions
    fetchEvents,
    fetchEventsInRange,
    fetchUpcoming,
    createEvent,
    updateEvent,
    deleteEvent,
    cancelEvent,
    checkConflicts,
    selectEvent,
    getEventById,
    getEventsForDate,
    clearEvents,
  };
});
