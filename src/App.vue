<template>
  <div :class="['app', themeStore.theme.style, themeStore.theme.mode]">
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
.app {
  min-height: 100vh;
}
</style>