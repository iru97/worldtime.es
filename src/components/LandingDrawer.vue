<template>
  <Transition
    enter-active-class="transition-opacity ease-out duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity ease-in duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-black/50 z-40"
      @click="$emit('update:modelValue', false)"
    />
  </Transition>

  <Transition
    enter-active-class="transition ease-out duration-300 transform"
    enter-from-class="translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition ease-in duration-200 transform"
    leave-from-class="translate-x-0"
    leave-to-class="translate-x-full"
  >
    <div
      v-if="modelValue"
      class="fixed inset-y-0 right-0 w-72 bg-[var(--card-bg)] border-l border-[var(--card-border)] shadow-xl z-50 overflow-y-auto"
    >
      <!-- Header -->
      <div class="p-4 border-b border-[var(--card-border)] flex justify-between items-center">
        <h2 class="text-lg font-semibold text-[var(--text-primary)]">{{ $t('nav.menu') }}</h2>
        <button
          @click="$emit('update:modelValue', false)"
          class="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-lg"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 space-y-6">
        <!-- Theme Section -->
        <div>
          <h3 class="text-sm font-medium text-[var(--text-secondary)] mb-3">{{ $t('nav.theme') }}</h3>
          <div class="space-y-3">
            <select
              v-model="themeStore.theme.style"
              class="input text-sm"
              @change="themeStore.setThemeStyle($event.target.value)"
            >
              <option value="modern">{{ $t('theme.modern') }}</option>
              <option value="minimal">{{ $t('theme.minimal') }}</option>
              <option value="glassmorphic">{{ $t('theme.glass') }}</option>
              <option value="neumorphic">{{ $t('theme.neumorph') }}</option>
              <option value="colorful">{{ $t('theme.colorful') }}</option>
            </select>
            <button
              @click="themeStore.toggleThemeMode"
              class="w-full flex items-center justify-between p-3 rounded-lg bg-[var(--accent-bg)] text-[var(--text-primary)]"
            >
              <span class="text-sm">{{ $t('nav.darkMode') }}</span>
              <Sun v-if="themeStore.theme.mode === 'dark'" class="w-5 h-5" />
              <Moon v-else class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Language Section -->
        <div>
          <h3 class="text-sm font-medium text-[var(--text-secondary)] mb-3">{{ $t('nav.language') }}</h3>
          <div class="space-y-2">
            <button
              v-for="lang in availableLanguages"
              :key="lang.code"
              @click="selectLanguage(lang.code)"
              class="w-full flex items-center justify-between p-3 rounded-lg transition-colors"
              :class="currentLocale === lang.code ? 'bg-[var(--accent-bg)] text-[var(--accent-text)]' : 'hover:bg-[var(--accent-bg)] text-[var(--text-primary)]'"
            >
              <div class="flex items-center gap-2">
                <Globe2 class="w-5 h-5" />
                <span class="text-sm">{{ lang.label }}</span>
              </div>
              <Check v-if="currentLocale === lang.code" class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Sign In -->
        <div class="pt-4 border-t border-[var(--card-border)]">
          <RouterLink
            to="/login"
            class="w-full flex items-center gap-2 p-3 rounded-lg bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] transition-colors"
            @click="$emit('update:modelValue', false)"
          >
            <LogIn class="w-5 h-5" />
            <span class="text-sm">{{ $t('auth.signIn') }}</span>
          </RouterLink>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { X, Sun, Moon, Globe2, Check, LogIn } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import { useThemeStore } from '@/stores/theme';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const { locale: currentLocale } = useI18n();
const themeStore = useThemeStore();

const availableLanguages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' }
];

function selectLanguage(code: string) {
  currentLocale.value = code;
  localStorage.setItem('preferred-language', code);
  emit('update:modelValue', false);
}
</script>