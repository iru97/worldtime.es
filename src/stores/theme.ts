import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

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
    updateDocumentClass();
  }

  function toggleThemeMode() {
    setThemeMode(theme.value.mode === 'light' ? 'dark' : 'light');
  }

  function updateDocumentClass() {
    // Remove all theme classes first
    document.documentElement.classList.remove(
      'light', 'dark',
      'theme-modern', 'theme-minimal', 'theme-glassmorphic', 'theme-neumorphic', 'theme-colorful'
    );
    
    // Add current theme classes
    document.documentElement.classList.add(
      theme.value.mode,
      `theme-${theme.value.style}`
    );
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