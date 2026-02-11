<template>
  <div :class="[themeStore.theme.mode, `theme-${themeStore.theme.style}`]">
    <ErrorBoundary>
      <RouterView />
    </ErrorBoundary>
    <NotificationToast />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import NotificationToast from '@/components/NotificationToast.vue';
import ErrorBoundary from '@/components/ErrorBoundary.vue';
import { useThemeStore } from '@/stores/theme';

const themeStore = useThemeStore();
</script>
