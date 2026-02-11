<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
    <!-- Loading State -->
    <div v-if="loading" class="min-h-screen flex items-center justify-center">
      <Loader2 class="w-8 h-8 animate-spin text-blue-500" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="min-h-screen flex items-center justify-center p-4">
      <div class="card max-w-md w-full p-8 text-center">
        <AlertCircle class="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h2 class="text-xl font-semibold text-[var(--text-primary)] mb-2">Booking Link Not Found</h2>
        <p class="text-[var(--text-secondary)]">{{ error }}</p>
      </div>
    </div>

    <!-- Booking Interface -->
    <div v-else-if="bookingLink" class="max-w-4xl mx-auto py-8 px-4">
      <!-- Header -->
      <div class="card p-6 mb-6">
        <div class="flex items-start gap-4">
          <div
            class="w-4 h-4 rounded-full mt-1.5 flex-shrink-0"
            :style="{ backgroundColor: bookingLink.color }"
          />
          <div class="flex-1">
            <h1 class="text-2xl font-bold text-[var(--text-primary)] mb-2">{{ bookingLink.title }}</h1>
            <p v-if="bookingLink.description" class="text-[var(--text-secondary)] mb-4">
              {{ bookingLink.description }}
            </p>
            <div class="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
              <span class="flex items-center gap-1">
                <Clock class="w-4 h-4" />
                {{ bookingLink.duration_minutes }} minutes
              </span>
              <span class="flex items-center gap-1">
                <MapPin class="w-4 h-4" />
                {{ getLocationLabel(bookingLink.location_type) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 1: Select Date & Time -->
      <div v-if="step === 'select'" class="card p-6">
        <h2 class="text-lg font-semibold text-[var(--text-primary)] mb-4">Select a Date & Time</h2>

        <div class="grid md:grid-cols-2 gap-6">
          <!-- Calendar -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <button
                @click="previousMonth"
                class="p-2 hover:bg-[var(--accent-bg)] rounded-lg transition-colors"
                :disabled="!canGoPrevious"
              >
                <ChevronLeft class="w-5 h-5" />
              </button>
              <span class="font-medium text-[var(--text-primary)]">
                {{ currentMonthLabel }}
              </span>
              <button
                @click="nextMonth"
                class="p-2 hover:bg-[var(--accent-bg)] rounded-lg transition-colors"
                :disabled="!canGoNext"
              >
                <ChevronRight class="w-5 h-5" />
              </button>
            </div>

            <div class="grid grid-cols-7 gap-1 text-center text-sm">
              <div v-for="day in weekDays" :key="day" class="py-2 text-[var(--text-tertiary)] font-medium">
                {{ day }}
              </div>
              <button
                v-for="date in calendarDates"
                :key="date.toISOString()"
                @click="selectDate(date)"
                :disabled="!isDateAvailable(date)"
                class="py-2 rounded-lg transition-colors"
                :class="getDateClass(date)"
              >
                {{ date.getDate() }}
              </button>
            </div>
          </div>

          <!-- Time Slots -->
          <div>
            <div v-if="selectedDate" class="mb-4">
              <h3 class="font-medium text-[var(--text-primary)] mb-2">
                {{ formatSelectedDate(selectedDate) }}
              </h3>

              <!-- Timezone Selector -->
              <div class="flex items-center gap-2 mb-4">
                <Globe class="w-4 h-4 text-[var(--text-tertiary)]" />
                <select v-model="inviteeTimezone" class="input text-sm">
                  <option v-for="tz in commonTimezones" :key="tz" :value="tz">
                    {{ formatTimezone(tz) }}
                  </option>
                </select>
              </div>
            </div>

            <div v-if="loadingSlots" class="flex justify-center py-8">
              <Loader2 class="w-6 h-6 animate-spin text-blue-500" />
            </div>

            <div v-else-if="!selectedDate" class="text-center py-8 text-[var(--text-secondary)]">
              Select a date to see available times
            </div>

            <div v-else-if="availableSlots.length === 0" class="text-center py-8 text-[var(--text-secondary)]">
              No available times on this date
            </div>

            <div v-else class="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
              <button
                v-for="slot in availableSlots"
                :key="slot.start"
                @click="selectSlot(slot)"
                class="py-2 px-3 text-sm border rounded-lg transition-colors"
                :class="
                  selectedSlot?.start === slot.start
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'border-[var(--card-border)] text-[var(--text-primary)] hover:border-blue-500'
                "
              >
                {{ formatSlotTime(slot.start) }}
              </button>
            </div>

            <button
              v-if="selectedSlot"
              @click="step = 'confirm'"
              class="btn btn-primary w-full mt-4"
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      <!-- Step 2: Confirm Details -->
      <div v-else-if="step === 'confirm'" class="card p-6">
        <button
          @click="step = 'select'"
          class="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4"
        >
          <ChevronLeft class="w-4 h-4" />
          Back
        </button>

        <h2 class="text-lg font-semibold text-[var(--text-primary)] mb-6">Enter Your Details</h2>

        <!-- Selected Time Summary -->
        <div class="bg-[var(--accent-bg)] rounded-lg p-4 mb-6">
          <div class="flex items-center gap-3">
            <CalendarDays class="w-5 h-5 text-[var(--accent-primary)]" />
            <div>
              <p class="font-medium text-[var(--text-primary)]">
                {{ formatSelectedDate(selectedDate!) }}
              </p>
              <p class="text-sm text-[var(--text-secondary)]">
                {{ formatSlotTime(selectedSlot!.start) }} - {{ formatSlotTime(selectedSlot!.end) }}
                ({{ inviteeTimezone }})
              </p>
            </div>
          </div>
        </div>

        <form @submit.prevent="submitBooking" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Name *
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              class="input"
              placeholder="Your name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Email *
            </label>
            <input
              v-model="form.email"
              type="email"
              required
              class="input"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Notes (optional)
            </label>
            <textarea
              v-model="form.notes"
              rows="3"
              class="input"
              placeholder="Anything you'd like to share before the meeting?"
            />
          </div>

          <!-- Custom Questions -->
          <div v-for="question in bookingLink.questions" :key="question.id">
            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              {{ question.label }} {{ question.required ? '*' : '' }}
            </label>
            <input
              v-if="question.type === 'text'"
              v-model="form.answers[question.id]"
              type="text"
              :required="question.required"
              class="input"
              :placeholder="question.placeholder"
            />
            <textarea
              v-else-if="question.type === 'textarea'"
              v-model="form.answers[question.id]"
              rows="3"
              :required="question.required"
              class="input"
              :placeholder="question.placeholder"
            />
            <select
              v-else-if="question.type === 'select'"
              v-model="form.answers[question.id]"
              :required="question.required"
              class="input"
            >
              <option value="">Select an option</option>
              <option v-for="opt in question.options" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>

          <button
            type="submit"
            :disabled="submitting"
            class="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
            {{ submitting ? 'Scheduling...' : 'Schedule Meeting' }}
          </button>
        </form>
      </div>

      <!-- Step 3: Success -->
      <div v-else-if="step === 'success'" class="card p-8 text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
          <CheckCircle class="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 class="text-2xl font-bold text-[var(--text-primary)] mb-2">You're Scheduled!</h2>
        <p class="text-[var(--text-secondary)] mb-6">
          A calendar invitation has been sent to {{ form.email }}
        </p>

        <div class="bg-[var(--accent-bg)] rounded-lg p-4 text-left max-w-sm mx-auto">
          <h3 class="font-semibold text-[var(--text-primary)] mb-2">{{ bookingLink.title }}</h3>
          <div class="space-y-2 text-sm text-[var(--text-secondary)]">
            <div class="flex items-center gap-2">
              <CalendarDays class="w-4 h-4" />
              {{ formatSelectedDate(selectedDate!) }}
            </div>
            <div class="flex items-center gap-2">
              <Clock class="w-4 h-4" />
              {{ formatSlotTime(selectedSlot!.start) }} - {{ formatSlotTime(selectedSlot!.end) }}
            </div>
            <div class="flex items-center gap-2">
              <MapPin class="w-4 h-4" />
              {{ getLocationLabel(bookingLink.location_type) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="py-6 text-center text-sm text-[var(--text-tertiary)]">
      Powered by <a href="/" class="hover:text-[var(--text-primary)]">WorldTime</a>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue';
import { useRoute } from 'vue-router';
import {
  Loader2, AlertCircle, Clock, MapPin, ChevronLeft, ChevronRight,
  Globe, CalendarDays, CheckCircle
} from 'lucide-vue-next';
import { bookingService } from '@/services/api';
import type { BookingLink, AvailableSlot } from '@/types';

const route = useRoute();

// State
const loading = ref(true);
const error = ref<string | null>(null);
const bookingLink = ref<BookingLink | null>(null);
const step = ref<'select' | 'confirm' | 'success'>('select');

// Calendar state
const currentMonth = ref(new Date());
const selectedDate = ref<Date | null>(null);
const selectedSlot = ref<AvailableSlot | null>(null);
const availableSlots = ref<AvailableSlot[]>([]);
const loadingSlots = ref(false);

// Form state
const submitting = ref(false);
const inviteeTimezone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone);
const form = reactive({
  name: '',
  email: '',
  notes: '',
  answers: {} as Record<string, string>,
});

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const commonTimezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

// Computed
const currentMonthLabel = computed(() => {
  return currentMonth.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
});

const calendarDates = computed(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const dates: Date[] = [];

  // Add padding for days before first of month
  for (let i = 0; i < firstDay.getDay(); i++) {
    const date = new Date(year, month, -i);
    dates.unshift(date);
  }

  // Add days of month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    dates.push(new Date(year, month, i));
  }

  // Add padding for days after last of month
  const remaining = 42 - dates.length;
  for (let i = 1; i <= remaining; i++) {
    dates.push(new Date(year, month + 1, i));
  }

  return dates;
});

const canGoPrevious = computed(() => {
  const now = new Date();
  return currentMonth.value > now;
});

const canGoNext = computed(() => {
  if (!bookingLink.value) return false;
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + bookingLink.value.max_days_ahead);
  return currentMonth.value < maxDate;
});

