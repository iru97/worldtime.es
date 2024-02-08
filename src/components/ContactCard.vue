<template>
  <div class="card">
    <div class="flex justify-between items-start mb-4">
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ contact.name }}</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ contact.location || 'No location set' }}</p>
      </div>
      <div class="flex gap-2">
        <button
          @click="$emit('edit', contact)"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <Edit class="w-5 h-5" />
        </button>
        <button
          @click="$emit('delete', contact.id)"
          class="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <Trash2 class="w-5 h-5" />
        </button>
      </div>
    </div>

    <div class="space-y-3">
      <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
        <Mail class="w-4 h-4" />
        <a
          :href="`mailto:${contact.email}`"
          class="text-sm hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          {{ contact.email }}
        </a>
      </div>

      <div v-if="contact.phone" class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
        <Phone class="w-4 h-4" />
        <a
          :href="`tel:${contact.phone}`"
          class="text-sm hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          {{ contact.phone }}
        </a>
      </div>

      <div class="flex items-center gap-2">
        <Clock class="w-4 h-4" :class="availability.statusColor" />
        <div class="flex flex-col">
          <span class="text-sm font-medium" :class="availability.statusColor">
            {{ availability.state.currentTime }}
          </span>
          <span class="text-xs" :class="availability.statusColor">
            {{ availability.statusText }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <Timer class="w-4 h-4" />
        <span class="text-xs">
          {{ availability.state.timeUntilNextStatus }} until status change
        </span>
      </div>

      <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <Globe2 class="w-4 h-4" />
        <span class="text-xs">
          {{ availability.state.localTime }} your time
        </span>
      </div>
    </div>

    <div v-if="contact.notes" class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
      <p class="text-sm text-gray-600 dark:text-gray-400">{{ contact.notes }}</p>
    </div>

    <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
      <div class="text-xs text-gray-500 dark:text-gray-400">
        Time zone: {{ contact.timezone }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Edit, Trash2, Mail, Phone, Clock, Timer, Globe2 } from 'lucide-vue-next';
import type { Contact } from '@/types';
import { useContactAvailability } from '@/composables/useContactAvailability';

const props = defineProps<{
  contact: Contact;
}>();

defineEmits<{
  (e: 'edit', contact: Contact): void;
  (e: 'delete', id: string): void;
}>();

const availability = useContactAvailability(props.contact.timezone);
</script>