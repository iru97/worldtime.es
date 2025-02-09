<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="grid gap-6 md:grid-cols-2">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('form.name.label') }}
        </label>
        <input
          type="text"
          id="name"
          v-model="form.name"
          required
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          :placeholder="t('form.name.placeholder')"
        />
      </div>

      <div>
        <label for="timezone" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ t('form.timezone.label') }}
        </label>
        <select
          id="timezone"
          v-model="form.timezone"
          required
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="">{{ t('form.timezone.placeholder') }}</option>
          <optgroup 
            v-for="(zones, region) in groupedTimezones" 
            :key="region" 
            :label="region"
          >
            <option 
              v-for="zone in zones" 
              :key="zone" 
              :value="zone"
            >
              {{ formatTimezoneName(zone) }} ({{ getCurrentTime(zone) }})
            </option>
          </optgroup>
        </select>
      </div>
    </div>

    <div class="flex justify-end">
      <button
        type="submit"
        class="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
      >
        <Plus class="w-5 h-5" />
        {{ t('form.add') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus } from 'lucide-vue-next';
import { TimeService } from '@/services/TimeService';

const { t } = useI18n();
const timeService = new TimeService();

const form = ref({
  name: '',
  timezone: ''
});

// Group timezones by region
const groupedTimezones = computed(() => {
  return timeService.getTimezones().reduce((groups, zone) => {
    const region = zone.split('/')[0];
    if (!groups[region]) {
      groups[region] = [];
    }
    groups[region].push(zone);
    return groups;
  }, {} as Record<string, string[]>);
});

function formatTimezoneName(timezone: string): string {
  return timezone.split('/')[1].replace(/_/g, ' ');
}

function getCurrentTime(timezone: string): string {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function handleSubmit() {
  if (!form.value.name || !form.value.timezone) return;
  
  emit('submit', form.value.name, form.value.timezone);
  form.value.name = '';
  form.value.timezone = '';
}

const emit = defineEmits<{
  (e: 'submit', name: string, timezone: string): void;
}>();
</script>