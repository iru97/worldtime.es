<template>
  <div class="flex items-center gap-4">
    <!-- Theme Style Selector -->
    <select
      v-model="themeStore.theme.style"
      class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
      @change="themeStore.setThemeStyle($event.target.value)"
    >
      <option value="modern">Modern</option>
      <option value="minimal">Minimal</option>
      <option value="glassmorphic">Glass</option>
      <option value="neumorphic">Neumorph</option>
      <option value="colorful">Colorful</option>
    </select>

    <!-- Light/Dark Mode Toggle -->
    <button
      @click="themeStore.toggleThemeMode"
      class="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
      :title="themeStore.theme.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <Sun v-if="themeStore.theme.mode === 'dark'" class="w-5 h-5 text-gray-600 dark:text-gray-300" />
      <Moon v-else class="w-5 h-5 text-gray-600 dark:text-gray-300" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next';
import { useThemeStore } from '@/stores/theme';

const themeStore = useThemeStore();
</script>