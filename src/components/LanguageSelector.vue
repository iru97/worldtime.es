<template>
  <div class="relative" ref="containerRef">
    <button
      @click="toggleDropdown"
      class="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-[var(--accent-bg)]"
    >
      <Globe2 class="w-5 h-5 text-[var(--text-secondary)]" />
      <span class="text-sm text-[var(--text-secondary)]">{{ currentLanguageLabel }}</span>
      <ChevronDown
        class="w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-[var(--card-bg)] border border-[var(--card-border)] py-1 z-50"
      >
        <button
          v-for="lang in availableLanguages"
          :key="lang.code"
          @click="selectLanguage(lang.code)"
          class="w-full px-4 py-2 text-left text-sm hover:bg-[var(--accent-bg)] transition-colors flex items-center gap-2"
          :class="{ 'text-[var(--accent-primary)]': currentLocale === lang.code }"
        >
          <Check v-if="currentLocale === lang.code" class="w-4 h-4" />
          <span :class="{ 'ml-6': currentLocale !== lang.code }">{{ lang.label }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Globe2, ChevronDown, Check } from 'lucide-vue-next';

const { locale: currentLocale } = useI18n();
const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);

const availableLanguages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' }
];

const currentLanguageLabel = computed(() => {
  return availableLanguages.find(lang => lang.code === currentLocale.value)?.label;
});

function selectLanguage(code: string) {
  currentLocale.value = code;
  localStorage.setItem('preferred-language', code);
  isOpen.value = false;
}

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function handleClickOutside(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>