// Methods
function previousMonth() {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() - 1,
    1
  );
}

function nextMonth() {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() + 1,
    1
  );
}

function isDateAvailable(date: Date): boolean {
  if (!bookingLink.value) return false;

  const now = new Date();
  const minDate = new Date(now.getTime() + bookingLink.value.min_notice_hours * 60 * 60 * 1000);
  const maxDate = new Date(now.getTime() + bookingLink.value.max_days_ahead * 24 * 60 * 60 * 1000);

  if (date < minDate || date > maxDate) return false;

  // Check if it's in current month
  if (date.getMonth() !== currentMonth.value.getMonth()) return false;

  // Check availability schedule
  const schedule = bookingLink.value.availability_schedule;
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const daySchedule = schedule[dayNames[date.getDay()]];

  return daySchedule?.enabled && daySchedule.slots.length > 0;
}

function getDateClass(date: Date): string {
  const isCurrentMonth = date.getMonth() === currentMonth.value.getMonth();
  const isSelected = selectedDate.value?.toDateString() === date.toDateString();
  const isToday = date.toDateString() === new Date().toDateString();
  const isAvailable = isDateAvailable(date);

  if (!isCurrentMonth) return 'text-[var(--text-tertiary)] opacity-50';
  if (isSelected) return 'bg-blue-500 text-white';
  if (!isAvailable) return 'text-[var(--text-tertiary)] cursor-not-allowed';
  if (isToday) return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-200';
  return 'hover:bg-[var(--accent-bg)] text-[var(--text-primary)]';
}

