import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { googleCalendarService } from '@/services/api';
import { useNotificationStore } from './notifications';
import type { CalendarConnection, ExternalCalendar, CalendarEvent, FreeBusySlot } from '@/types';

export const useCalendarStore = defineStore('calendar', () => {
  const notificationStore = useNotificationStore();

  // State
  const connection = ref<CalendarConnection | null>(null);
  const calendars = ref<ExternalCalendar[]>([]);
  const events = ref<CalendarEvent[]>([]);
  const busySlots = ref<FreeBusySlot[]>([]);
  const loading = ref(false);
  const syncing = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isConnected = computed(() => !!connection.value);
  const primaryCalendar = computed(() => calendars.value.find((c) => c.is_primary));

  // Actions
  async function fetchConnection() {
    loading.value = true;
    error.value = null;

    const result = await googleCalendarService.getConnection();

    if (result.success) {
      connection.value = result.data;
    } else if (result.error?.code !== 'PGRST116') {
      // Ignore "not found" errors
      error.value = result.error?.message || 'Failed to fetch calendar connection';
    }

    loading.value = false;
    return result;
  }

  function getAuthorizationUrl(): string {
    const state = JSON.stringify({
      provider: 'google',
      redirect_url: window.location.href,
      timestamp: Date.now(),
    });
    return googleCalendarService.getAuthorizationUrl(btoa(state));
  }

  async function handleOAuthCallback(code: string) {
    loading.value = true;
    error.value = null;

    // Exchange code for tokens
    const tokenResult = await googleCalendarService.exchangeCodeForTokens(code);

    if (!tokenResult.success || !tokenResult.data) {
      error.value = tokenResult.error?.message || 'Failed to exchange code for tokens';
      notificationStore.add('error', error.value);
      loading.value = false;
      return tokenResult;
    }

    // Save connection
    const saveResult = await googleCalendarService.saveConnection(
      tokenResult.data,
      'google-user', // Would get this from userinfo endpoint in production
      'primary',
      'Primary Calendar'
    );

    if (saveResult.success && saveResult.data) {
      connection.value = saveResult.data;
      notificationStore.add('success', 'Google Calendar connected');

      // Fetch calendars
      await fetchCalendars();
    } else {
      error.value = saveResult.error?.message || 'Failed to save calendar connection';
      notificationStore.add('error', error.value);
    }

    loading.value = false;
    return saveResult;
  }

  async function fetchCalendars() {
    if (!connection.value) return { success: false, error: { code: 'NO_CONNECTION', message: 'Not connected' } };

    const result = await googleCalendarService.listCalendars(connection.value);

    if (result.success && result.data) {
      calendars.value = result.data;
    } else {
      notificationStore.add('error', result.error?.message || 'Failed to fetch calendars');
    }

    return result;
  }

  async function fetchFreeBusy(startDate: Date, endDate: Date, calendarIds?: string[]) {
    if (!connection.value) return { success: false, error: { code: 'NO_CONNECTION', message: 'Not connected' } };

    const ids = calendarIds || [connection.value.calendar_id || 'primary'];

    const result = await googleCalendarService.getFreeBusy(
      connection.value,
      ids,
      startDate.toISOString(),
      endDate.toISOString()
    );

    if (result.success && result.data) {
      busySlots.value = result.data;
    }

    return result;
  }

  async function fetchEvents(startDate: Date, endDate: Date, calendarId?: string) {
    if (!connection.value) return { success: false, error: { code: 'NO_CONNECTION', message: 'Not connected' } };

    syncing.value = true;

    const result = await googleCalendarService.fetchEvents(
      connection.value,
      calendarId || connection.value.calendar_id || 'primary',
      startDate.toISOString(),
      endDate.toISOString()
    );

    if (result.success && result.data) {
      events.value = result.data;
    } else {
      notificationStore.add('error', result.error?.message || 'Failed to fetch events');
    }

    syncing.value = false;
    return result;
  }

  async function createEvent(event: Partial<CalendarEvent>, calendarId?: string) {
    if (!connection.value) return { success: false, error: { code: 'NO_CONNECTION', message: 'Not connected' } };

    const result = await googleCalendarService.createEvent(
      connection.value,
      calendarId || connection.value.calendar_id || 'primary',
      event
    );

    if (result.success) {
      notificationStore.add('success', 'Event created');
      // Refresh events
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await fetchEvents(now, endDate);
    } else {
      notificationStore.add('error', result.error?.message || 'Failed to create event');
    }

    return result;
  }

  async function disconnect() {
    loading.value = true;

    const result = await googleCalendarService.disconnect();

    if (result.success) {
      connection.value = null;
      calendars.value = [];
      events.value = [];
      busySlots.value = [];
      notificationStore.add('success', 'Calendar disconnected');
    } else {
      notificationStore.add('error', result.error?.message || 'Failed to disconnect');
    }

    loading.value = false;
    return result;
  }

  return {
    // State
    connection,
    calendars,
    events,
    busySlots,
    loading,
    syncing,
    error,

    // Getters
    isConnected,
    primaryCalendar,

    // Actions
    fetchConnection,
    getAuthorizationUrl,
    handleOAuthCallback,
    fetchCalendars,
    fetchFreeBusy,
    fetchEvents,
    createEvent,
    disconnect,
  };
});
