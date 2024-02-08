import { ref, onMounted, onUnmounted } from 'vue';

interface TimeState {
  time: string;
  isAwake: boolean;
}

export function useContactTime(timezone: string) {
  const timeState = ref<TimeState>({
    time: '',
    isAwake: true,
  });
  let timer: number;

  function updateTime() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const time = formatter.format(now);
    const hour = parseInt(time.split(':')[0]);
    
    // Consider sleeping hours between 23:00 and 07:00
    const isAwake = hour >= 7 && hour < 23;

    timeState.value = {
      time,
      isAwake,
    };
  }

  onMounted(() => {
    updateTime();
    timer = window.setInterval(updateTime, 1000);
  });

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer);
    }
  });

  return timeState;
}