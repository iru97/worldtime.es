import { ref, computed, onUnmounted } from 'vue';
import type { TimeRange } from '@/types';

interface AvailabilityState {
  currentTime: string;
  localTime: string;
  status: 'working' | 'sleeping' | 'free';
  timeUntilNextStatus: string;
}

export function useContactAvailability(timezone: string, workingHours: TimeRange = { start: 9, end: 17 }) {
  const state = ref<AvailabilityState>({
    currentTime: '',
    localTime: '',
    status: 'free',
    timeUntilNextStatus: '',
  });

  const sleepingHours: TimeRange = { start: 23, end: 7 };

  function updateAvailability() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const localFormatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const time = formatter.format(now);
    const hour = parseInt(time.split(':')[0]);
    const minutes = parseInt(time.split(':')[1]);
    const currentMinutes = hour * 60 + minutes;

    // Calculate status
    let status: 'working' | 'sleeping' | 'free';
    let nextStatusTime: number;

    if (hour >= sleepingHours.start || hour < sleepingHours.end) {
      status = 'sleeping';
      nextStatusTime = hour >= sleepingHours.start
        ? (24 + sleepingHours.end) * 60
        : sleepingHours.end * 60;
    } else if (hour >= workingHours.start && hour < workingHours.end) {
      status = 'working';
      nextStatusTime = workingHours.end * 60;
    } else {
      status = 'free';
      if (hour < workingHours.start) {
        nextStatusTime = workingHours.start * 60;
      } else if (hour < sleepingHours.start) {
        nextStatusTime = sleepingHours.start * 60;
      } else {
        nextStatusTime = (24 + workingHours.start) * 60;
      }
    }

    // Calculate time until next status
    let minutesUntilNext = nextStatusTime - currentMinutes;
    if (minutesUntilNext < 0) {
      minutesUntilNext += 24 * 60;
    }

    const hoursUntilNext = Math.floor(minutesUntilNext / 60);
    const remainingMinutes = minutesUntilNext % 60;

    state.value = {
      currentTime: time,
      localTime: localFormatter.format(now),
      status,
      timeUntilNextStatus: `${hoursUntilNext}h ${remainingMinutes}m`,
    };
  }

  const statusColor = computed(() => {
    switch (state.value.status) {
      case 'working':
        return 'text-green-500';
      case 'sleeping':
        return 'text-indigo-400';
      default:
        return 'text-yellow-500';
    }
  });

  const statusText = computed(() => {
    switch (state.value.status) {
      case 'working':
        return 'Working';
      case 'sleeping':
        return 'Probably sleeping';
      default:
        return 'Free time';
    }
  });

  // Initial update
  updateAvailability();

  // Update every minute
  const timer = setInterval(updateAvailability, 60000);

  // Cleanup
  onUnmounted(() => {
    clearInterval(timer);
  });

  return {
    state,
    statusColor,
    statusText,
  };
}