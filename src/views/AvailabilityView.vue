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
                {{ t('availability.title') }}
              </h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ t('availability.subtitle') }}
              </p>
            </div>
          </div>
          <button
            @click="showCreateModal = true"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus class="w-5 h-5" />
            <span class="hidden sm:inline">{{ t('availability.newSchedule') }}</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-blue-600" />
      </div>

      <!-- Content -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Schedules List -->
        <div class="lg:col-span-1 space-y-4">
          <h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {{ t('availability.yourSchedules') }}
          </h2>

          <!-- Empty State -->
          <div
            v-if="!hasSchedules"
            class="text-center py-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
          >
            <Clock class="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p class="text-gray-500 dark:text-gray-400 mb-4">
              {{ t('availability.noSchedules') }}
            </p>
            <button
              @click="showCreateModal = true"
              class="text-blue-600 hover:underline"
            >
              {{ t('availability.createFirst') }}
            </button>
          </div>

          <!-- Schedules -->
          <div v-else class="space-y-2">
            <button
              v-for="schedule in schedules"
              :key="schedule.id"
              @click="selectSchedule(schedule.id)"
              class="w-full flex items-center gap-3 p-4 rounded-lg text-left transition-colors"
              :class="
                currentSchedule?.id === schedule.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
              "
            >
              <Clock class="w-5 h-5 text-gray-400" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="font-medium text-gray-900 dark:text-white truncate">
                    {{ schedule.name }}
                  </p>
                  <span
                    v-if="schedule.is_default"
                    class="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                  >
                    {{ t('availability.default') }}
                  </span>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ schedule.timezone }}
                </p>
              </div>
              <ChevronRight class="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <!-- Schedule Editor -->
        <div v-if="currentSchedule" class="lg:col-span-2 space-y-6">
          <!-- Schedule Header -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ currentSchedule.name }}
                </h2>
                <p class="text-gray-500 dark:text-gray-400">
                  {{ t('availability.timezone') }}: {{ currentSchedule.timezone }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="!currentSchedule.is_default"
                  @click="handleSetDefault"
                  class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {{ t('availability.setAsDefault') }}
                </button>
                <button
                  @click="confirmDeleteSchedule"
                  class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  :aria-label="t('common.delete')"
                >
                  <Trash2 class="w-5 h-5 text-red-500" />
                </button>
              </div>
            </div>

            <!-- Weekly Schedule -->
            <div class="space-y-4">
              <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ t('availability.weeklyHours') }}
              </h3>

              <div
                v-for="(daySchedule, day) in currentSchedule.schedule"
                :key="day"
                class="flex items-center gap-4 py-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
              >
                <!-- Day Toggle -->
                <div class="w-32 flex items-center gap-2">
                  <button
                    @click="toggleDay(day)"
                    class="w-10 h-6 rounded-full transition-colors relative"
                    :class="daySchedule.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
                  >
                    <span
                      class="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform"
                      :class="daySchedule.enabled ? 'left-5' : 'left-1'"
                    ></span>
                  </button>
                  <span
                    class="text-sm font-medium"
                    :class="daySchedule.enabled ? 'text-gray-900 dark:text-white' : 'text-gray-400'"
                  >
                    {{ t(`availability.days.${day}`) }}
                  </span>
                </div>

                <!-- Time Slots -->
                <div v-if="daySchedule.enabled" class="flex-1 flex items-center gap-2 flex-wrap">
                  <div
                    v-for="(slot, index) in daySchedule.slots"
                    :key="index"
                    class="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5"
                  >
                    <input
                      :value="slot.start"
                      @change="updateSlotTime(day, index, 'start', ($event.target as HTMLInputElement).value)"
                      type="time"
                      class="bg-transparent border-none text-sm focus:ring-0 p-0 w-20"
                    />
                    <span class="text-gray-400">-</span>
                    <input
                      :value="slot.end"
                      @change="updateSlotTime(day, index, 'end', ($event.target as HTMLInputElement).value)"
                      type="time"
                      class="bg-transparent border-none text-sm focus:ring-0 p-0 w-20"
                    />
                    <button
                      v-if="daySchedule.slots.length > 1"
                      @click="removeSlot(day, index)"
                      class="text-gray-400 hover:text-red-500"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    @click="addSlot(day)"
                    class="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  >
                    <Plus class="w-4 h-4" />
                    {{ t('availability.addSlot') }}
                  </button>
                </div>

                <p v-else class="flex-1 text-sm text-gray-400 italic">
                  {{ t('availability.unavailable') }}
                </p>
              </div>
            </div>

            <!-- Save Button -->
            <div class="mt-6 flex justify-end">
              <button
                @click="handleSaveSchedule"
                :disabled="!hasChanges"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ t('common.saveChanges') }}
              </button>
            </div>
          </div>

          <!-- Date Overrides -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ t('availability.dateOverrides') }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ t('availability.dateOverridesDescription') }}
                </p>
              </div>
              <button
                @click="showOverrideModal = true"
                class="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Plus class="w-4 h-4" />
                {{ t('availability.addOverride') }}
              </button>
            </div>

            <!-- Overrides List -->
            <div v-if="currentSchedule.overrides?.length" class="space-y-2">
              <div
                v-for="override in currentSchedule.overrides"
                :key="override.date"
                class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center"
                    :class="override.available ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'"
                  >
                    <CalendarOff
                      v-if="!override.available"
                      class="w-5 h-5 text-red-500"
                    />
                    <Calendar v-else class="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ formatOverrideDate(override.date) }}
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ override.available ? formatOverrideSlots(override.slots) : t('availability.dayOff') }}
                    </p>
                  </div>
                </div>
                <button
                  @click="handleRemoveOverride(override.date)"
                  class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <X class="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            <p v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
              {{ t('availability.noOverrides') }}
            </p>
          </div>
        </div>
      </div>
    </main>

    <!-- Create Schedule Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="showCreateModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {{ t('availability.createSchedule') }}
        </h2>
        <form @submit.prevent="handleCreateSchedule">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('availability.scheduleName') }}
              </label>
              <input
                v-model="newSchedule.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                :placeholder="t('availability.scheduleNamePlaceholder')"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('availability.timezone') }}
              </label>
              <select
                v-model="newSchedule.timezone"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option v-for="tz in commonTimezones" :key="tz" :value="tz">
                  {{ tz }}
                </option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <input
                v-model="newSchedule.isDefault"
                type="checkbox"
                id="isDefault"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label for="isDefault" class="text-sm text-gray-700 dark:text-gray-300">
                {{ t('availability.setAsDefault') }}
              </label>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button
              type="button"
              @click="showCreateModal = false"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="!newSchedule.name"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {{ t('availability.create') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Override Modal -->
    <div
      v-if="showOverrideModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="showOverrideModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {{ t('availability.addDateOverride') }}
        </h2>
        <form @submit.prevent="handleAddOverride">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('availability.date') }}
              </label>
              <input
                v-model="overrideForm.date"
                type="date"
                required
                :min="minOverrideDate"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('availability.overrideType') }}
              </label>
              <div class="flex gap-4">
                <label class="flex items-center gap-2">
                  <input
                    v-model="overrideForm.available"
                    type="radio"
                    :value="false"
                    class="text-blue-600"
                  />
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ t('availability.dayOff') }}</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="overrideForm.available"
                    type="radio"
                    :value="true"
                    class="text-blue-600"
                  />
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ t('availability.customHours') }}</span>
                </label>
              </div>
            </div>
            <div v-if="overrideForm.available" class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('availability.availableHours') }}
              </label>
              <div class="flex items-center gap-2">
                <input
                  v-model="overrideForm.startTime"
                  type="time"
                  class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <span class="text-gray-400">-</span>
                <input
                  v-model="overrideForm.endTime"
                  type="time"
                  class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('availability.reason') }} ({{ t('common.optional') }})
              </label>
              <input
                v-model="overrideForm.reason"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                :placeholder="t('availability.reasonPlaceholder')"
              />
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button
              type="button"
              @click="showOverrideModal = false"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="!overrideForm.date"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {{ t('availability.addOverride') }}
            </button>
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
import { useAvailabilityStore } from '@/stores/availability';
import { useAuthStore } from '@/stores/auth';
import {
  ArrowLeft,
  Plus,
  Clock,
  ChevronRight,
  Trash2,
  X,
  Calendar,
  CalendarOff,
  Loader2,
} from 'lucide-vue-next';
import type { AvailabilityScheduleData, TimeSlot } from '@/types';

