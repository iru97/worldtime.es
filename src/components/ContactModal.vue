<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div class="card max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-semibold text-[var(--text-primary)]">
          {{ props.contact ? $t('contacts.edit') : $t('contacts.addNew') }}
        </h2>
        <button
          @click="$emit('close')"
          class="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X class="w-6 h-6" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label for="name" class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {{ $t('contacts.name') }}
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            class="input"
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {{ $t('contacts.email') }}
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="input"
          />
        </div>

        <div>
          <label for="phone" class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {{ $t('contacts.phone') }}
          </label>
          <input
            id="phone"
            v-model="form.phone"
            type="tel"
            class="input"
          />
        </div>

        <div>
          <label for="timezone-search" class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {{ $t('contacts.timezone') }}
          </label>
          <div class="relative">
            <input
              id="timezone-search"
              v-model="searchQuery"
              type="text"
              class="input pr-10"
              :placeholder="$t('contacts.selectTimezone')"
              @focus="showDropdown = true"
              @input="handleSearch"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              @click="toggleDropdown"
            >
              <ChevronDown
                class="w-5 h-5 transition-transform"
                :class="{ 'rotate-180': showDropdown }"
              />
            </button>
          </div>

          <!-- Dropdown -->
          <div
            v-if="showDropdown"
            class="absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-lg"
          >
            <div v-if="filteredTimezones.length === 0" class="p-4 text-[var(--text-secondary)] text-center">
              No results found
            </div>
            <button
              v-for="tz in filteredTimezones"
              :key="tz"
              type="button"
              class="w-full px-4 py-2 text-left hover:bg-[var(--accent-bg)] transition-colors"
              :class="{ 'bg-[var(--accent-bg)]': form.timezone === tz }"
              @click="selectTimezone(tz)"
            >
              <div class="flex flex-col">
                <span class="font-medium text-[var(--text-primary)]">
                  {{ formatCity(tz) }}
                </span>
                <span class="text-sm text-[var(--text-secondary)] flex items-center gap-2">
                  <Clock class="w-4 h-4" />
                  {{ getCurrentTime(tz) }} - {{ tz }}
                </span>
              </div>
            </button>
          </div>
        </div>

        <div>
          <label for="location" class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {{ $t('contacts.location') }}
          </label>
          <input
            id="location"
            v-model="form.location"
            type="text"
            class="input"
          />
        </div>

        <div>
          <label for="notes" class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {{ $t('contacts.notes') }}
          </label>
          <textarea
            id="notes"
            v-model="form.notes"
            rows="3"
            class="input"
          ></textarea>
        </div>

        <!-- Group Selection -->
        <div v-if="groupsStore.groups.length > 0">
          <label for="group" class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {{ $t('groups.selectGroup') }}
          </label>
          <div class="relative">
            <FolderOpen class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" aria-hidden="true" />
            <select
              id="group"
              v-model="form.group_id"
              class="input pl-10"
            >
              <option value="">{{ $t('groups.noGroup') }}</option>
              <option v-for="group in groupsStore.groups" :key="group.id" :value="group.id">
                {{ group.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Working Hours -->
        <div>
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            {{ $t('workingHours.title') }}
          </label>
          <label class="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              v-model="useDefaultHours"
              class="w-4 h-4 text-[var(--accent-primary)] rounded border-[var(--card-border)]"
            />
            <span class="text-sm text-[var(--text-secondary)]">{{ $t('workingHours.default') }}</span>
          </label>
          <div v-if="!useDefaultHours" class="grid grid-cols-2 gap-4">
            <div>
              <label for="working-start" class="block text-xs text-[var(--text-tertiary)] mb-1">
                {{ $t('workingHours.start') }}
              </label>
              <select
                id="working-start"
                v-model="form.working_hours_start"
                class="input"
              >
                <option v-for="hour in 24" :key="hour - 1" :value="hour - 1">
                  {{ (hour - 1).toString().padStart(2, '0') }}:00
                </option>
              </select>
            </div>
            <div>
              <label for="working-end" class="block text-xs text-[var(--text-tertiary)] mb-1">
                {{ $t('workingHours.end') }}
              </label>
              <select
                id="working-end"
                v-model="form.working_hours_end"
                class="input"
              >
                <option v-for="hour in 24" :key="hour - 1" :value="hour - 1">
                  {{ (hour - 1).toString().padStart(2, '0') }}:00
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="$emit('close')"
            class="btn btn-secondary"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            type="submit"
            class="btn btn-primary"
          >
            {{ props.contact ? $t('common.update') : $t('common.add') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { X, ChevronDown, Clock, FolderOpen } from 'lucide-vue-next';
import type { Contact } from '@/types';
import { TimeService } from '@/services/TimeService';
import { useGroupsStore } from '@/stores/groups';

const props = defineProps<{
  contact?: Contact;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', contact: Partial<Contact>): void;
}>();

const timeService = new TimeService();
const groupsStore = useGroupsStore();
const timezones = ref<string[]>([]);
const searchQuery = ref('');
const showDropdown = ref(false);

const useDefaultHours = ref(
  props.contact?.working_hours_start === undefined && props.contact?.working_hours_end === undefined
);

const form = ref({
  name: props.contact?.name || '',
  email: props.contact?.email || '',
  phone: props.contact?.phone || '',
  timezone: props.contact?.timezone || '',
  location: props.contact?.location || '',
  notes: props.contact?.notes || '',
  working_hours_start: props.contact?.working_hours_start ?? 9,
  working_hours_end: props.contact?.working_hours_end ?? 17,
  group_id: props.contact?.group_id || '',
});

// Update search query when timezone is selected
if (form.value.timezone) {
  searchQuery.value = formatCity(form.value.timezone);
}

const filteredTimezones = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return timezones.value.filter(tz => {
    const city = formatCity(tz).toLowerCase();
    const fullTz = tz.toLowerCase();
    return city.includes(query) || fullTz.includes(query);
  });
});

function formatCity(timezone: string): string {
  return timezone.split('/').pop()?.replace(/_/g, ' ') || timezone;
}

function getCurrentTime(timezone: string): string {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function handleSearch() {
  showDropdown.value = true;
}

function selectTimezone(timezone: string) {
  form.value.timezone = timezone;
  searchQuery.value = formatCity(timezone);
  showDropdown.value = false;
}

function toggleDropdown() {
  showDropdown.value = !showDropdown.value;
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('#timezone-search')) {
    showDropdown.value = false;
  }
}

function handleSubmit() {
  const contactData: Partial<Contact> = {
    ...form.value,
    id: props.contact?.id,
    user_id: props.contact?.user_id,
  };

  // Only include working hours if not using default
  if (useDefaultHours.value) {
    delete contactData.working_hours_start;
    delete contactData.working_hours_end;
  }

  // Handle empty group_id
  if (!contactData.group_id) {
    contactData.group_id = undefined;
  }

  emit('submit', contactData);
}

onMounted(() => {
  timezones.value = timeService.getTimezones();
  document.addEventListener('click', handleClickOutside);
  if (groupsStore.groups.length === 0) {
    groupsStore.fetchGroups();
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>