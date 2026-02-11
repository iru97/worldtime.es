import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ThemeStyle = 'modern' | 'minimal' | 'glassmorphic' | 'neumorphic' | 'colorful';
export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  style: ThemeStyle;
}

const VALID_MODES: ThemeMode[] = ['light', 'dark'];
const VALID_STYLES: ThemeStyle[] = ['modern', 'minimal', 'glassmorphic', 'neumorphic', 'colorful'];

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

function getInitialMode(): ThemeMode {
  const saved = safeGetItem('themeMode');
  if (saved && VALID_MODES.includes(saved as ThemeMode)) {
    return saved as ThemeMode;
  }
  return 'light';
}

function getInitialStyle(): ThemeStyle {
  const saved = safeGetItem('themeStyle');
  if (saved && VALID_STYLES.includes(saved as ThemeStyle)) {
    return saved as ThemeStyle;
  }
  return 'modern';
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeState>({
    mode: getInitialMode(),
    style: getInitialStyle()
  });

  function setThemeMode(mode: ThemeMode) {
    theme.value.mode = mode;
    safeSetItem('themeMode', mode);
    updateDocumentClass();
  }

  function setThemeStyle(style: ThemeStyle) {
    theme.value.style = style;
    safeSetItem('themeStyle', style);
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
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (!safeGetItem('themeMode')) {
        setThemeMode(e.matches ? 'dark' : 'light');
      }
    });
  }

  return {
    theme,
    setThemeMode,
    setThemeStyle,
    toggleThemeMode,
  };
});