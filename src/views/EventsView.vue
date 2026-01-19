<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <router-link
              to="/home"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft class="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </router-link>
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ t('events.title') }}
              </h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ t('events.subtitle') }}
              </p>
            </div>
          </div>
          <button
            @click="showCreateModal = true"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus class="w-5 h-5" />
            <span class="hidden sm:inline">{{ t('events.createEvent') }}</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- View Toggle and Date Navigation -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <!-- View Toggle -->
        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1">
          <button
            v-for="view in views"
            :key="view.id"
            @click="currentView = view.id"
            class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
            :class="
              currentView === view.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            "
          >
            {{ view.label }}
          </button>
        </div>

        <!-- Date Navigation -->
        <div class="flex items-center gap-3">
          <button
            @click="navigateDate(-1)"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeft class="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            @click="goToToday"
            class="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
          >
            {{ t('events.today') }}
          </button>
          <span class="text-lg font-semibold text-gray-900 dark:text-white min-w-[200px] text-center">
            {{ formattedDateRange }}
          </span>
          <button
            @click="navigateDate(1)"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronRight class="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-blue-600" />
      </div>

      <!-- Calendar View -->
      <div v-else-if="currentView === 'calendar'" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <!-- Week Header -->
        <div class="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          <div
            v-for="day in weekDays"
            :key="day.date"
            class="p-4 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0"
            :class="isToday(day.date) ? 'bg-blue-50 dark:bg-blue-900/20' : ''"
          >
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              {{ day.dayName }}
            </p>
            <p
              class="text-2xl font-bold mt-1"
              :class="isToday(day.date) ? 'text-blue-600' : 'text-gray-900 dark:text-white'"
            >
              {{ day.dayNumber }}
            </p>
          </div>
        </div>

        <!-- Week Content -->
        <div class="grid grid-cols-7 min-h-[500px]">
          <div
            v-for="day in weekDays"
            :key="day.date"
            class="border-r border-gray-200 dark:border-gray-700 last:border-r-0 p-2"
            :class="isToday(day.date) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''"
          >
            <div class="space-y-1">
              <div
                v-for="event in getEventsForDate(day.date)"
                :key="event.id"
                @click="openEventDetail(event)"
                class="p-2 rounded-lg text-sm cursor-pointer hover:opacity-80 transition-opacity"
                :style="{ backgroundColor: getEventColor(event), color: 'white' }"
              >
                <p class="font-medium truncate">{{ event.title }}</p>
                <p class="text-xs opacity-80">
                  {{ formatEventTime(event) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-else-if="currentView === 'list'" class="space-y-4">
        <!-- Empty State -->
        <div
          v-if="!hasEvents"
          class="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
        >
          <Calendar class="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {{ t('events.noEvents') }}
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            {{ t('events.noEventsDescription') }}
          </p>
          <button
            @click="showCreateModal = true"
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus class="w-5 h-5" />
            {{ t('events.createFirstEvent') }}
          </button>
        </div>

        <!-- Events List -->
        <div v-else class="space-y-6">
          <div v-for="(dayEvents, date) in eventsByDate" :key="date">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 sticky top-0 bg-gray-50 dark:bg-gray-900 py-2">
              {{ formatDateHeader(date) }}
            </h3>
            <div class="space-y-2">
              <div
                v-for="event in dayEvents"
                :key="event.id"
                @click="openEventDetail(event)"
                class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow flex items-start gap-4"
              >
                <div
                  class="w-1 h-full min-h-[60px] rounded-full"
                  :style="{ backgroundColor: getEventColor(event) }"
                ></div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between">
                    <div>
                      <h4 class="font-medium text-gray-900 dark:text-white">
                        {{ event.title }}
                      </h4>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        {{ formatEventTime(event) }}
                      </p>
                    </div>
                    <span
                      v-if="event.status === 'tentative'"
                      class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                    >
                      {{ t('events.tentative') }}
                    </span>
                  </div>
                  <div v-if="event.location" class="flex items-center gap-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <MapPin class="w-4 h-4" />
                    {{ event.location }}
                  </div>
                  <div v-if="event.attendees?.length" class="flex items-center gap-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <Users class="w-4 h-4" />
                    {{ event.attendees.length }} {{ t('events.attendees') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Upcoming View -->
      <div v-else-if="currentView === 'upcoming'" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ t('events.upcomingEvents') }}
        </h3>
        <div v-if="upcomingEvents.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          {{ t('events.noUpcomingEvents') }}
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="event in upcomingEvents"
            :key="event.id"
            @click="openEventDetail(event)"
            class="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
          >
            <div class="flex-shrink-0 w-16 h-16 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex flex-col items-center justify-center">
              <p class="text-xs font-medium text-blue-600 uppercase">
                {{ formatMonth(event.start_time) }}
              </p>
              <p class="text-2xl font-bold text-blue-600">
                {{ formatDay(event.start_time) }}
              </p>
            </div>
            <div class="flex-1">
              <h4 class="font-medium text-gray-900 dark:text-white">{{ event.title }}</h4>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatEventTime(event) }}
              </p>
            </div>
            <ChevronRight class="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>
    </main>

    <!-- Create/Edit Event Modal -->
    <div
      v-if="showCreateModal || showEditModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="closeModals"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {{ showEditModal ? t('events.editEvent') : t('events.createEvent') }}
        </h2>
        <form @submit.prevent="handleSaveEvent">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('events.eventTitle') }}
              </label>
              <input
                v-model="eventForm.title"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                :placeholder="t('events.eventTitlePlaceholder')"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('events.startDate') }}
                </label>
                <input
                  v-model="eventForm.startDate"
                  type="date"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('events.startTime') }}
                </label>
                <input
                  v-model="eventForm.startTime"
                  type="time"
                  :required="!eventForm.isAllDay"
                  :disabled="eventForm.isAllDay"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('events.endDate') }}
                </label>
                <input
                  v-model="eventForm.endDate"
                  type="date"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('events.endTime') }}
                </label>
                <input
                  v-model="eventForm.endTime"
                  type="time"
                  :required="!eventForm.isAllDay"
                  :disabled="eventForm.isAllDay"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                />
              </div>
            </div>

            <div class="flex items-center gap-2">
              <input
                v-model="eventForm.isAllDay"
                type="checkbox"
                id="allDay"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label for="allDay" class="text-sm text-gray-700 dark:text-gray-300">
                {{ t('events.allDay') }}
              </label>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('events.location') }}
              </label>
              <input
                v-model="eventForm.location"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                :placeholder="t('events.locationPlaceholder')"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('events.description') }}
              </label>
              <textarea
                v-model="eventForm.description"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                :placeholder="t('events.descriptionPlaceholder')"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('events.busyStatus') }}
              </label>
              <select
                v-model="eventForm.busyStatus"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="busy">{{ t('events.busy') }}</option>
                <option value="free">{{ t('events.free') }}</option>
                <option value="tentative">{{ t('events.tentative') }}</option>
              </select>
            </div>
          </div>

          <div class="flex justify-between mt-6">
            <button
              v-if="showEditModal"
              type="button"
              @click="handleDeleteEvent"
              class="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              {{ t('common.delete') }}
            </button>
            <div class="flex gap-3 ml-auto">
              <button
                type="button"
                @click="closeModals"
                class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="!eventForm.title"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {{ showEditModal ? t('common.save') : t('events.create') }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useEventsStore } from '@/stores/events';
