<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
    <div class="text-center">
      <Loader2 class="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
      <h1 class="text-xl font-medium text-gray-900 mb-2">{{ message }}</h1>
      <p class="text-gray-600">{{ subMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Loader2 } from 'lucide-vue-next';
import { supabase } from '@/lib/supabase';
import { useNotificationStore } from '@/stores/notifications';

const router = useRouter();
const notificationStore = useNotificationStore();
const message = ref('Completing sign in...');
const subMessage = ref('Please wait while we verify your credentials');

onMounted(async () => {
  try {
    // First try to get the session directly
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (session) {
      notificationStore.add('success', 'Successfully signed in');
      router.push('/');
      return;
    }

    // If no session, check for hash parameters
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      const error = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');

      if (error) {
        throw new Error(errorDescription || 'Authentication failed');
      }

      if (accessToken && type === 'magiclink') {
        const { data, error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (setSessionError) throw setSessionError;
        if (data.session) {
          notificationStore.add('success', 'Successfully signed in');
          window.location.hash = '';
          router.push('/');
          return;
        }
      }
    }

    // If we get here, something went wrong
    throw new Error('No valid session or authentication tokens found');
  } catch (error) {
    console.error('Error in auth callback:', error);
    message.value = 'Authentication failed';
    subMessage.value = error instanceof Error ? error.message : 'Please try signing in again';
    notificationStore.add('error', 'Authentication failed. Please try again.');
    
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  }
});
</script>