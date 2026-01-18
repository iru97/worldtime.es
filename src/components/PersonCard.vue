<template>
  <div 
    class="card hover:scale-105 transition-transform"
    :class="[
      fullWidth ? 'w-full' : 'w-64',
      { 'rotate-[-15deg]': rotate === 'left',
        'rotate-[10deg]': rotate === 'right',
        'rotate-[-5deg]': rotate === 'slight-left',
        'rotate-[15deg]': rotate === 'slight-right',
        'rotate-[-8deg]': rotate === 'slight-left-2' }
    ]"
  >
    <h3 class="font-medium text-[var(--text-primary)] mb-1">{{ name }}</h3>
    <p class="text-sm text-[var(--text-secondary)] mb-2">{{ formatTimezone(timezone) }}</p>
    <p class="text-2xl font-mono font-bold text-[var(--accent-primary)]">{{ time }}</p>
  </div>
</template>

<script setup lang="ts">
import { formatTimezone } from '@/utils/timezone';

defineProps<{
  name: string;
  timezone: string;
  time: string;
  fullWidth?: boolean;
  rotate?: 'left' | 'right' | 'slight-left' | 'slight-right' | 'slight-left-2';
}>();
</script>