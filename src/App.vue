<template>
  <div :class="[themeStore.theme.mode, `theme-${themeStore.theme.style}`]">
    <RouterView />
    <NotificationToast />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import NotificationToast from '@/components/NotificationToast.vue';
import { useThemeStore } from '@/stores/theme';

const themeStore = useThemeStore();
</script>

<style>
.theme-modern {
  --bg-gradient-from: theme('colors.blue.50');
  --bg-gradient-to: theme('colors.indigo.100');
  --card-bg: theme('colors.white');
  --card-border: theme('colors.gray.200');
  --card-shadow: theme('boxShadow.lg');
  --input-bg: theme('colors.white');
  --input-border: theme('colors.gray.300');
  --text-primary: theme('colors.gray.900');
  --text-secondary: theme('colors.gray.600');
  --text-tertiary: theme('colors.gray.400');
  --accent-primary: theme('colors.indigo.600');
  --accent-primary-hover: theme('colors.indigo.700');
  --accent-primary-light: theme('colors.indigo.500');
  --accent-bg: theme('colors.indigo.50');
  --accent-bg-hover: theme('colors.indigo.100');
  --accent-border: theme('colors.indigo.200');
  --accent-text: theme('colors.indigo.700');
  --accent-text-light: theme('colors.indigo.600');
  --danger: theme('colors.red.600');
  --danger-hover: theme('colors.red.700');
  --danger-bg: theme('colors.red.50');
  --danger-bg-hover: theme('colors.red.100');
}

.dark .theme-modern {
  --bg-gradient-from: theme('colors.gray.900');
  --bg-gradient-to: theme('colors.gray.800');
  --card-bg: theme('colors.gray.800');
  --card-border: theme('colors.gray.700');
  --card-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
  --input-bg: theme('colors.gray.700');
  --input-border: theme('colors.gray.600');
  --text-primary: theme('colors.gray.100');
  --text-secondary: theme('colors.gray.300');
  --text-tertiary: theme('colors.gray.400');
  --accent-primary: theme('colors.indigo.400');
  --accent-primary-hover: theme('colors.indigo.300');
  --accent-primary-light: theme('colors.indigo.300');
  --accent-bg: rgba(99, 102, 241, 0.1);
  --accent-bg-hover: rgba(99, 102, 241, 0.2);
  --accent-border: rgba(99, 102, 241, 0.2);
  --accent-text: theme('colors.indigo.300');
  --accent-text-light: theme('colors.indigo.200');
  --danger: theme('colors.red.400');
  --danger-hover: theme('colors.red.300');
  --danger-bg: rgba(239, 68, 68, 0.1);
  --danger-bg-hover: rgba(239, 68, 68, 0.2);
}

/* Add other theme styles here */
.theme-minimal {
  /* Minimal theme variables */
}

.theme-glassmorphic {
  /* Glassmorphic theme variables */
}

.theme-neumorphic {
  /* Neumorphic theme variables */
}

.theme-colorful {
  /* Colorful theme variables */
}
</style>