import { ref, Ref, watch } from 'vue';
import { useEventListener } from '@vueuse/core';
import { TimeService } from '@/services/TimeService';

export function useTimeline(selectedDate: Ref<Date>, updateTimes: (date: Date) => void) {
  const timeService = new TimeService();
  const timelineRef = ref<HTMLDivElement | null>(null);
  const isDragging = ref(false);
  const dragStartX = ref<number | null>(null);
  const dragStartTime = ref<number | null>(null);
  const momentum = ref(0);
  const animationFrameId = ref<number>();
  const lastDragX = ref(0);
  const lastDragTime = ref(0);

  const updateTime = (newMinutes: number) => {
    const newDate = new Date(selectedDate.value);
    
    // Normalize minutes to 0-1439 range (24 hours * 60 minutes)
    const normalizedMinutes = ((newMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
    const newHours = Math.floor(normalizedMinutes / 60);
    const newMins = Math.floor(normalizedMinutes % 60);
    
    // Only update hours and minutes, keeping the current day
    newDate.setHours(newHours, newMins, 0, 0);
    selectedDate.value = newDate;
    updateTimes(newDate);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value || !timelineRef.value || dragStartX.value === null || dragStartTime.value === null) return;

    const width = timelineRef.value.offsetWidth;
    const deltaX = e.clientX - dragStartX.value;
    const minutesPerPixel = (24 * 60) / width;
    const minutesDelta = -(deltaX * minutesPerPixel);
    
    const startMinutes = dragStartTime.value * 60;
    const newMinutes = startMinutes + minutesDelta;

    // Track momentum
    const now = Date.now();
    const timeDelta = now - lastDragTime.value;
    const pixelDelta = e.clientX - lastDragX.value;
    
    if (timeDelta > 0) {
      momentum.value = (pixelDelta / timeDelta) * 0.5;
    }

    lastDragX.value = e.clientX;
    lastDragTime.value = now;

    updateTime(newMinutes);
  };

  const handleMouseUp = () => {
    if (!isDragging.value) return;
    
    isDragging.value = false;
    dragStartX.value = null;
    dragStartTime.value = null;

    if (Math.abs(momentum.value) > 0.1) {
      animateMomentum();
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (!timelineRef.value) return;
    
    isDragging.value = true;
    dragStartX.value = e.clientX;
    dragStartTime.value = selectedDate.value.getHours() + selectedDate.value.getMinutes() / 60;
    lastDragX.value = e.clientX;
    lastDragTime.value = Date.now();
    momentum.value = 0;
    
    if (animationFrameId.value) {
      cancelAnimationFrame(animationFrameId.value);
    }
  };

  const animateMomentum = () => {
    if (!timelineRef.value) return;

    const width = timelineRef.value.offsetWidth;
    const minutesPerPixel = (24 * 60) / width;
    const currentMinutes = selectedDate.value.getHours() * 60 + selectedDate.value.getMinutes();
    const newMinutes = currentMinutes - (momentum.value * minutesPerPixel);

    updateTime(newMinutes);
    momentum.value *= 0.95;

    if (Math.abs(momentum.value) > 0.05) {
      animationFrameId.value = requestAnimationFrame(animateMomentum);
    }
  };

  // Add event listeners
  useEventListener(document, 'mousemove', handleMouseMove);
  useEventListener(document, 'mouseup', handleMouseUp);

  // Cleanup on unmount
  watch(() => animationFrameId.value, (id) => {
    if (id) {
      return () => cancelAnimationFrame(id);
    }
  });
  
  return {
    timelineRef,
    isDragging,
    handleMouseDown,
  };
}