const { t } = useI18n();
const availabilityStore = useAvailabilityStore();
const authStore = useAuthStore();

const { schedules, currentSchedule, loading, hasSchedules } = storeToRefs(availabilityStore);
const { selectSchedule, createSchedule, updateSchedule, deleteSchedule, setDefault, addOverride, removeOverride } =
  availabilityStore;

// Modals
const showCreateModal = ref(false);
const showOverrideModal = ref(false);

// Forms
const newSchedule = ref({
  name: '',
  timezone: authStore.user?.timezone || 'UTC',
  isDefault: false,
});

const overrideForm = ref({
  date: '',
  available: false,
  startTime: '09:00',
  endTime: '17:00',
  reason: '',
});

// Local copy of schedule for editing
const editedSchedule = ref<AvailabilityScheduleData | null>(null);
const hasChanges = ref(false);

// Common timezones
const commonTimezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Australia/Sydney',
];

const minOverrideDate = computed(() => {
  return new Date().toISOString().split('T')[0];
});

// Watch for schedule changes
watch(currentSchedule, (newSchedule) => {
  if (newSchedule) {
    editedSchedule.value = JSON.parse(JSON.stringify(newSchedule.schedule));
    hasChanges.value = false;
  }
}, { immediate: true });

onMounted(() => {
  availabilityStore.fetchSchedules();
});

