import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/lib/supabase';
import type { ContactGroup } from '@/types';
import { useNotificationStore } from './notifications';
import { useAuthStore } from './auth';
import { logger } from '@/services/LoggingService';

const GROUP_COLORS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
];

export const useGroupsStore = defineStore('groups', () => {
  const groups = ref<ContactGroup[]>([]);
  const loading = ref(false);
  const notificationStore = useNotificationStore();
  const authStore = useAuthStore();

  const groupsById = computed(() => {
    return groups.value.reduce(
      (acc, group) => {
        acc[group.id] = group;
        return acc;
      },
      {} as Record<string, ContactGroup>
    );
  });

  function getNextColor(): string {
    const usedColors = groups.value.map((g) => g.color).filter(Boolean);
    const availableColor = GROUP_COLORS.find((c) => !usedColors.includes(c));
    return availableColor || GROUP_COLORS[groups.value.length % GROUP_COLORS.length];
  }

  async function fetchGroups() {
    loading.value = true;
    try {
      const { data, error } = await supabase.from('contact_groups').select('*').order('name');

      if (error) throw error;
      groups.value = data || [];
    } catch (error) {
      logger.error('Error fetching groups:', error);
      notificationStore.add('error', 'Failed to load groups');
    } finally {
      loading.value = false;
    }
  }

  async function addGroup(name: string, color?: string): Promise<{ success: boolean; data?: ContactGroup; error?: unknown }> {
    if (!authStore.user) {
      notificationStore.add('error', 'You must be logged in to create groups');
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { data, error } = await supabase
        .from('contact_groups')
        .insert({
          name,
          color: color || getNextColor(),
          user_id: authStore.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      groups.value.push(data);
      notificationStore.add('success', 'Group created successfully');
      return { success: true, data };
    } catch (error) {
      logger.error('Error adding group:', error);
      notificationStore.add('error', 'Failed to create group');
      return { success: false, error };
    }
  }

  async function updateGroup(
    id: string,
    updates: Partial<Pick<ContactGroup, 'name' | 'color'>>
  ): Promise<{ success: boolean; data?: ContactGroup; error?: unknown }> {
    if (!authStore.user) {
      notificationStore.add('error', 'You must be logged in to update groups');
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { data, error } = await supabase
        .from('contact_groups')
        .update(updates)
        .eq('id', id)
        .eq('user_id', authStore.user.id)
        .select()
        .single();

      if (error) throw error;
      const index = groups.value.findIndex((g) => g.id === id);
      if (index !== -1) {
        groups.value[index] = data;
      }
      notificationStore.add('success', 'Group updated successfully');
      return { success: true, data };
    } catch (error) {
      logger.error('Error updating group:', error);
      notificationStore.add('error', 'Failed to update group');
      return { success: false, error };
    }
  }

  async function deleteGroup(id: string): Promise<{ success: boolean; error?: unknown }> {
    if (!authStore.user) {
      notificationStore.add('error', 'You must be logged in to delete groups');
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { error } = await supabase.from('contact_groups').delete().eq('id', id).eq('user_id', authStore.user.id);

      if (error) throw error;
      groups.value = groups.value.filter((g) => g.id !== id);
      notificationStore.add('success', 'Group deleted successfully');
      return { success: true };
    } catch (error) {
      logger.error('Error deleting group:', error);
      notificationStore.add('error', 'Failed to delete group');
      return { success: false, error };
    }
  }

  function getGroupById(id: string): ContactGroup | undefined {
    return groupsById.value[id];
  }

  return {
    groups,
    loading,
    groupsById,
    fetchGroups,
    addGroup,
    updateGroup,
    deleteGroup,
    getGroupById,
    getNextColor,
    GROUP_COLORS,
  };
});
