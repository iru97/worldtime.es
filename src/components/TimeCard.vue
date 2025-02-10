<template>
  <div class="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-[var(--card-shadow)] p-6 hover:scale-105 transition-transform">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-xl font-semibold text-[var(--text-primary)] mb-1">{{ contact.name }}</h3>
        <p class="text-sm text-[var(--text-secondary)]">
          {{ contact.location || $t('contacts.noLocation') }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Clock class="w-5 h-5" :class="availability.statusColor" />
        <span class="text-sm font-medium" :class="availability.statusColor">
          {{ availability.statusText }}
        </span>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <div>
        <div class="text-3xl font-mono font-bold text-[var(--accent-primary)] mb-1">
          {{ availability.state.currentTime }}
        </div>
        <div class="text-sm text-[var(--text-secondary)]">
          {{ contact.timezone }}
        </div>
      </div>
      <div class="text-right">
        <div class="text-sm text-[var(--text-secondary)] mb-1">
          {{ $t('contacts.yourTime') }}
        </div>
        <div class="text-base font-medium text-[var(--text-primary)]">
          {{ availability.state.localTime }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Clock } from 'lucide-vue-next';
import type { Contact } from '@/types';
import { useContactAvailability } from '@/composables/useContactAvailability';

const props = defineProps<{
  contact: Contact;
}>();

const availability = useContactAvailability(props.contact.timezone);
</script>