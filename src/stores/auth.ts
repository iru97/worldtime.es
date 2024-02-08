import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';
import { useNotificationStore } from './notifications';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(true);
  const notificationStore = useNotificationStore();

  const isAuthenticated = computed(() => !!user.value);

  async function initialize() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      notificationStore.add('error', 'Failed to initialize authentication');
    } finally {
      loading.value = false;
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user.id);
        notificationStore.add('success', 'Successfully signed in');
      } else if (event === 'SIGNED_OUT') {
        user.value = null;
        notificationStore.add('info', 'You have been signed out');
      }
    });
  }

  async function loadUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      user.value = data;
    } catch (error) {
      console.error('Error loading user profile:', error);
      notificationStore.add('error', 'Failed to load user profile');
      user.value = null;
    }
  }

  async function signInWithEmail(email: string) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      notificationStore.add('success', 'Check your email for the magic link!');
      return { success: true };
    } catch (error) {
      console.error('Error sending magic link:', error);
      notificationStore.add('error', 'Failed to send magic link');
      return { success: false, error };
    }
  }

  async function signInWithGoogle() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      notificationStore.add('error', 'Failed to sign in with Google');
      return { success: false, error };
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      user.value = null;
    } catch (error) {
      console.error('Error signing out:', error);
      notificationStore.add('error', 'Failed to sign out');
    }
  }

  async function updateProfile(updates: Partial<User>) {
    if (!user.value) {
      notificationStore.add('error', 'No user logged in');
      return { success: false, error: 'No user logged in' };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.value.id)
        .select()
        .single();

      if (error) throw error;
      user.value = data;
      notificationStore.add('success', 'Profile updated successfully');
      return { success: true, data };
    } catch (error) {
      console.error('Error updating profile:', error);
      notificationStore.add('error', 'Failed to update profile');
      return { success: false, error };
    }
  }

  async function deleteAccount() {
    try {
      const { error } = await supabase.rpc('delete_user');
      if (error) throw error;
      user.value = null;
      notificationStore.add('success', 'Account deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error deleting account:', error);
      notificationStore.add('error', 'Failed to delete account');
      return { success: false, error };
    }
  }

  return {
    user,
    loading,
    isAuthenticated,
    initialize,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    updateProfile,
    deleteAccount,
  };
});