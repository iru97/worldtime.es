<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--bg-gradient-from)] to-[var(--bg-gradient-to)]">
    <div class="card max-w-md w-full p-8 text-center">
      <!-- Loading -->
      <div v-if="loading">
        <Loader2 class="w-12 h-12 mx-auto mb-4 animate-spin text-[var(--accent-primary)]" />
        <h2 class="text-xl font-semibold text-[var(--text-primary)] mb-2">
          Connecting Google Calendar...
        </h2>
        <p class="text-[var(--text-secondary)]">
          Please wait while we complete the connection.
        </p>
      </div>

      <!-- Success -->
      <div v-else-if="success">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
          <CheckCircle class="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 class="text-xl font-semibold text-[var(--text-primary)] mb-2">
          Calendar Connected!
        </h2>
        <p class="text-[var(--text-secondary)] mb-6">
          Your Google Calendar is now connected. You'll be redirected shortly.
        </p>
        <RouterLink to="/scheduling" class="btn btn-primary">
          Go to Scheduling
        </RouterLink>
      </div>

      <!-- Error -->
      <div v-else>
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
          <AlertCircle class="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 class="text-xl font-semibold text-[var(--text-primary)] mb-2">
          Connection Failed
        </h2>
        <p class="text-[var(--text-secondary)] mb-6">
          {{ error || 'Failed to connect your Google Calendar. Please try again.' }}
        </p>
        <RouterLink to="/scheduling" class="btn btn-secondary">
          Back to Scheduling
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-vue-next';
import { useCalendarStore } from '@/stores/calendar';

const router = useRouter();
const route = useRoute();
const calendarStore = useCalendarStore();

const loading = ref(true);
const success = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  const code = route.query.code as string;
  const errorParam = route.query.error as string;
  const state = route.query.state as string;

  // Handle OAuth error
  if (errorParam) {
    loading.value = false;
    error.value = errorParam === 'access_denied'
      ? 'You denied access to your Google Calendar.'
      : `OAuth error: ${errorParam}`;
    return;
  }

  // Check for authorization code
  if (!code) {
    loading.value = false;
    error.value = 'No authorization code received.';
    return;
  }

  // Parse state to get redirect URL
  let redirectUrl = '/scheduling';
  if (state) {
    try {
      const stateData = JSON.parse(atob(state));
      if (stateData.redirect_url) {
        redirectUrl = stateData.redirect_url;
      }
    } catch {
      // Ignore state parsing errors
    }
  }

  // Exchange code for tokens
  const result = await calendarStore.handleOAuthCallback(code);

  loading.value = false;

  if (result.success) {
    success.value = true;
    // Redirect after short delay
    setTimeout(() => {
      router.push(redirectUrl);
    }, 2000);
  } else {
    error.value = result.error?.message || 'Failed to connect calendar';
  }
});
</script>
