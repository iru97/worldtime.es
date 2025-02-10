<template>
  <div class="card w-full">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-lg font-medium text-[var(--text-primary)]">{{ name }}</h3>
        <p class="text-sm text-[var(--text-secondary)]">{{ formatTimezone(timezone) }}</p>
      </div>
      <div class="flex items-center gap-3">
        <Clock class="w-5 h-5" :class="availability.statusColor" />
        <div class="text-right">
          <p class="text-2xl font-mono font-bold" :class="availability.statusColor">{{ time }}</p>
          <p class="text-sm" :class="availability.statusColor">{{ availability.statusText }}</p>
        </div>
      </div>
    </div>
    <div class="flex items-center justify-between text-sm text-[var(--text-secondary)]">
      <div class="flex items-center gap-2">
        <Timer class="w-4 h-4" />
        <span>{{ availability.state.timeUntilNextStatus }} {{ $t('contacts.untilStatusChange') }}</span>
      </div>
      <div class="flex items-center gap-2">
        <Globe2 class="w-4 h-4" />
        <span>{{ availability.state.localTime }} ({{ $t('contacts.yourTime') }})</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Clock, Timer, Globe2 } from 'lucide-vue-next';
import { useContactAvailability } from '@/composables/useContactAvailability';

const props = defineProps<{
  name: string;
  timezone: string;
  time: string;
}>();

const availability = useContactAvailability(props.timezone);

function formatTimezone(timezone: string): string {
  return timezone.split('/')[1].replace(/_/g, ' ');
}
</script>