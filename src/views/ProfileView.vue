<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center gap-3">
            <UserCircle class="w-8 h-8 text-indigo-600" />
            <h1 class="text-2xl font-bold text-gray-800">Profile Settings</h1>
          </div>
          <RouterLink
            to="/"
            class="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
          >
            <ArrowLeft class="w-5 h-5" />
            Back to Contacts
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="successMessage" class="mb-6 bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2">
        <CheckCircle class="w-5 h-5" />
        {{ successMessage }}
      </div>

      <div v-if="errorMessage" class="mb-6 bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2">
        <AlertCircle class="w-5 h-5" />
        {{ errorMessage }}
      </div>

      <div class="bg-white rounded-xl shadow-lg p-6">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              :value="authStore.user?.email"
              disabled
              class="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500"
            />
          </div>

          <div>
            <label for="timezone" class="block text-sm font-medium text-gray-700 mb-1">
              Default Timezone
            </label>
            <select
              id="timezone"
              v-model="form.timezone"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option v-for="tz in timezones" :key="tz" :value="tz">
                {{ tz }}
              </option>
            </select>
          </div>

          <div>
            <label for="language" class="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              id="language"
              v-model="form.language"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>

          <div class="pt-4">
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
              <span>{{ loading ? 'Saving...' : 'Save Changes' }}</span>
            </button>
          </div>
        </form>
      </div>

      <div class="mt-8 bg-white rounded-xl shadow-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Danger Zone</h2>
        <button
          @click="handleDeleteAccount"
          :disabled="loading"
          class="w-full bg-red-50 text-red-600 py-2 px-4 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Trash2 class="w-5 h-5" />
          Delete Account
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { UserCircle, ArrowLeft, Loader2, Trash2, CheckCircle, AlertCircle } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const timezones = ref<string[]>([]);
const successMessage = ref('');
const errorMessage = ref('');

const form = ref({
  timezone: authStore.user?.timezone || 'UTC',
  language: authStore.user?.language || 'en',
});

onMounted(() => {
  timezones.value = Intl.supportedValuesOf('timeZone');
});

async function handleSubmit() {
  if (!authStore.user) return;
  
  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const { success, error } = await authStore.updateProfile({
      timezone: form.value.timezone,
      language: form.value.language,
    });

    if (!success) throw error;
    successMessage.value = 'Profile updated successfully';
  } catch (error) {
    console.error('Error updating profile:', error);
    errorMessage.value = 'Failed to update profile';
  } finally {
    loading.value = false;
  }
}

async function handleDeleteAccount() {
  if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const { success, error } = await authStore.deleteAccount();
    if (!success) throw error;
    router.push('/login');
  } catch (error) {
    console.error('Error deleting account:', error);
    errorMessage.value = 'Failed to delete account';
    loading.value = false;
  }
}
</script>