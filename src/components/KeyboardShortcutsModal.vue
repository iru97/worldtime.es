<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    @click.self="emit('close')"
  >
    <div class="card max-w-md w-full p-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <Keyboard class="w-6 h-6 text-[var(--accent-primary)]" aria-hidden="true" />
          <h2 class="text-xl font-semibold text-[var(--text-primary)]">Keyboard Shortcuts</h2>
        </div>
        <button
          @click="emit('close')"
          class="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Close"
        >
          <X class="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <div class="space-y-3">
        <div
          v-for="shortcut in shortcuts"
          :key="shortcut.key + (shortcut.ctrl ? '-ctrl' : '')"
          class="flex items-center justify-between py-2 border-b border-[var(--card-border)] last:border-0"
        >
          <span class="text-[var(--text-secondary)]">{{ shortcut.description }}</span>
          <div class="flex items-center gap-1">
            <kbd
              v-if="shortcut.ctrl"
              class="px-2 py-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded text-sm font-mono"
            >
              {{ isMac ? '⌘' : 'Ctrl' }}
            </kbd>
            <kbd
              v-if="shortcut.shift"
              class="px-2 py-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded text-sm font-mono"
            >
              Shift
            </kbd>
            <kbd
              v-if="shortcut.alt"
              class="px-2 py-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded text-sm font-mono"
            >
              {{ isMac ? '⌥' : 'Alt' }}
            </kbd>
            <kbd class="px-2 py-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded text-sm font-mono">
              {{ formatKey(shortcut.key) }}
            </kbd>
          </div>
        </div>
      </div>

      <p class="mt-6 text-sm text-[var(--text-tertiary)] text-center">
        Press <kbd class="px-1.5 py-0.5 bg-[var(--bg-secondary)] rounded text-xs">/</kbd> anytime to show this dialog
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Keyboard, X } from 'lucide-vue-next';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
}

defineProps<{
  show: boolean;
  shortcuts: Shortcut[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const isMac = computed(() => navigator.platform.toLowerCase().includes('mac'));

function formatKey(key: string): string {
  if (key === 'Escape') return 'Esc';
  if (key === '/') return '/';
  return key.toUpperCase();
}
</script>
