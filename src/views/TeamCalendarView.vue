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
            <CalendarDays class="w-8 h-8 text-[var(--accent-primary)]" />
            <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ $t('teamCalendar.title') }}</h1>
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
      <!-- Date Navigation -->
      <div class="card p-4 mb-6">
        <div class="flex items-center justify-between">
          <button
            @click="previousDay"
            class="p-2 hover:bg-[var(--accent-bg)] rounded-lg transition-colors"
          >
            <ChevronLeft class="w-5 h-5" />
          </button>

          <div class="flex items-center gap-4">
            <button
              @click="goToToday"
              class="btn btn-secondary text-sm"
            >
              Today
            </button>
            <h2 class="text-lg font-semibold text-[var(--text-primary)]">
              {{ formatDate(selectedDate) }}
            </h2>
          </div>

          <button
            @click="nextDay"
            class="p-2 hover:bg-[var(--accent-bg)] rounded-lg transition-colors"
          >
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Contact Filter -->
      <div class="card p-4 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-medium text-[var(--text-primary)]">
            {{ $t('teamCalendar.selectContacts') }}
          </h3>
          <div class="flex items-center gap-2">
            <button
              @click="selectAllContacts"
              class="text-sm text-[var(--accent-primary)] hover:underline"
            >
              Select All
            </button>
            <span class="text-[var(--text-tertiary)]">|</span>
            <button
              @click="clearSelection"
              class="text-sm text-[var(--text-secondary)] hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="contact in contactsStore.contacts"
            :key="contact.id"
            @click="toggleContact(contact.id)"
            class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
            :class="
              selectedContactIds.has(contact.id)
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--card-border)] hover:border-[var(--accent-primary)]'
            "
          >
            {{ contact.name }}
            <span class="text-xs opacity-75">{{ getTimezoneAbbr(contact.timezone) }}</span>
          </button>
        </div>
      </div>

      <!-- Timeline Grid -->
      <div class="card overflow-x-auto">
        <div class="min-w-[1200px]">
          <!-- Hour Headers -->
          <div class="grid border-b border-[var(--card-border)]" :style="{ gridTemplateColumns: `180px repeat(24, minmax(40px, 1fr))` }">
            <div class="p-3 bg-[var(--accent-bg)] font-medium text-[var(--text-secondary)] text-sm sticky left-0 z-10">
              {{ $t('teamCalendar.contact') }}
            </div>
            <div
              v-for="hour in 24"
              :key="hour"
              class="p-2 text-center text-xs font-medium border-l border-[var(--card-border)]"
              :class="isCurrentHour(hour - 1) ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-[var(--text-tertiary)]'"
            >
              {{ formatHour(hour - 1) }}
            </div>
          </div>

          <!-- Contact Rows -->
          <div
            v-for="contact in selectedContacts"
            :key="contact.id"
            class="grid border-b border-[var(--card-border)] last:border-b-0"
            :style="{ gridTemplateColumns: `180px repeat(24, minmax(40px, 1fr))` }"
          >
            <!-- Contact Info -->
            <div class="p-3 flex items-center gap-2 bg-[var(--accent-bg)] sticky left-0 z-10">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-[var(--text-primary)] truncate">{{ contact.name }}</p>
                <p class="text-xs text-[var(--text-tertiary)] truncate">
                  {{ getCurrentTime(contact.timezone) }} • {{ getTimezoneAbbr(contact.timezone) }}
                </p>
              </div>
            </div>

            <!-- Hour Cells -->
            <div
              v-for="hour in 24"
              :key="hour"
              class="h-14 border-l border-[var(--card-border)] relative"
              :class="getHourCellClass(contact, hour - 1)"
              :title="getHourTooltip(contact, hour - 1)"
            >
              <!-- Current time indicator -->
              <div
                v-if="isCurrentHour(hour - 1) && isToday"
                class="absolute top-0 bottom-0 w-0.5 bg-blue-500"
                :style="{ left: `${currentMinutePercentage}%` }"
              />
            </div>
          </div>

          <!-- User's Own Row -->
          <div
            v-if="userTimezone"
            class="grid border-t-2 border-[var(--accent-primary)]"
            :style="{ gridTemplateColumns: `180px repeat(24, minmax(40px, 1fr))` }"
          >
            <div class="p-3 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 sticky left-0 z-10">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-[var(--accent-primary)]">{{ $t('teamCalendar.you') }}</p>
                <p class="text-xs text-[var(--text-tertiary)] truncate">
                  {{ getCurrentTime(userTimezone) }} • {{ getTimezoneAbbr(userTimezone) }}
                </p>
              </div>
            </div>

            <div
              v-for="hour in 24"
              :key="hour"
              class="h-14 border-l border-[var(--card-border)] relative"
              :class="getUserHourCellClass(hour - 1)"
            >
              <div
                v-if="isCurrentHour(hour - 1) && isToday"
                class="absolute top-0 bottom-0 w-0.5 bg-blue-500"
                :style="{ left: `${currentMinutePercentage}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="card p-4 mt-6">
        <h3 class="font-medium text-[var(--text-primary)] mb-3">{{ $t('teamCalendar.legend') }}</h3>
        <div class="flex flex-wrap gap-4">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700" />
            <span class="text-sm text-[var(--text-secondary)]">{{ $t('status.working') }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700" />
            <span class="text-sm text-[var(--text-secondary)]">{{ $t('status.free') }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600" />
            <span class="text-sm text-[var(--text-secondary)]">{{ $t('status.sleeping') }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500" />
            <span class="text-sm text-[var(--text-secondary)]">{{ $t('teamCalendar.currentHour') }}</span>
          </div>
        </div>
      </div>

      <!-- Best Meeting Times -->
      <div v-if="selectedContacts.length >= 2" class="card p-6 mt-6">
        <h3 class="font-semibold text-[var(--text-primary)] mb-4">
          {{ $t('teamCalendar.bestTimes') }}
        </h3>

        <div v-if="bestTimeSlots.length === 0" class="text-center py-6 text-[var(--text-secondary)]">
          {{ $t('meeting.noOverlap') }}
        </div>

        <div v-else class="grid gap-3 md:grid-cols-3">
          <div
            v-for="(slot, index) in bestTimeSlots.slice(0, 6)"
            :key="index"
            class="p-4 rounded-lg border border-[var(--card-border)] hover:border-[var(--accent-primary)] transition-colors"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-[var(--text-primary)]">
                {{ formatSlotTime(slot.hour) }}
              </span>
              <span
                class="px-2 py-0.5 text-xs rounded-full"
                :class="slot.allWorking ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'"
              >
                {{ slot.allWorking ? 'All available' : `${slot.score}/${selectedContacts.length} available` }}
              </span>
            </div>
            <div class="text-xs text-[var(--text-secondary)]">
              <span v-for="(p, i) in slot.participants" :key="p.id">
                {{ p.name }}: {{ formatHour(p.localHour) }}{{ i < slot.participants.length - 1 ? ' • ' : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { useContactsStore } from '@/stores/contacts';
import { useAuthStore } from '@/stores/auth';
import ThemeToggle from '@/components/ThemeToggle.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';
import type { Contact, MeetingTimeSlot } from '@/types';

const contactsStore = useContactsStore();
const authStore = useAuthStore();

// State
const selectedDate = ref(new Date());
const selectedContactIds = ref<Set<string>>(new Set());
const currentTime = ref(new Date());
let timeInterval: ReturnType<typeof setInterval>;

// Computed
const userTimezone = computed(() => authStore.user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);

const selectedContacts = computed(() =>
  contactsStore.contacts.filter((c) => selectedContactIds.value.has(c.id))
);

const isToday = computed(() => {
  const today = new Date();
  return (
    selectedDate.value.getDate() === today.getDate() &&
    selectedDate.value.getMonth() === today.getMonth() &&
    selectedDate.value.getFullYear() === today.getFullYear()
  );
});

const currentMinutePercentage = computed(() => {
  return (currentTime.value.getMinutes() / 60) * 100;
});

const bestTimeSlots = computed((): MeetingTimeSlot[] => {
  if (selectedContacts.value.length < 2) return [];

  const slots: MeetingTimeSlot[] = [];

  for (let hour = 0; hour < 24; hour++) {
    const participants = selectedContacts.value.map((contact) => {
      const localHour = getLocalHour(contact.timezone, hour);
      const status = getStatus(contact, localHour);
      return {
        id: contact.id,
        name: contact.name,
        localHour,
        status,
      };
    });

    const workingCount = participants.filter((p) => p.status === 'working').length;
    const allWorking = workingCount === participants.length;

    if (workingCount > 0) {
      slots.push({
        hour,
        score: workingCount,
        allWorking,
        participants,
      });
    }
  }

  // Sort by score (most people working) then by hour
  slots.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Prefer 9-17 hours in user's timezone
    const aPreferred = a.hour >= 9 && a.hour <= 17;
    const bPreferred = b.hour >= 9 && b.hour <= 17;
    if (aPreferred && !bPreferred) return -1;
    if (!aPreferred && bPreferred) return 1;
    return a.hour - b.hour;
  });

  return slots;
});

// Methods
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}${period}`;
}

function formatSlotTime(hour: number): string {
  return `${formatHour(hour)} - ${formatHour((hour + 1) % 24)}`;
}

function getCurrentTime(timezone: string): string {
  try {
    return currentTime.value.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '--:--';
  }
}

function getTimezoneAbbr(timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    }).formatToParts(currentTime.value);
    return parts.find((p) => p.type === 'timeZoneName')?.value || timezone;
  } catch {
    return timezone;
  }
}

function getLocalHour(timezone: string, userHour: number): number {
  try {
    // Create a date at the user's hour
    const date = new Date(selectedDate.value);
    date.setHours(userHour, 0, 0, 0);

    // Get the hour in the contact's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    return parseInt(formatter.format(date), 10);
  } catch {
    return userHour;
  }
}

function getStatus(contact: Contact, localHour: number): 'working' | 'free' | 'sleeping' {
  const workStart = contact.working_hours_start ?? 9;
  const workEnd = contact.working_hours_end ?? 17;

  if (localHour >= workStart && localHour < workEnd) {
    return 'working';
  } else if (localHour >= 22 || localHour < 7) {
    return 'sleeping';
  }
  return 'free';
}

function getHourCellClass(contact: Contact, userHour: number): string {
  const localHour = getLocalHour(contact.timezone, userHour);
  const status = getStatus(contact, localHour);

  const baseClass = isCurrentHour(userHour) && isToday.value ? 'ring-2 ring-blue-500 ring-inset ' : '';

  switch (status) {
    case 'working':
      return baseClass + 'bg-green-100 dark:bg-green-900/30';
    case 'sleeping':
      return baseClass + 'bg-slate-100 dark:bg-slate-800';
    default:
      return baseClass + 'bg-yellow-100 dark:bg-yellow-900/30';
  }
}

function getUserHourCellClass(hour: number): string {
  const workStart = 9;
  const workEnd = 17;
  const baseClass = isCurrentHour(hour) && isToday.value ? 'ring-2 ring-blue-500 ring-inset ' : '';

  if (hour >= workStart && hour < workEnd) {
    return baseClass + 'bg-green-100 dark:bg-green-900/30';
  } else if (hour >= 22 || hour < 7) {
    return baseClass + 'bg-slate-100 dark:bg-slate-800';
  }
  return baseClass + 'bg-yellow-100 dark:bg-yellow-900/30';
}

function getHourTooltip(contact: Contact, userHour: number): string {
  const localHour = getLocalHour(contact.timezone, userHour);
  const status = getStatus(contact, localHour);
  return `${contact.name}: ${formatHour(localHour)} (${status})`;
}

function isCurrentHour(hour: number): boolean {
  return currentTime.value.getHours() === hour;
}

function previousDay() {
  const newDate = new Date(selectedDate.value);
  newDate.setDate(newDate.getDate() - 1);
  selectedDate.value = newDate;
}

function nextDay() {
  const newDate = new Date(selectedDate.value);
  newDate.setDate(newDate.getDate() + 1);
  selectedDate.value = newDate;
}

function goToToday() {
  selectedDate.value = new Date();
}

function toggleContact(id: string) {
  if (selectedContactIds.value.has(id)) {
    selectedContactIds.value.delete(id);
  } else {
    selectedContactIds.value.add(id);
  }
  // Trigger reactivity
  selectedContactIds.value = new Set(selectedContactIds.value);
}

function selectAllContacts() {
  selectedContactIds.value = new Set(contactsStore.contacts.map((c) => c.id));
}

function clearSelection() {
  selectedContactIds.value = new Set();
}

onMounted(async () => {
  await contactsStore.fetchContacts();

  // Select first 5 contacts by default
  contactsStore.contacts.slice(0, 5).forEach((c) => {
    selectedContactIds.value.add(c.id);
  });

  // Update current time every minute
  timeInterval = setInterval(() => {
    currentTime.value = new Date();
  }, 60000);
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>
