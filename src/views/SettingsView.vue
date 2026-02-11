<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center gap-4">
          <router-link
            to="/home"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft class="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </router-link>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ t('settings.title') }}
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ t('settings.subtitle') }}
            </p>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <!-- Navigation Tabs -->
      <div class="flex gap-2 overflow-x-auto pb-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
          :class="
            activeTab === tab.id
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          "
        >
          <component :is="tab.icon" class="w-4 h-4 inline-block mr-2" />
          {{ tab.label }}
        </button>
      </div>

      <!-- General Settings -->
      <div v-if="activeTab === 'general'" class="space-y-6">
        <!-- Profile Section -->
        <section class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ t('settings.profile') }}
          </h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('settings.email') }}
              </label>
              <input
                :value="authStore.user?.email"
                type="email"
                disabled
                class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400"
              />
              <p class="text-xs text-gray-500 mt-1">{{ t('settings.emailCannotChange') }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('settings.timezone') }}
              </label>
              <select
                v-model="settings.timezone"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option v-for="tz in timezones" :key="tz" :value="tz">{{ tz }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('settings.language') }}
              </label>
              <select
                v-model="settings.language"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('settings.timeFormat') }}
              </label>
              <div class="flex gap-4">
                <label class="flex items-center gap-2">
                  <input
                    v-model="settings.timeFormat"
                    type="radio"
                    value="12h"
                    class="text-blue-600"
                  />
                  <span class="text-sm text-gray-700 dark:text-gray-300">12-hour (2:30 PM)</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="settings.timeFormat"
                    type="radio"
                    value="24h"
                    class="text-blue-600"
                  />
                  <span class="text-sm text-gray-700 dark:text-gray-300">24-hour (14:30)</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <!-- Appearance Section -->
        <section class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ t('settings.appearance') }}
          </h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {{ t('settings.theme') }}
              </label>
              <div class="grid grid-cols-3 gap-3">
                <button
                  v-for="option in themeOptions"
                  :key="option.value"
                  @click="themeStore.setTheme(option.value)"
                  class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors"
                  :class="
                    themeStore.theme === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  "
                >
                  <component :is="option.icon" class="w-6 h-6" />
                  <span class="text-sm font-medium">{{ option.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <div class="flex justify-end">
          <button
            @click="saveGeneralSettings"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {{ t('common.saveChanges') }}
          </button>
        </div>
      </div>

      <!-- Notifications Settings -->
      <div v-if="activeTab === 'notifications'" class="space-y-6">
        <section class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ t('settings.emailNotifications') }}
          </h2>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ t('settings.bookingConfirmations') }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ t('settings.bookingConfirmationsDesc') }}
                </p>
              </div>
              <button
                @click="notifications.bookingConfirmations = !notifications.bookingConfirmations"
                class="w-12 h-6 rounded-full transition-colors relative"
                :class="notifications.bookingConfirmations ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
              >
                <span
                  class="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform"
                  :class="notifications.bookingConfirmations ? 'left-7' : 'left-1'"
                ></span>
              </button>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ t('settings.bookingReminders') }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ t('settings.bookingRemindersDesc') }}
                </p>
              </div>
              <button
                @click="notifications.bookingReminders = !notifications.bookingReminders"
                class="w-12 h-6 rounded-full transition-colors relative"
                :class="notifications.bookingReminders ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
              >
                <span
                  class="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform"
                  :class="notifications.bookingReminders ? 'left-7' : 'left-1'"
                ></span>
              </button>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ t('settings.pollUpdates') }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ t('settings.pollUpdatesDesc') }}
                </p>
              </div>
              <button
                @click="notifications.pollUpdates = !notifications.pollUpdates"
                class="w-12 h-6 rounded-full transition-colors relative"
                :class="notifications.pollUpdates ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
              >
                <span
                  class="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform"
                  :class="notifications.pollUpdates ? 'left-7' : 'left-1'"
                ></span>
              </button>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ t('settings.teamUpdates') }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ t('settings.teamUpdatesDesc') }}
                </p>
              </div>
              <button
                @click="notifications.teamUpdates = !notifications.teamUpdates"
                class="w-12 h-6 rounded-full transition-colors relative"
                :class="notifications.teamUpdates ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
              >
                <span
                  class="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform"
                  :class="notifications.teamUpdates ? 'left-7' : 'left-1'"
                ></span>
              </button>
            </div>
          </div>
        </section>

        <div class="flex justify-end">
          <button
            @click="saveNotificationSettings"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {{ t('common.saveChanges') }}
          </button>
        </div>
      </div>

      <!-- Integrations Settings -->
      <div v-if="activeTab === 'integrations'" class="space-y-6">
        <section class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ t('settings.calendarIntegrations') }}
          </h2>
          <div class="space-y-4">
            <!-- Google Calendar -->
            <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <svg class="w-8 h-8" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.5 12c0-.82-.07-1.63-.2-2.4H12v4.5h5.9c-.26 1.32-1.02 2.45-2.16 3.2v2.65h3.48c2.04-1.88 3.22-4.65 3.22-7.95z"/>
                    <path fill="#34A853" d="M12 23c2.92 0 5.36-.97 7.15-2.62l-3.48-2.65c-.97.65-2.2 1.03-3.67 1.03-2.82 0-5.2-1.9-6.05-4.46H2.35v2.73C4.12 20.58 7.78 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.95 14.3c-.23-.65-.36-1.35-.36-2.08s.13-1.43.36-2.08V7.4H2.35C1.6 8.88 1.18 10.4 1.18 12s.42 3.12 1.17 4.6l3.6-2.3z"/>
                    <path fill="#EA4335" d="M12 5.46c1.6 0 3.03.55 4.15 1.62l3.1-3.1C17.35 2.2 14.92 1 12 1 7.78 1 4.12 3.42 2.35 7.4l3.6 2.3c.85-2.56 3.23-4.46 6.05-4.46z"/>
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">Google Calendar</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ calendarConnected ? t('settings.connected') : t('settings.notConnected') }}
                  </p>
                </div>
              </div>
              <button
                v-if="calendarConnected"
                @click="disconnectCalendar"
                class="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                {{ t('settings.disconnect') }}
              </button>
              <button
                v-else
                @click="connectGoogleCalendar"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {{ t('settings.connect') }}
              </button>
            </div>

            <!-- More integrations coming soon -->
            <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg opacity-60">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <svg class="w-8 h-8" viewBox="0 0 24 24">
                    <path fill="#0078D4" d="M21.5 12c0-5.25-4.25-9.5-9.5-9.5S2.5 6.75 2.5 12s4.25 9.5 9.5 9.5 9.5-4.25 9.5-9.5zM12 4.5c4.14 0 7.5 3.36 7.5 7.5s-3.36 7.5-7.5 7.5-7.5-3.36-7.5-7.5 3.36-7.5 7.5-7.5z"/>
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">Microsoft Outlook</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('settings.comingSoon') }}</p>
                </div>
              </div>
              <span class="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-600 rounded-full">
                {{ t('settings.comingSoon') }}
              </span>
            </div>
          </div>
        </section>
      </div>

      <!-- Data & Privacy -->
      <div v-if="activeTab === 'privacy'" class="space-y-6">
        <section class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ t('settings.dataExport') }}
          </h2>
          <p class="text-gray-500 dark:text-gray-400 mb-4">
            {{ t('settings.dataExportDesc') }}
          </p>
          <button
            @click="exportData"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {{ t('settings.exportMyData') }}
          </button>
        </section>

        <section class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 class="text-lg font-semibold text-red-600 mb-4">
            {{ t('settings.dangerZone') }}
          </h2>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ t('settings.deleteAccount') }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ t('settings.deleteAccountDesc') }}
                </p>
              </div>
              <button
                @click="confirmDeleteAccount"
                class="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                {{ t('settings.deleteAccount') }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { useCalendarStore } from '@/stores/calendar';
