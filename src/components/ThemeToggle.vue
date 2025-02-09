<template>
  <div class="flex items-center gap-4">
    <!-- Theme Style Selector -->
    <select
      v-model="themeStore.theme.style"
      class="px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
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
      class="p-2 rounded-lg transition-colors hover:bg-[var(--accent-bg)]"
      :title="themeStore.theme.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <Sun v-if="themeStore.theme.mode === 'dark'" class="w-5 h-5 text-[var(--text-primary)]" />
      <Moon v-else class="w-5 h-5 text-[var(--text-primary)]" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next';
import { useThemeStore } from '@/stores/theme';

const themeStore = useThemeStore();
</script>