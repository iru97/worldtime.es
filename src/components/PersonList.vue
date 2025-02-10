<template>
  <div class="space-y-4">
    <!-- Time Groups -->
    <div v-for="(group, region) in groupedPeople" :key="region" class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{{ region }}</h3>
      
      <div
        v-for="person in group"
        :key="person.id"
        class="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all"
      >
        <div class="w-48">
          <h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-1">{{ person.name }}</h4>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ person.timezone }}</p>
        </div>
        
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <Clock 
              class="w-6 h-6"
              :class="getStatusColor(person.timezone)"
            />
            <span class="text-3xl font-mono font-bold text-gray-800 dark:text-gray-200">
              {{ person.currentTime }}
            </span>
          </div>
          <div class="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
            {{ person.currentDate }}
          </div>
          <div class="mt-2 text-sm">
            <span :class="getStatusColor(person.timezone)">
              {{ getStatusText(person.timezone) }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="emit('edit', person)"
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            :title="$t('person.edit')"
          >
            <Edit class="w-5 h-5" />
          </button>
          <button
            @click="emit('delete', person.id)"
            class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            :title="$t('person.delete')"
          >
            <Trash2 class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Person } from '@/types';
import { Clock, Edit, Trash2 } from 'lucide-vue-next';
import { useContactAvailability } from '@/composables/useContactAvailability';

const props = defineProps<{
  people: Person[];
}>();

const emit = defineEmits<{
  (e: 'edit', person: Person): void;
  (e: 'delete', id: string): void;
}>();

// Group people by region
const groupedPeople = computed(() => {
  return props.people.reduce((groups, person) => {
    const region = person.timezone.split('/')[0];
    if (!groups[region]) {
      groups[region] = [];
    }
    groups[region].push(person);
    return groups;
  }, {} as Record<string, Person[]>);
});

function getStatusColor(timezone: string) {
  const { statusColor } = useContactAvailability(timezone);
  return statusColor.value;
}

function getStatusText(timezone: string) {
  const { statusText } = useContactAvailability(timezone);
  return statusText.value;
}
</script>