import { useNotificationStore } from '@/stores/notifications';
import { googleCalendarService } from '@/services/api/GoogleCalendarService';
import {
  ArrowLeft,
  Settings2,
  Bell,
  Link2,
  Shield,
  Sun,
  Moon,
  Monitor,
} from 'lucide-vue-next';

const { t } = useI18n();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const calendarStore = useCalendarStore();
const notificationStore = useNotificationStore();

// Tabs
const tabs = [
  { id: 'general', label: t('settings.general'), icon: Settings2 },
  { id: 'notifications', label: t('settings.notifications'), icon: Bell },
  { id: 'integrations', label: t('settings.integrations'), icon: Link2 },
  { id: 'privacy', label: t('settings.privacy'), icon: Shield },
];
const activeTab = ref('general');

// Theme options
const themeOptions = [
  { value: 'light' as const, label: t('settings.light'), icon: Sun },
  { value: 'dark' as const, label: t('settings.dark'), icon: Moon },
  { value: 'system' as const, label: t('settings.system'), icon: Monitor },
];

// Settings state
const settings = ref({
  timezone: authStore.user?.timezone || 'UTC',
  language: authStore.user?.language || 'en',
  timeFormat: authStore.user?.time_format || '12h',
});

const notifications = ref({
  bookingConfirmations: true,
  bookingReminders: true,
  pollUpdates: true,
  teamUpdates: true,
});

const calendarConnected = ref(false);

// Timezones list
const timezones = Intl.supportedValuesOf('timeZone');

onMounted(async () => {
  const result = await calendarStore.checkConnection();
  calendarConnected.value = result;
});

async function saveGeneralSettings() {
  await authStore.updateProfile({
    timezone: settings.value.timezone,
    language: settings.value.language,
    time_format: settings.value.timeFormat as '12h' | '24h',
  });
  notificationStore.success(t('settings.saved'));
}

function saveNotificationSettings() {
  // Save to user preferences
  notificationStore.success(t('settings.saved'));
}

function connectGoogleCalendar() {
  const state = btoa(
    JSON.stringify({
      provider: 'google',
      redirect_url: window.location.href,
      user_id: authStore.user?.id,
      timestamp: Date.now(),
    })
  );
  window.location.href = googleCalendarService.getAuthorizationUrl(state);
}

async function disconnectCalendar() {
  if (confirm(t('settings.confirmDisconnect'))) {
    await calendarStore.disconnect();
    calendarConnected.value = false;
    notificationStore.success(t('settings.disconnected'));
  }
}

function exportData() {
  // Export user data
  notificationStore.info(t('settings.exportStarted'));
}

function confirmDeleteAccount() {
  if (confirm(t('settings.confirmDeleteAccount'))) {
    // Delete account logic
  }
}
</script>
