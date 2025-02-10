<template>
  <div 
    class="card w-48 hover:scale-105 transition-transform"
    :class="[
      { 'rotate-[-15deg]': rotate === 'left',
        'rotate-[10deg]': rotate === 'right',
        'rotate-[-5deg]': rotate === 'slight-left',
        'rotate-[15deg]': rotate === 'slight-right',
        'rotate-[-8deg]': rotate === 'slight-left-2' }
    ]"
  >
    <h3 class="font-medium text-[var(--text-primary)] mb-2">{{ name }}</h3>
    <p class="text-2xl font-mono font-bold text-[var(--accent-primary)]">{{ time }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  name: string;
  timezone: string;
  time: string;
  rotate?: 'left' | 'right' | 'slight-left' | 'slight-right' | 'slight-left-2';
}>();
</script>