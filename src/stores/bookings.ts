import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { bookingService } from '@/services/api';
import { useNotificationStore } from './notifications';
import type { BookingLink, Booking, AvailableSlot, PaginatedResponse } from '@/types';

export const useBookingsStore = defineStore('bookings', () => {
  const notificationStore = useNotificationStore();

  // State
  const bookingLinks = ref<BookingLink[]>([]);
  const bookings = ref<Booking[]>([]);
  const upcomingBookings = ref<Booking[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const stats = ref<{
    total: number;
    upcoming: number;
    completed: number;
    cancelled: number;
    no_shows: number;
  } | null>(null);

  // Getters
  const activeLinks = computed(() => bookingLinks.value.filter((l) => l.is_active));
  const confirmedBookings = computed(() => bookings.value.filter((b) => b.status === 'confirmed'));
  const pendingBookings = computed(() => bookings.value.filter((b) => b.status === 'pending'));

  // Actions
  async function fetchBookingLinks() {
    loading.value = true;
    error.value = null;

    const result = await bookingService.getBookingLinks();

    if (result.success && result.data) {
      bookingLinks.value = result.data;
    } else {
      error.value = result.error?.message || 'Failed to fetch booking links';
      notificationStore.add('error', error.value);
    }

    loading.value = false;
    return result;
  }

  async function createBookingLink(data: Partial<BookingLink>) {
    loading.value = true;
    const result = await bookingService.createBookingLink(data);

    if (result.success && result.data) {
      bookingLinks.value.unshift(result.data);
      notificationStore.add('success', 'Booking link created');
    } else {
      notificationStore.add('error', result.error?.message || 'Failed to create booking link');
    }

    loading.value = false;
    return result;
  }

  async function updateBookingLink(id: string, data: Partial<BookingLink>) {
    const result = await bookingService.updateBookingLink(id, data);

    if (result.success && result.data) {
      const index = bookingLinks.value.findIndex((l) => l.id === id);
      if (index >= 0) {
        bookingLinks.value[index] = result.data;
      }
      notificationStore.add('success', 'Booking link updated');
    } else {
      notificationStore.add('error', result.error?.message || 'Failed to update booking link');
    }

    return result;
  }

  async function deleteBookingLink(id: string) {
    const result = await bookingService.deleteBookingLink(id);

    if (result.success) {
      bookingLinks.value = bookingLinks.value.filter((l) => l.id !== id);
      notificationStore.add('success', 'Booking link deleted');
    } else {
      notificationStore.add('error', result.error?.message || 'Failed to delete booking link');
    }

    return result;
  }

  async function fetchBookings(status?: Booking['status']) {
    loading.value = true;
    error.value = null;

    const result = await bookingService.getBookings(status);

    if (result.success && result.data) {
      bookings.value = result.data.data;
    } else {
      error.value = result.error?.message || 'Failed to fetch bookings';
    }

    loading.value = false;
    return result;
  }

  async function fetchUpcomingBookings() {
    const result = await bookingService.getUpcomingBookings();

    if (result.success && result.data) {
      upcomingBookings.value = result.data;
    }

    return result;
  }

  async function updateBookingStatus(
    id: string,
    status: Booking['status'],
    cancellationReason?: string
  ) {
    const result = await bookingService.updateBookingStatus(id, status, cancellationReason);

    if (result.success && result.data) {
      const index = bookings.value.findIndex((b) => b.id === id);
      if (index >= 0) {
        bookings.value[index] = result.data;
      }

      // Update upcoming bookings too
      if (status === 'cancelled') {
        upcomingBookings.value = upcomingBookings.value.filter((b) => b.id !== id);
      }

      notificationStore.add('success', `Booking ${status}`);
    } else {
      notificationStore.add('error', result.error?.message || 'Failed to update booking');
    }

    return result;
  }

  async function fetchStats() {
    const result = await bookingService.getBookingStats();

    if (result.success && result.data) {
      stats.value = result.data;
    }

    return result;
  }

  function getBookingLinkUrl(link: BookingLink): string {
    return `${window.location.origin}/book/${link.user_id}/${link.slug}`;
  }

  return {
    // State
    bookingLinks,
    bookings,
    upcomingBookings,
    loading,
    error,
    stats,

    // Getters
    activeLinks,
    confirmedBookings,
    pendingBookings,

    // Actions
    fetchBookingLinks,
    createBookingLink,
    updateBookingLink,
    deleteBookingLink,
    fetchBookings,
    fetchUpcomingBookings,
    updateBookingStatus,
    fetchStats,
    getBookingLinkUrl,
  };
});
