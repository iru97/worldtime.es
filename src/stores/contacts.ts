import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '@/lib/supabase';
import type { Contact } from '@/types';
import { useNotificationStore } from './notifications';
import { useAuthStore } from './auth';

export const useContactsStore = defineStore('contacts', () => {
  const contacts = ref<Contact[]>([]);
  const loading = ref(false);
  const notificationStore = useNotificationStore();
  const authStore = useAuthStore();

  async function fetchContacts() {
    loading.value = true;
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name');

      if (error) throw error;
      contacts.value = data;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      notificationStore.add('error', 'Failed to load contacts');
    } finally {
      loading.value = false;
    }
  }

  async function addContact(contact: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    if (!authStore.user) {
      notificationStore.add('error', 'You must be logged in to add contacts');
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          ...contact,
          user_id: authStore.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      contacts.value.push(data);
      notificationStore.add('success', 'Contact added successfully');
      return { success: true, data };
    } catch (error) {
      console.error('Error adding contact:', error);
      notificationStore.add('error', 'Failed to add contact');
      return { success: false, error };
    }
  }

  async function updateContact(id: string, updates: Partial<Contact>) {
    if (!authStore.user) {
      notificationStore.add('error', 'You must be logged in to update contacts');
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', authStore.user.id) // Ensure user can only update their own contacts
        .select()
        .single();

      if (error) throw error;
      const index = contacts.value.findIndex(c => c.id === id);
      if (index !== -1) {
        contacts.value[index] = data;
      }
      notificationStore.add('success', 'Contact updated successfully');
      return { success: true, data };
    } catch (error) {
      console.error('Error updating contact:', error);
      notificationStore.add('error', 'Failed to update contact');
      return { success: false, error };
    }
  }

  async function deleteContact(id: string) {
    if (!authStore.user) {
      notificationStore.add('error', 'You must be logged in to delete contacts');
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
        .eq('user_id', authStore.user.id); // Ensure user can only delete their own contacts

      if (error) throw error;
      contacts.value = contacts.value.filter(c => c.id !== id);
      notificationStore.add('success', 'Contact deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error deleting contact:', error);
      notificationStore.add('error', 'Failed to delete contact');
      return { success: false, error };
    }
  }

  return {
    contacts,
    loading,
    fetchContacts,
    addContact,
    updateContact,
    deleteContact,
  };
});