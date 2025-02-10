<template>
  <div class="card hover:scale-105 transition-transform">
    <h3 class="font-medium text-[var(--text-primary)] mb-1">{{ name }}</h3>
    <p class="text-sm text-[var(--text-secondary)] mb-2">{{ formatTimezone(timezone) }}</p>
    <p class="text-2xl font-mono font-bold text-[var(--accent-primary)]">{{ time }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  name: string;
  timezone: string;
  time: string;
}>();

function formatTimezone(timezone: string): string {
  return timezone.split('/')[1].replace(/_/g, ' ');
}
</script>