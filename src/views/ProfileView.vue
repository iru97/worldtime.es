<template>
  <div class="min-h-screen bg-[var(--bg-primary)]">
    <header class="bg-[var(--card-bg)] shadow-sm border-b border-[var(--card-border)]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center gap-3">
            <UserCircle class="w-8 h-8 text-[var(--accent-primary)]" />
            <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ $t('profile.title') }}</h1>
          </div>
          <RouterLink
            to="/home"
            class="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
          >
            <ArrowLeft class="w-5 h-5" />
            {{ $t('profile.backToContacts') }}
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="successMessage" class="mb-6 bg-[var(--accent-bg)] text-[var(--accent-text)] p-4 rounded-lg flex items-center gap-2">
        <CheckCircle class="w-5 h-5" />
        {{ successMessage }}
      </div>

      <div v-if="errorMessage" class="mb-6 bg-[var(--danger-bg)] text-[var(--danger)] p-4 rounded-lg flex items-center gap-2">
        <AlertCircle class="w-5 h-5" />
        {{ errorMessage }}
      </div>

      <div class="card p-6">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-[var(--text-primary)] mb-1">
              {{ $t('profile.email') }}
            </label>
            <input
              id="email"
              type="email"
              :value="authStore.user?.email"
              disabled
              class="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-lg text-[var(--text-tertiary)]"
            />
          </div>

          <div>
            <label for="timezone" class="block text-sm font-medium text-[var(--text-primary)] mb-1">
              {{ $t('profile.defaultTimezone') }}
            </label>
            <select
              id="timezone"
              v-model="form.timezone"
              required
              class="w-full px-4 py-2 border border-[var(--card-border)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent bg-[var(--card-bg)] text-[var(--text-primary)]"
            >
              <option v-for="tz in timezones" :key="tz" :value="tz">
                {{ tz }}
              </option>
            </select>
          </div>

          <div>
            <label for="language" class="block text-sm font-medium text-[var(--text-primary)] mb-1">
              {{ $t('profile.language') }}
            </label>
            <select
              id="language"
              v-model="form.language"
              required
              class="w-full px-4 py-2 border border-[var(--card-border)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent bg-[var(--card-bg)] text-[var(--text-primary)]"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>

          <div class="pt-4">
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-[var(--accent-primary)] text-white py-2 px-4 rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
              <span>{{ loading ? $t('profile.saving') : $t('profile.saveChanges') }}</span>
            </button>
          </div>
        </form>
      </div>

      <div class="mt-8 card p-6">
        <h2 class="text-lg font-medium text-[var(--text-primary)] mb-4">{{ $t('profile.dangerZone') }}</h2>
        <button
          @click="handleDeleteAccount"
          :disabled="loading"
          class="w-full bg-[var(--danger-bg)] text-[var(--danger)] py-2 px-4 rounded-lg hover:opacity-80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Trash2 class="w-5 h-5" />
          {{ $t('profile.deleteAccount') }}
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { UserCircle, ArrowLeft, Loader2, Trash2, CheckCircle, AlertCircle } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
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
    successMessage.value = t('profile.updateSuccess');
  } catch (error) {
    console.error('Error updating profile:', error);
    errorMessage.value = t('profile.updateError');
  } finally {
    loading.value = false;
  }
}

async function handleDeleteAccount() {
  if (!confirm(t('profile.deleteConfirm'))) {
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
    errorMessage.value = t('profile.deleteError');
    loading.value = false;
  }
}
</script>