function toggleDay(day: string) {
  if (!editedSchedule.value) return;

  const dayKey = day as keyof AvailabilityScheduleData;
  editedSchedule.value[dayKey].enabled = !editedSchedule.value[dayKey].enabled;

  // Add default slot if enabling and no slots exist
  if (editedSchedule.value[dayKey].enabled && editedSchedule.value[dayKey].slots.length === 0) {
    editedSchedule.value[dayKey].slots = [{ start: '09:00', end: '17:00' }];
  }

  hasChanges.value = true;
}

function updateSlotTime(day: string, slotIndex: number, field: 'start' | 'end', value: string) {
  if (!editedSchedule.value) return;

  const dayKey = day as keyof AvailabilityScheduleData;
  editedSchedule.value[dayKey].slots[slotIndex][field] = value;
  hasChanges.value = true;
}

function addSlot(day: string) {
  if (!editedSchedule.value) return;

  const dayKey = day as keyof AvailabilityScheduleData;
  const lastSlot = editedSchedule.value[dayKey].slots[editedSchedule.value[dayKey].slots.length - 1];

  // Create new slot starting after the last one
  const newStart = lastSlot?.end || '13:00';
  const newEnd = addHours(newStart, 4);

  editedSchedule.value[dayKey].slots.push({ start: newStart, end: newEnd });
  hasChanges.value = true;
}

function removeSlot(day: string, slotIndex: number) {
  if (!editedSchedule.value) return;

  const dayKey = day as keyof AvailabilityScheduleData;
  editedSchedule.value[dayKey].slots.splice(slotIndex, 1);
  hasChanges.value = true;
}

function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number);
  const newH = Math.min(23, h + hours);
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

async function handleCreateSchedule() {
  const result = await createSchedule({
    name: newSchedule.value.name,
    timezone: newSchedule.value.timezone,
    is_default: newSchedule.value.isDefault,
  });

  if (result) {
    showCreateModal.value = false;
    newSchedule.value = {
      name: '',
      timezone: authStore.user?.timezone || 'UTC',
      isDefault: false,
    };
  }
}

async function handleSaveSchedule() {
  if (!editedSchedule.value || !currentSchedule.value) return;

  const success = await updateSchedule({
    schedule: editedSchedule.value,
  });

  if (success) {
    hasChanges.value = false;
  }
}

async function handleSetDefault() {
  if (!currentSchedule.value) return;
  await setDefault(currentSchedule.value.id);
}

function confirmDeleteSchedule() {
  if (!currentSchedule.value) return;

  if (confirm(t('availability.confirmDelete', { name: currentSchedule.value.name }))) {
    deleteSchedule(currentSchedule.value.id);
  }
}

async function handleAddOverride() {
  const override = {
    date: overrideForm.value.date,
    available: overrideForm.value.available,
    slots: overrideForm.value.available
      ? [{ start: overrideForm.value.startTime, end: overrideForm.value.endTime }]
      : undefined,
    reason: overrideForm.value.reason || undefined,
  };

  const success = await addOverride(override);

  if (success) {
    showOverrideModal.value = false;
    overrideForm.value = {
      date: '',
      available: false,
      startTime: '09:00',
      endTime: '17:00',
      reason: '',
    };
  }
}

async function handleRemoveOverride(date: string) {
  await removeOverride(date);
}

function formatOverrideDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatOverrideSlots(slots?: TimeSlot[]): string {
  if (!slots || slots.length === 0) return '';
  return slots.map((s) => `${s.start} - ${s.end}`).join(', ');
}
</script>
