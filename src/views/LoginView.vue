<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
      <div class="text-center mb-8">
        <div class="flex items-center justify-center gap-3 mb-4">
          <Users class="w-12 h-12 text-indigo-600" />
          <h1 class="text-3xl font-bold text-gray-800">{{ $t('app.title') }}</h1>
        </div>
        <p class="text-gray-600">{{ $t('app.description') }}</p>
      </div>

      <form @submit.prevent="handleEmailSubmit" class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            {{ $t('auth.email.label') }}
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            :placeholder="$t('auth.email.placeholder').replace('{at}', '@')"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
          <Mail v-else class="w-5 h-5" />
          <span>{{ loading ? $t('auth.sendingLink') : $t('auth.continueWithEmail') }}</span>
        </button>
      </form>

      <div class="relative my-8">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">{{ $t('auth.or') }}</span>
        </div>
      </div>

      <button
        @click="handleGoogleSignIn"
        :disabled="loading"
        class="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <Chrome class="w-5 h-5" />
        {{ $t('auth.continueWithGoogle') }}
      </button>

      <div class="mt-6">
        <p class="text-sm text-center text-gray-500">
          {{ $t('auth.termsNotice') }}
          <RouterLink to="/terms" class="text-indigo-600 hover:text-indigo-500">
            {{ $t('auth.terms') }}
          </RouterLink>
          {{ $t('auth.and') }}
          <RouterLink to="/privacy" class="text-indigo-600 hover:text-indigo-500">
            {{ $t('auth.privacy') }}
          </RouterLink>
        </p>
      </div>

      <div class="mt-8 text-center">
        <RouterLink
          to="/"
          class="text-indigo-600 hover:text-indigo-500 text-sm flex items-center justify-center gap-2"
        >
          <ArrowLeft class="w-4 h-4" />
          {{ $t('nav.back') }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Users, Loader2, Chrome, Mail, ArrowLeft } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const email = ref('');
const loading = ref(false);

async function handleEmailSubmit() {
  if (!email.value) return;
  
  loading.value = true;
  try {
    await authStore.signInWithEmail(email.value);
    email.value = '';
  } finally {
    loading.value = false;
  }
}

async function handleGoogleSignIn() {
  loading.value = true;
  try {
    const { success } = await authStore.signInWithGoogle();
    if (!success) {
      notificationStore.add('error', 'Failed to sign in with Google');
    }
  } finally {
    loading.value = false;
  }
}
</script>