<template>
  <div class="card mb-8">
    <div class="mb-8">
      <div class="flex items-center justify-between mb-6">
        <button
          @click="handlePrevDay"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          :title="t('nav.prevDay')"
        >
          <ChevronLeft class="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <div class="text-center px-8 py-4 rounded-2xl shadow-sm bg-[var(--accent-bg)] border border-[var(--accent-border)]">
          <div class="text-4xl font-mono font-bold text-[var(--accent-text)] tracking-wider mb-1">
            {{ formatTime(selectedDate) }}
          </div>
          <div class="text-sm font-medium text-[var(--accent-text-light)] capitalize">
            {{ formatDate(selectedDate) }}
          </div>
        </div>
        <button
          @click="handleNextDay"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          :title="t('nav.nextDay')"
        >
          <ChevronRight class="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <!-- Timeline -->
      <div class="relative">
        <div class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[var(--accent-primary)]"></div>

        <div
          ref="timelineRef"
          class="h-20 relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
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
              <div
                v-for="hour in 72" 
                :key="hour"
                class="absolute flex flex-col items-center transform -translate-x-1/2"
                :style="{ left: `${((hour - 24) / 24) * 100}%` }"
              >
                <div
                  class="h-4 w-0.5 mb-2"
                  :class="{
                    'bg-[var(--accent-primary)]': Math.abs(((hour - 24) % 24) - currentHour) <= 1,
                    'bg-gray-300 dark:bg-gray-600': Math.abs(((hour - 24) % 24) - currentHour) > 1
                  }"
                />
                <span
                  class="text-sm font-mono transition-all duration-200"
                  :class="{
                    'text-[var(--accent-primary)] font-bold scale-125': Math.abs(((hour - 24) % 24) - currentHour) < 1,
                    'text-[var(--accent-primary-light)] font-medium scale-110': Math.abs(((hour - 24) % 24) - currentHour) === 1,
                    'text-gray-400 dark:text-gray-500': Math.abs(((hour - 24) % 24) - currentHour) > 1
                  }"
                >
                  {{ formatHour((hour - 24) % 24) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

const props = defineProps<{
  selectedDate: Date;
}>();

const emit = defineEmits<{
  (e: 'update', date: Date): void;
}>();

const { t } = useI18n();
const timelineRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const startX = ref(0);
const offset = ref(0);
const currentHour = computed(() => props.selectedDate.getHours() + props.selectedDate.getMinutes() / 60);

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
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
  const hourWidth = width / 24;
  offset.value = width / 2 - (currentHour.value * hourWidth);
}

function handleMouseDown(e: MouseEvent) {
  isDragging.value = true;
  startX.value = e.clientX - offset.value;
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

function handleTouchStart(e: TouchEvent) {
  isDragging.value = true;
  startX.value = e.touches[0].clientX - offset.value;
  document.addEventListener('touchmove', handleTouchMove);
  document.addEventListener('touchend', handleTouchEnd);
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value || !timelineRef.value) return;
  const deltaX = e.clientX - startX.value;
  updateTimeFromOffset(deltaX);
}

function handleTouchMove(e: TouchEvent) {
  if (!isDragging.value || !timelineRef.value) return;
  const deltaX = e.touches[0].clientX - startX.value;
  updateTimeFromOffset(deltaX);
}

function handleMouseUp() {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
}

function handleTouchEnd() {
  isDragging.value = false;
  document.removeEventListener('touchmove', handleTouchMove);
  document.removeEventListener('touchend', handleTouchEnd);
}

function updateTimeFromOffset(newOffset: number) {
  if (!timelineRef.value) return;
  
  const width = timelineRef.value.offsetWidth;
  const hourWidth = width / 24;
  
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
  
  emit('update', newDate);
}

// Watch for changes in selectedDate and recenter the timeline
watch(() => props.selectedDate, () => {
  centerTimelineOnCurrentHour();
}, { immediate: true });

onMounted(() => {
  centerTimelineOnCurrentHour();
});
</script>