function selectDate(date: Date) {
  if (!isDateAvailable(date)) return;
  selectedDate.value = date;
  selectedSlot.value = null;
  fetchSlots();
}

async function fetchSlots() {
  if (!selectedDate.value || !bookingLink.value) return;

  loadingSlots.value = true;

  const startDate = new Date(selectedDate.value);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(selectedDate.value);
  endDate.setHours(23, 59, 59, 999);

  const result = await bookingService.getAvailableSlots(
    bookingLink.value,
    startDate,
    endDate,
    inviteeTimezone.value
  );

  if (result.success && result.data) {
    availableSlots.value = result.data;
  } else {
    availableSlots.value = [];
  }

  loadingSlots.value = false;
}

function selectSlot(slot: AvailableSlot) {
  selectedSlot.value = slot;
}

function formatSelectedDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatSlotTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: inviteeTimezone.value,
  });
}

function formatTimezone(tz: string): string {
  try {
    const now = new Date();
    const offset = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short',
    }).formatToParts(now).find(p => p.type === 'timeZoneName')?.value || '';

    const city = tz.split('/').pop()?.replace(/_/g, ' ') || tz;
    return `${city} (${offset})`;
  } catch {
    return tz;
  }
}

function getLocationLabel(type: string): string {
  switch (type) {
    case 'video': return 'Video call';
    case 'phone': return 'Phone call';
    case 'in_person': return 'In person';
    default: return bookingLink.value?.location_value || 'TBD';
  }
}

async function submitBooking() {
  if (!bookingLink.value || !selectedSlot.value) return;

  submitting.value = true;

  const result = await bookingService.createBooking({
    booking_link_id: bookingLink.value.id,
    invitee_name: form.name,
    invitee_email: form.email,
    invitee_timezone: inviteeTimezone.value,
    start_time: selectedSlot.value.start,
    end_time: selectedSlot.value.end,
    notes: form.notes || undefined,
    answers: Object.keys(form.answers).length > 0 ? form.answers : undefined,
  });

  submitting.value = false;

  if (result.success) {
    step.value = 'success';
  } else {
    alert(result.error?.message || 'Failed to schedule meeting');
  }
}

// Watch timezone changes
watch(inviteeTimezone, () => {
  if (selectedDate.value) {
    fetchSlots();
  }
});

// Load booking link
onMounted(async () => {
  const { userId, slug } = route.params;

  if (!userId || !slug) {
    error.value = 'Invalid booking link';
    loading.value = false;
    return;
  }

  const result = await bookingService.getBookingLinkBySlug(
    userId as string,
    slug as string
  );

  if (result.success && result.data) {
    bookingLink.value = result.data;
  } else {
    error.value = result.error?.message || 'Booking link not found';
  }

  loading.value = false;
});
</script>
