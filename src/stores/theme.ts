import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ThemeStyle = 'modern' | 'minimal' | 'glassmorphic' | 'neumorphic' | 'colorful';
export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  style: ThemeStyle;
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeState>({
    mode: (localStorage.getItem('themeMode') as ThemeMode) || 'light',
    style: (localStorage.getItem('themeStyle') as ThemeStyle) || 'modern'
  });

  function setThemeMode(mode: ThemeMode) {
    theme.value.mode = mode;
    localStorage.setItem('themeMode', mode);
    updateDocumentClass();
  }

  function setThemeStyle(style: ThemeStyle) {
    theme.value.style = style;
    localStorage.setItem('themeStyle', style);
  }

  function toggleThemeMode() {
    setThemeMode(theme.value.mode === 'light' ? 'dark' : 'light');
  }

  function updateDocumentClass() {
    if (theme.value.mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // Initialize theme
  updateDocumentClass();

  // Watch system preference changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    if (!localStorage.getItem('themeMode')) {
      setThemeMode(e.matches ? 'dark' : 'light');
    }
  });

  return {
    theme,
    setThemeMode,
    setThemeStyle,
    toggleThemeMode,
  };
});