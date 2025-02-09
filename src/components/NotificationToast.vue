<template>
  <div
    class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full"
    :class="{ 'items-end': position === 'right', 'items-start': position === 'left' }"
  >
    <TransitionGroup
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-4 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-4 opacity-0"
    >
      <div
        v-for="notification in notificationStore.notifications"
        :key="notification.id"
        class="flex items-start gap-3 p-4 rounded-lg shadow-lg max-w-md w-full animate-slide-up"
        :class="[
          notification.type === 'success' && 'bg-[var(--accent-bg)] text-[var(--accent-text)]',
          notification.type === 'error' && 'bg-[var(--danger-bg)] text-[var(--danger)]',
          notification.type === 'info' && 'bg-[var(--accent-bg)] text-[var(--accent-text)]',
          notification.type === 'warning' && 'bg-[var(--danger-bg)] text-[var(--danger)]'
        ]"
      >
        <div class="flex-shrink-0 mt-0.5">
          <CheckCircle
            v-if="notification.type === 'success'"
            class="w-5 h-5 text-[var(--accent-text)]"
          />
          <AlertCircle
            v-else-if="notification.type === 'error'"
            class="w-5 h-5 text-[var(--danger)]"
          />
          <Info
            v-else-if="notification.type === 'info'"
            class="w-5 h-5 text-[var(--accent-text)]"
          />
          <AlertTriangle
            v-else-if="notification.type === 'warning'"
            class="w-5 h-5 text-[var(--danger)]"
          />
        </div>
        <div class="flex-1 pt-0.5">
          <p class="text-sm font-medium">
            {{ notification.message }}
          </p>
        </div>
        <button
          @click="notificationStore.remove(notification.id)"
          class="flex-shrink-0 ml-2"
          :class="[
            notification.type === 'success' && 'text-[var(--accent-text)] hover:text-[var(--accent-text-light)]',
            notification.type === 'error' && 'text-[var(--danger)] hover:text-[var(--danger-hover)]',
            notification.type === 'info' && 'text-[var(--accent-text)] hover:text-[var(--accent-text-light)]',
            notification.type === 'warning' && 'text-[var(--danger)] hover:text-[var(--danger-hover)]'
          ]"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-vue-next';
import { useNotificationStore } from '@/stores/notifications';

const props = withDefaults(defineProps<{
  position?: 'left' | 'right';
}>(), {
  position: 'right',
});

const notificationStore = useNotificationStore();
</script>