import { useAuthStore } from '@/stores/auth';
import {
  ArrowLeft,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Loader2,
} from 'lucide-vue-next';
import type { CalendarEvent } from '@/types';

const { t } = useI18n();
const eventsStore = useEventsStore();
const authStore = useAuthStore();

const { events, loading, hasEvents, upcomingEvents, eventsByDate } = storeToRefs(eventsStore);

// View state
const views = [
  { id: 'calendar', label: t('events.calendar') },
  { id: 'list', label: t('events.list') },
  { id: 'upcoming', label: t('events.upcoming') },
];
const currentView = ref('calendar');

// Date navigation
const currentDate = ref(new Date());

// Modals
const showCreateModal = ref(false);
const showEditModal = ref(false);
const selectedEvent = ref<CalendarEvent | null>(null);

// Event form
const eventForm = ref({
  title: '',
  startDate: '',
  startTime: '09:00',
  endDate: '',
  endTime: '10:00',
  isAllDay: false,
  location: '',
  description: '',
  busyStatus: 'busy' as 'busy' | 'free' | 'tentative',
});

// Computed
const weekDays = computed(() => {
  const start = getWeekStart(currentDate.value);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    days.push({
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: date.getDate(),
    });
  }
  return days;
});

const formattedDateRange = computed(() => {
  const start = getWeekStart(currentDate.value);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  }
  return `${start.toLocaleDateString('en-US', { month: 'short' })} - ${end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
});

// Methods
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0];
}

function navigateDate(direction: number) {
  const newDate = new Date(currentDate.value);
  if (currentView.value === 'calendar') {
    newDate.setDate(newDate.getDate() + direction * 7);
  } else {
    newDate.setMonth(newDate.getMonth() + direction);
  }
  currentDate.value = newDate;
  loadEvents();
}

function goToToday() {
  currentDate.value = new Date();
  loadEvents();
}

function getEventsForDate(dateStr: string): CalendarEvent[] {
  return eventsStore.getEventsForDate(dateStr);
}

function getEventColor(event: CalendarEvent): string {
  if (event.status === 'cancelled') return '#9CA3AF';
  if (event.busy_status === 'free') return '#10B981';
  if (event.busy_status === 'tentative') return '#F59E0B';
  return '#3B82F6';
}

function formatEventTime(event: CalendarEvent): string {
  if (event.is_all_day) return t('events.allDay');

  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };

  return `${start.toLocaleTimeString('en-US', options)} - ${end.toLocaleTimeString('en-US', options)}`;
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (dateStr === today) return t('events.today');
  if (dateStr === tomorrow.toISOString().split('T')[0]) return t('events.tomorrow');

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatMonth(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' });
}

function formatDay(dateStr: string): string {
  return new Date(dateStr).getDate().toString();
}

function openEventDetail(event: CalendarEvent) {
  selectedEvent.value = event;
  eventForm.value = {
    title: event.title,
    startDate: event.start_time.split('T')[0],
    startTime: event.start_time.split('T')[1]?.substring(0, 5) || '09:00',
    endDate: event.end_time.split('T')[0],
    endTime: event.end_time.split('T')[1]?.substring(0, 5) || '10:00',
    isAllDay: event.is_all_day,
    location: event.location || '',
    description: event.description || '',
    busyStatus: event.busy_status as 'busy' | 'free' | 'tentative',
  };
  showEditModal.value = true;
}

function closeModals() {
  showCreateModal.value = false;
  showEditModal.value = false;
  selectedEvent.value = null;
  resetForm();
}

function resetForm() {
  const today = new Date().toISOString().split('T')[0];
  eventForm.value = {
    title: '',
    startDate: today,
    startTime: '09:00',
    endDate: today,
    endTime: '10:00',
    isAllDay: false,
    location: '',
    description: '',
    busyStatus: 'busy',
  };
}

async function handleSaveEvent() {
  const timezone = authStore.user?.timezone || 'UTC';

  const eventData = {
    title: eventForm.value.title,
    start_time: eventForm.value.isAllDay
      ? eventForm.value.startDate
      : `${eventForm.value.startDate}T${eventForm.value.startTime}:00`,
    end_time: eventForm.value.isAllDay
      ? eventForm.value.endDate
      : `${eventForm.value.endDate}T${eventForm.value.endTime}:00`,
    is_all_day: eventForm.value.isAllDay,
    location: eventForm.value.location || undefined,
    description: eventForm.value.description || undefined,
    busy_status: eventForm.value.busyStatus,
    timezone,
  };

  if (showEditModal.value && selectedEvent.value) {
    await eventsStore.updateEvent(selectedEvent.value.id, eventData);
  } else {
    await eventsStore.createEvent(eventData);
  }

  closeModals();
}

async function handleDeleteEvent() {
  if (selectedEvent.value && confirm(t('events.confirmDelete'))) {
    await eventsStore.deleteEvent(selectedEvent.value.id);
    closeModals();
  }
}

async function loadEvents() {
  const start = getWeekStart(currentDate.value);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  await eventsStore.fetchEventsInRange(
    start.toISOString(),
    end.toISOString()
  );
}

onMounted(() => {
  loadEvents();
  eventsStore.fetchUpcoming();
});

watch(currentView, () => {
  if (currentView.value === 'upcoming') {
    eventsStore.fetchUpcoming();
  }
});
</script>
