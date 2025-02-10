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