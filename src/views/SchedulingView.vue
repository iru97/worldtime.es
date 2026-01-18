<template>
  <div class="min-h-screen bg-gradient-to-br from-[var(--bg-gradient-from)] to-[var(--bg-gradient-to)]">
    <!-- Header -->
    <header class="w-full bg-[var(--card-bg)] shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-3">
            <RouterLink to="/home" class="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <ArrowLeft class="w-5 h-5" />
            </RouterLink>
            <Calendar class="w-8 h-8 text-[var(--accent-primary)]" />
            <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ $t('scheduling.title') }}</h1>
          </div>
          <div class="flex items-center gap-4">
            <ThemeToggle />
            <LanguageSelector />
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="card p-6">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Link2 class="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p class="text-2xl font-bold text-[var(--text-primary)]">{{ bookingsStore.bookingLinks.length }}</p>
              <p class="text-sm text-[var(--text-secondary)]">{{ $t('scheduling.bookingLinks') }}</p>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CalendarCheck class="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p class="text-2xl font-bold text-[var(--text-primary)]">{{ bookingsStore.stats?.upcoming || 0 }}</p>
              <p class="text-sm text-[var(--text-secondary)]">{{ $t('scheduling.upcomingBookings') }}</p>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Vote class="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p class="text-2xl font-bold text-[var(--text-primary)]">{{ pollsStore.openPolls.length }}</p>
              <p class="text-sm text-[var(--text-secondary)]">{{ $t('scheduling.activePolls') }}</p>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <CalendarClock class="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p class="text-2xl font-bold text-[var(--text-primary)]">
                {{ calendarStore.isConnected ? '✓' : '—' }}
              </p>
              <p class="text-sm text-[var(--text-secondary)]">{{ $t('scheduling.calendarSync') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-[var(--card-border)] mb-6">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-6 py-3 font-medium transition-colors relative"
          :class="
            activeTab === tab.id
              ? 'text-[var(--accent-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          "
        >
          <component :is="tab.icon" class="w-5 h-5 inline-block mr-2" />
          {{ tab.label }}
          <div
            v-if="activeTab === tab.id"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]"
          />
        </button>
      </div>

      <!-- Booking Links Tab -->
      <div v-if="activeTab === 'links'" class="space-y-6">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold text-[var(--text-primary)]">{{ $t('scheduling.yourBookingLinks') }}</h2>
          <button @click="showCreateLink = true" class="btn btn-primary flex items-center gap-2">
            <Plus class="w-5 h-5" />
            {{ $t('scheduling.createLink') }}
          </button>
        </div>

        <div v-if="bookingsStore.loading" class="flex justify-center py-12">
          <Loader2 class="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
        </div>

        <div v-else-if="bookingsStore.bookingLinks.length === 0" class="card p-12 text-center">
          <Link2 class="w-12 h-12 mx-auto mb-4 text-[var(--text-tertiary)]" />
          <h3 class="text-lg font-medium text-[var(--text-primary)] mb-2">{{ $t('scheduling.noLinks') }}</h3>
          <p class="text-[var(--text-secondary)] mb-6">{{ $t('scheduling.noLinksDescription') }}</p>
          <button @click="showCreateLink = true" class="btn btn-primary">
            {{ $t('scheduling.createFirstLink') }}
          </button>
        </div>

        <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="link in bookingsStore.bookingLinks"
            :key="link.id"
            class="card p-6 hover:shadow-lg transition-shadow"
          >
            <div class="flex items-start justify-between mb-4">
              <div
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: link.color }"
              />
              <div class="flex items-center gap-2">
                <span
                  class="px-2 py-0.5 text-xs font-medium rounded-full"
                  :class="
                    link.is_active
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  "
                >
                  {{ link.is_active ? $t('scheduling.active') : $t('scheduling.inactive') }}
                </span>
              </div>
            </div>

            <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-1">{{ link.title }}</h3>
            <p class="text-sm text-[var(--text-secondary)] mb-4">
              {{ link.duration_minutes }} {{ $t('scheduling.minutes') }}
            </p>

            <div class="flex items-center gap-2 mb-4">
              <input
                :value="bookingsStore.getBookingLinkUrl(link)"
                readonly
                class="flex-1 px-3 py-1.5 text-sm bg-[var(--accent-bg)] border border-[var(--card-border)] rounded-lg text-[var(--text-secondary)]"
              />
              <button
                @click="copyLink(link)"
                class="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                :title="$t('scheduling.copyLink')"
              >
                <Copy class="w-4 h-4" />
              </button>
            </div>

            <div class="flex justify-between items-center pt-4 border-t border-[var(--card-border)]">
              <button
                @click="editLink(link)"
                class="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {{ $t('common.edit') }}
              </button>
              <button
                @click="deleteLink(link.id)"
                class="text-sm text-red-500 hover:text-red-600"
              >
                {{ $t('common.delete') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Meeting Polls Tab -->
      <div v-if="activeTab === 'polls'" class="space-y-6">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold text-[var(--text-primary)]">{{ $t('scheduling.yourPolls') }}</h2>
          <button @click="showCreatePoll = true" class="btn btn-primary flex items-center gap-2">
            <Plus class="w-5 h-5" />
            {{ $t('scheduling.createPoll') }}
          </button>
        </div>

        <div v-if="pollsStore.loading" class="flex justify-center py-12">
          <Loader2 class="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
        </div>

        <div v-else-if="pollsStore.polls.length === 0" class="card p-12 text-center">
          <Vote class="w-12 h-12 mx-auto mb-4 text-[var(--text-tertiary)]" />
          <h3 class="text-lg font-medium text-[var(--text-primary)] mb-2">{{ $t('scheduling.noPolls') }}</h3>
          <p class="text-[var(--text-secondary)] mb-6">{{ $t('scheduling.noPollsDescription') }}</p>
          <button @click="showCreatePoll = true" class="btn btn-primary">
            {{ $t('scheduling.createFirstPoll') }}
          </button>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="poll in pollsStore.polls"
            :key="poll.id"
            class="card p-6"
          >
            <div class="flex items-start justify-between">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-lg font-semibold text-[var(--text-primary)]">{{ poll.title }}</h3>
                  <span
                    class="px-2 py-0.5 text-xs font-medium rounded-full"
                    :class="getPollStatusClass(poll.status)"
                  >
                    {{ poll.status }}
                  </span>
                </div>
                <p v-if="poll.description" class="text-sm text-[var(--text-secondary)] mb-2">
                  {{ poll.description }}
                </p>
                <p class="text-sm text-[var(--text-tertiary)]">
                  {{ poll.options?.length || 0 }} {{ $t('scheduling.timeOptions') }} •
                  {{ poll.duration_minutes }} {{ $t('scheduling.minutes') }}
                </p>
              </div>

              <div class="flex items-center gap-2">
                <button
                  @click="copyPollLink(poll)"
                  class="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                  :title="$t('scheduling.copyLink')"
                >
                  <Copy class="w-4 h-4" />
                </button>
                <button
                  v-if="poll.status === 'open'"
                  @click="closePoll(poll.id)"
                  class="p-2 text-[var(--text-secondary)] hover:text-orange-500 transition-colors"
                  :title="$t('scheduling.closePoll')"
                >
                  <XCircle class="w-4 h-4" />
                </button>
                <button
                  @click="deletePoll(poll.id)"
                  class="p-2 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                  :title="$t('common.delete')"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Upcoming Bookings Tab -->
      <div v-if="activeTab === 'upcoming'" class="space-y-6">
        <h2 class="text-xl font-semibold text-[var(--text-primary)]">{{ $t('scheduling.upcomingMeetings') }}</h2>

        <div v-if="bookingsStore.loading" class="flex justify-center py-12">
          <Loader2 class="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
        </div>

        <div v-else-if="bookingsStore.upcomingBookings.length === 0" class="card p-12 text-center">
          <CalendarX class="w-12 h-12 mx-auto mb-4 text-[var(--text-tertiary)]" />
          <h3 class="text-lg font-medium text-[var(--text-primary)] mb-2">{{ $t('scheduling.noUpcoming') }}</h3>
          <p class="text-[var(--text-secondary)]">{{ $t('scheduling.noUpcomingDescription') }}</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="booking in bookingsStore.upcomingBookings"
            :key="booking.id"
            class="card p-6"
          >
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-1">
                  {{ booking.booking_link?.title || 'Meeting' }}
                </h3>
                <p class="text-[var(--text-secondary)] mb-2">
                  {{ $t('scheduling.with') }} {{ booking.invitee_name }}
                  <span class="text-[var(--text-tertiary)]">({{ booking.invitee_email }})</span>
                </p>
                <div class="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                  <span class="flex items-center gap-1">
                    <CalendarDays class="w-4 h-4" />
                    {{ formatDate(booking.start_time) }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Clock class="w-4 h-4" />
                    {{ formatTime(booking.start_time) }} - {{ formatTime(booking.end_time) }}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button
                  @click="cancelBooking(booking.id)"
                  class="text-sm text-red-500 hover:text-red-600"
                >
                  {{ $t('scheduling.cancel') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Calendar Integration Tab -->
      <div v-if="activeTab === 'calendar'" class="space-y-6">
        <h2 class="text-xl font-semibold text-[var(--text-primary)]">{{ $t('scheduling.calendarIntegration') }}</h2>

        <div class="card p-6">
          <div v-if="!calendarStore.isConnected" class="text-center py-8">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent-bg)] flex items-center justify-center">
              <Calendar class="w-8 h-8 text-[var(--accent-primary)]" />
            </div>
            <h3 class="text-lg font-medium text-[var(--text-primary)] mb-2">
              {{ $t('scheduling.connectCalendar') }}
            </h3>
            <p class="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
              {{ $t('scheduling.connectCalendarDescription') }}
            </p>
            <button @click="connectGoogleCalendar" class="btn btn-primary flex items-center gap-2 mx-auto">
              <img src="https://www.google.com/favicon.ico" class="w-4 h-4" alt="Google" />
              {{ $t('scheduling.connectGoogle') }}
            </button>
          </div>

          <div v-else class="space-y-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Check class="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p class="font-medium text-[var(--text-primary)]">Google Calendar</p>
                  <p class="text-sm text-[var(--text-secondary)]">
                    {{ calendarStore.connection?.calendar_name || 'Connected' }}
                  </p>
                </div>
              </div>
              <button
                @click="disconnectCalendar"
                class="text-sm text-red-500 hover:text-red-600"
              >
                {{ $t('scheduling.disconnect') }}
              </button>
            </div>

            <div class="border-t border-[var(--card-border)] pt-4">
              <p class="text-sm text-[var(--text-secondary)] mb-2">
                {{ $t('scheduling.lastSynced') }}:
                {{ calendarStore.connection?.last_synced_at
                  ? formatDate(calendarStore.connection.last_synced_at)
                  : $t('scheduling.never') }}
              </p>
              <button
                @click="syncCalendar"
                :disabled="calendarStore.syncing"
                class="btn btn-secondary flex items-center gap-2"
              >
                <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': calendarStore.syncing }" />
                {{ calendarStore.syncing ? $t('scheduling.syncing') : $t('scheduling.syncNow') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Create Booking Link Modal -->
    <BookingLinkModal
      v-if="showCreateLink"
      :link="editingLink"
      @close="showCreateLink = false; editingLink = null"
      @saved="handleLinkSaved"
    />

    <!-- Create Poll Modal -->
    <PollModal
      v-if="showCreatePoll"
      @close="showCreatePoll = false"
      @saved="handlePollSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, markRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Calendar, ArrowLeft, Link2, CalendarCheck, Vote, CalendarClock,
  Plus, Loader2, Copy, Trash2, XCircle, CalendarX, CalendarDays,
  Clock, Check, RefreshCw
} from 'lucide-vue-next';
import { useBookingsStore } from '@/stores/bookings';
import { usePollsStore } from '@/stores/polls';
import { useCalendarStore } from '@/stores/calendar';
import { useNotificationStore } from '@/stores/notifications';
import ThemeToggle from '@/components/ThemeToggle.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';
import BookingLinkModal from '@/components/BookingLinkModal.vue';
import PollModal from '@/components/PollModal.vue';
import type { BookingLink, MeetingPoll } from '@/types';

const { t } = useI18n();
const bookingsStore = useBookingsStore();
const pollsStore = usePollsStore();
const calendarStore = useCalendarStore();
const notificationStore = useNotificationStore();

const activeTab = ref('links');
const showCreateLink = ref(false);
const showCreatePoll = ref(false);
const editingLink = ref<BookingLink | null>(null);

const tabs = [
  { id: 'links', label: t('scheduling.bookingLinks'), icon: markRaw(Link2) },
  { id: 'polls', label: t('scheduling.polls'), icon: markRaw(Vote) },
  { id: 'upcoming', label: t('scheduling.upcoming'), icon: markRaw(CalendarCheck) },
  { id: 'calendar', label: t('scheduling.calendar'), icon: markRaw(Calendar) },
];

function getPollStatusClass(status: string) {
  switch (status) {
    case 'open':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    case 'closed':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
    case 'confirmed':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function copyLink(link: BookingLink) {
  const url = bookingsStore.getBookingLinkUrl(link);
  await navigator.clipboard.writeText(url);
  notificationStore.add('success', t('scheduling.linkCopied'));
}

async function copyPollLink(poll: MeetingPoll) {
  const url = pollsStore.getPollUrl(poll);
  await navigator.clipboard.writeText(url);
  notificationStore.add('success', t('scheduling.linkCopied'));
}

function editLink(link: BookingLink) {
  editingLink.value = link;
  showCreateLink.value = true;
}

async function deleteLink(id: string) {
  if (confirm(t('scheduling.deleteLinkConfirm'))) {
    await bookingsStore.deleteBookingLink(id);
  }
}

async function closePoll(id: string) {
  if (confirm(t('scheduling.closePollConfirm'))) {
    await pollsStore.closePoll(id);
  }
}

async function deletePoll(id: string) {
  if (confirm(t('scheduling.deletePollConfirm'))) {
    await pollsStore.deletePoll(id);
  }
}

async function cancelBooking(id: string) {
  if (confirm(t('scheduling.cancelBookingConfirm'))) {
    await bookingsStore.updateBookingStatus(id, 'cancelled');
  }
}

function connectGoogleCalendar() {
  const url = calendarStore.getAuthorizationUrl();
  window.location.href = url;
}

async function disconnectCalendar() {
  if (confirm(t('scheduling.disconnectConfirm'))) {
    await calendarStore.disconnect();
  }
}

async function syncCalendar() {
  const now = new Date();
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  await calendarStore.fetchEvents(now, endDate);
}

function handleLinkSaved() {
  showCreateLink.value = false;
  editingLink.value = null;
}

function handlePollSaved() {
  showCreatePoll.value = false;
}

onMounted(async () => {
  await Promise.all([
    bookingsStore.fetchBookingLinks(),
    bookingsStore.fetchUpcomingBookings(),
    bookingsStore.fetchStats(),
    pollsStore.fetchPolls(),
    pollsStore.fetchStats(),
    calendarStore.fetchConnection(),
  ]);
});
</script>
