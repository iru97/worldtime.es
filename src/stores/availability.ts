import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { availabilityService } from '@/services/api/AvailabilityService';
import { useNotificationStore } from './notifications';
import type { AvailabilitySchedule, AvailabilityOverride, AvailabilityScheduleData } from '@/types';

export const useAvailabilityStore = defineStore('availability', () => {
  // State
  const schedules = ref<AvailabilitySchedule[]>([]);
  const currentSchedule = ref<AvailabilitySchedule | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const hasSchedules = computed(() => schedules.value.length > 0);

  const defaultSchedule = computed(() =>
    schedules.value.find((s) => s.is_default) || schedules.value[0] || null
  );

  const scheduleNames = computed(() => schedules.value.map((s) => ({ id: s.id, name: s.name })));

  // Actions
  async function fetchSchedules() {
    loading.value = true;
    error.value = null;

    try {
      const result = await availabilityService.getSchedules();
      if (result.success && result.data) {
        schedules.value = result.data;
        // Auto-select default schedule
        if (!currentSchedule.value) {
          currentSchedule.value = defaultSchedule.value;
        }
      } else {
        error.value = result.error?.message || 'Failed to fetch schedules';
      }
    } finally {
      loading.value = false;
    }
  }

  async function selectSchedule(scheduleId: string) {
    const schedule = schedules.value.find((s) => s.id === scheduleId);
    if (schedule) {
      currentSchedule.value = schedule;
    }
  }

  async function createSchedule(data: {
    name: string;
    timezone: string;
    schedule?: AvailabilityScheduleData;
    is_default?: boolean;
  }): Promise<AvailabilitySchedule | null> {
    const notifications = useNotificationStore();
    loading.value = true;

    try {
      const result = await availabilityService.createSchedule(data);
      if (result.success && result.data) {
        // If set as default, update other schedules
        if (data.is_default) {
          schedules.value = schedules.value.map((s) => ({
            ...s,
            is_default: false,
          }));
        }
        schedules.value.push(result.data);
        currentSchedule.value = result.data;
        notifications.success('Schedule created successfully');
        return result.data;
      } else {
        notifications.error(result.error?.message || 'Failed to create schedule');
        return null;
      }
    } finally {
      loading.value = false;
    }
  }

  async function updateSchedule(data: Partial<AvailabilitySchedule>): Promise<boolean> {
    if (!currentSchedule.value) return false;

    const notifications = useNotificationStore();

    try {
      const result = await availabilityService.updateSchedule(currentSchedule.value.id, data);
      if (result.success && result.data) {
        // If set as default, update other schedules
        if (data.is_default) {
          schedules.value = schedules.value.map((s) => ({
            ...s,
            is_default: s.id === currentSchedule.value?.id,
          }));
        }

        const index = schedules.value.findIndex((s) => s.id === currentSchedule.value?.id);
        if (index >= 0) {
          schedules.value[index] = result.data;
        }
        currentSchedule.value = result.data;
        notifications.success('Schedule updated successfully');
        return true;
      } else {
        notifications.error(result.error?.message || 'Failed to update schedule');
        return false;
      }
    } catch {
      notifications.error('Failed to update schedule');
      return false;
    }
  }

  async function deleteSchedule(scheduleId: string): Promise<boolean> {
    const notifications = useNotificationStore();

    try {
      const result = await availabilityService.deleteSchedule(scheduleId);
      if (result.success) {
        schedules.value = schedules.value.filter((s) => s.id !== scheduleId);
        if (currentSchedule.value?.id === scheduleId) {
          currentSchedule.value = defaultSchedule.value;
        }
        notifications.success('Schedule deleted successfully');
        return true;
      } else {
        notifications.error(result.error?.message || 'Failed to delete schedule');
        return false;
      }
    } catch {
      notifications.error('Failed to delete schedule');
      return false;
    }
  }

  async function setDefault(scheduleId: string): Promise<boolean> {
    const notifications = useNotificationStore();

    try {
      const result = await availabilityService.setDefault(scheduleId);
      if (result.success && result.data) {
        // Update all schedules
        schedules.value = schedules.value.map((s) => ({
          ...s,
          is_default: s.id === scheduleId,
        }));
        notifications.success('Default schedule updated');
        return true;
      } else {
        notifications.error(result.error?.message || 'Failed to set default');
        return false;
      }
    } catch {
      notifications.error('Failed to set default');
      return false;
    }
  }

  async function addOverride(override: AvailabilityOverride): Promise<boolean> {
    if (!currentSchedule.value) return false;

    const notifications = useNotificationStore();

    try {
      const result = await availabilityService.addOverride(currentSchedule.value.id, override);
      if (result.success && result.data) {
        const index = schedules.value.findIndex((s) => s.id === currentSchedule.value?.id);
        if (index >= 0) {
          schedules.value[index] = result.data;
        }
        currentSchedule.value = result.data;
        notifications.success('Date override added');
        return true;
      } else {
        notifications.error(result.error?.message || 'Failed to add override');
        return false;
      }
    } catch {
      notifications.error('Failed to add override');
      return false;
    }
  }

  async function removeOverride(date: string): Promise<boolean> {
    if (!currentSchedule.value) return false;

    const notifications = useNotificationStore();

    try {
      const result = await availabilityService.removeOverride(currentSchedule.value.id, date);
      if (result.success && result.data) {
        const index = schedules.value.findIndex((s) => s.id === currentSchedule.value?.id);
        if (index >= 0) {
          schedules.value[index] = result.data;
        }
        currentSchedule.value = result.data;
        notifications.success('Date override removed');
        return true;
      } else {
        notifications.error(result.error?.message || 'Failed to remove override');
        return false;
      }
    } catch {
      notifications.error('Failed to remove override');
      return false;
    }
  }

  async function ensureDefaultSchedule(timezone: string): Promise<AvailabilitySchedule | null> {
    try {
      const result = await availabilityService.ensureDefaultSchedule(timezone);
      if (result.success && result.data) {
        // Add to list if not already there
        const existing = schedules.value.find((s) => s.id === result.data?.id);
        if (!existing) {
          schedules.value.push(result.data);
        }
        if (!currentSchedule.value) {
          currentSchedule.value = result.data;
        }
        return result.data;
      }
      return null;
    } catch {
      return null;
    }
  }

  function getScheduleById(id: string): AvailabilitySchedule | undefined {
    return schedules.value.find((s) => s.id === id);
  }

  function clearSchedules() {
    schedules.value = [];
    currentSchedule.value = null;
    error.value = null;
  }

  return {
    // State
    schedules,
    currentSchedule,
    loading,
    error,

    // Getters
    hasSchedules,
    defaultSchedule,
    scheduleNames,

    // Actions
    fetchSchedules,
    selectSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    setDefault,
    addOverride,
    removeOverride,
    ensureDefaultSchedule,
    getScheduleById,
    clearSchedules,
  };
});
