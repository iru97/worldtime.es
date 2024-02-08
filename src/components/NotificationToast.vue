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
          notification.type === 'success' && 'bg-green-50 text-green-800',
          notification.type === 'error' && 'bg-red-50 text-red-800',
          notification.type === 'info' && 'bg-blue-50 text-blue-800',
          notification.type === 'warning' && 'bg-yellow-50 text-yellow-800'
        ]"
      >
        <div class="flex-shrink-0 mt-0.5">
          <CheckCircle
            v-if="notification.type === 'success'"
            class="w-5 h-5 text-green-500"
          />
          <AlertCircle
            v-else-if="notification.type === 'error'"
            class="w-5 h-5 text-red-500"
          />
          <Info
            v-else-if="notification.type === 'info'"
            class="w-5 h-5 text-blue-500"
          />
          <AlertTriangle
            v-else-if="notification.type === 'warning'"
            class="w-5 h-5 text-yellow-500"
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
            notification.type === 'success' && 'text-green-500 hover:text-green-600',
            notification.type === 'error' && 'text-red-500 hover:text-red-600',
            notification.type === 'info' && 'text-blue-500 hover:text-blue-600',
            notification.type === 'warning' && 'text-yellow-500 hover:text-yellow-600'
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

<style scoped>
.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}

@keyframes slide-up {
  from {
    transform: translateY(1rem);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>