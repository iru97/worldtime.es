<template>
  <div class="card mb-4 sm:mb-8">
    <div class="mb-4 sm:mb-8">
      <div class="flex items-center justify-between mb-4 sm:mb-6">
        <button
          @click="handlePrevDay"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          :title="$t('nav.prevDay')"
        >
          <ChevronLeft class="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <div class="text-center px-4 sm:px-8 py-3 sm:py-4 rounded-2xl shadow-sm bg-[var(--accent-bg)] border border-[var(--accent-border)]">
          <div class="text-2xl sm:text-4xl font-mono font-bold text-[var(--accent-text)] tracking-wider mb-1">
            {{ formatTime(selectedDate) }}
          </div>
          <div class="text-xs sm:text-sm font-medium text-[var(--accent-text-light)] capitalize">
            {{ formatDate(selectedDate) }}
          </div>
        </div>
        <button
          @click="handleNextDay"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          :title="$t('nav.nextDay')"
        >
          <ChevronRight class="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <!-- Timeline -->
      <div class="relative">
        <!-- Center marker line -->
        <div class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[var(--accent-primary)] z-10"></div>

        <div
          ref="timelineRef"
          class="h-24 sm:h-32 relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
          @mousedown="handleMouseDown"
          @touchstart="handleTouchStart"
        >
          <div
            class="absolute inset-0 flex items-center transition-transform"
            :class="{ 'duration-300 ease-out': !isDragging }"
            :style="{
              transform: `translateX(${offset}px)`,
            }"
          >
            <div class="absolute inset-0 flex items-center">
              <!-- Generate 72 hours (3 days) for continuous scrolling -->
              <div
                v-for="hour in 72" 
                :key="hour"
                class="absolute flex flex-col items-center transform -translate-x-1/2"
                :style="{ left: `${((hour - 36) / 8) * 100}%` }"
                :class="{
                  'hidden sm:flex': !shouldShowHourMobile(hour)
                }"
              >
                <div
                  class="h-6 sm:h-8 w-0.5 mb-3 sm:mb-4"
                  :class="{
                    'bg-[var(--accent-primary)]': isCurrentHour(hour),
                    'bg-gray-300 dark:bg-gray-600': !isCurrentHour(hour)
                  }"
                />
                <span
                  class="text-base sm:text-lg font-mono transition-all duration-200"
                  :class="{
                    'text-[var(--accent-primary)] font-bold scale-110 sm:scale-125': isCurrentHour(hour),
                    'text-gray-400 dark:text-gray-500': !isCurrentHour(hour)
                  }"
                >
                  {{ formatHour((hour - 36) % 24) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Current Time Button -->
        <button
          @click="goToCurrentTime"
          class="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-bg)] text-[var(--accent-text)] hover:bg-[var(--accent-bg-hover)] transition-colors text-sm font-medium"
        >
          <Clock class="w-4 h-4" />
          {{ $t('timeline.currentTime') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-vue-next';

const { t } = useI18n();

const props = defineProps<{
  selectedDate: Date;
}>();

const emit = defineEmits<{
  (e: 'update', date: Date): void;
}>();

const timelineRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const offset = ref(0);
const currentHour = computed(() => props.selectedDate.getHours() + props.selectedDate.getMinutes() / 60);

function formatHour(hour: number): string {
  const normalizedHour = ((hour % 24) + 24) % 24;
  return `${normalizedHour.toString().padStart(2, '0')}:00`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function shouldShowHourMobile(hour: number): boolean {
  return hour % 6 === 0; // Show every sixth hour on mobile for more spacing
}

function isCurrentHour(hour: number): boolean {
  const normalizedHour = ((hour - 36) % 24 + 24) % 24;
  return Math.abs(normalizedHour - currentHour.value) < 0.5;
}

function handlePrevDay() {
  const newDate = new Date(props.selectedDate);
  newDate.setDate(props.selectedDate.getDate() - 1);
  emit('update', newDate);
}

function handleNextDay() {
  const newDate = new Date(props.selectedDate);
  newDate.setDate(props.selectedDate.getDate() + 1);
  emit('update', newDate);
}

function centerTimelineOnCurrentHour() {
  if (!timelineRef.value) return;
  const width = timelineRef.value.offsetWidth;
  const hourWidth = width / 8; // Ajustado para coincidir con el espaciado
  offset.value = width / 2 - (currentHour.value * hourWidth);
}

function goToCurrentTime() {
  const now = new Date();
  emit('update', now);
  centerTimelineOnCurrentHour();
}

function handleMouseDown(e: MouseEvent) {
  isDragging.value = true;
  const startX = e.clientX - offset.value;
  
  function handleMouseMove(e: MouseEvent) {
    if (!isDragging.value || !timelineRef.value) return;
    const deltaX = e.clientX - startX;
    updateTimeFromOffset(deltaX);
  }
  
  function handleMouseUp() {
    isDragging.value = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

function handleTouchStart(e: TouchEvent) {
  isDragging.value = true;
  const startX = e.touches[0].clientX - offset.value;
  
  function handleTouchMove(e: TouchEvent) {
    if (!isDragging.value || !timelineRef.value) return;
    const deltaX = e.touches[0].clientX - startX;
    updateTimeFromOffset(deltaX);
  }
  
  function handleTouchEnd() {
    isDragging.value = false;
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  }
  
  document.addEventListener('touchmove', handleTouchMove);
  document.addEventListener('touchend', handleTouchEnd);
}

function updateTimeFromOffset(newOffset: number) {
  if (!timelineRef.value) return;
  
  const width = timelineRef.value.offsetWidth;
  const hourWidth = width / 8; // Ajustado para coincidir con el espaciado
  
  // Calculate the time based on the offset
  const hours = -(newOffset - width / 2) / hourWidth;
  
  // Normalize hours to 0-24 range
  const normalizedHours = ((hours % 24) + 24) % 24;
  
  // Calculate minutes
  const minutes = Math.round((normalizedHours % 1) * 60);
  const wholeHours = Math.floor(normalizedHours);
  
  // Create new date with normalized time
  const newDate = new Date(props.selectedDate);
  newDate.setHours(wholeHours, minutes, 0, 0);
  
  // Update the offset
  offset.value = newOffset;
  
  // If we've scrolled too far, reset the offset but keep the time
  if (Math.abs(offset.value) > width) {
    offset.value = offset.value % width;
  }
  
  emit('update', newDate);
}

// Watch for changes in selectedDate and recenter the timeline
watch(() => props.selectedDate, () => {
  centerTimelineOnCurrentHour();
}, { immediate: true });

// Initialize the timeline position
onMounted(() => {
  centerTimelineOnCurrentHour();
});
</script>