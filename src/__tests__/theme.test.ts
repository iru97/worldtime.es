import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useThemeStore } from '@/stores/theme';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Theme Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    document.documentElement.classList.remove('dark');
  });

  describe('initial state', () => {
    it('defaults to light mode', () => {
      const store = useThemeStore();
      expect(store.theme.mode).toBe('light');
    });

    it('defaults to modern style', () => {
      const store = useThemeStore();
      expect(store.theme.style).toBe('modern');
    });

    it('loads saved mode from localStorage', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'themeMode') return 'dark';
        return null;
      });
      const store = useThemeStore();
      expect(store.theme.mode).toBe('dark');
    });

    it('loads saved style from localStorage', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'themeStyle') return 'glassmorphic';
        return null;
      });
      const store = useThemeStore();
      expect(store.theme.style).toBe('glassmorphic');
    });
  });

  describe('setThemeMode', () => {
    it('updates the theme mode', () => {
      const store = useThemeStore();
      store.setThemeMode('dark');
      expect(store.theme.mode).toBe('dark');
    });

    it('saves to localStorage', () => {
      const store = useThemeStore();
      store.setThemeMode('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('themeMode', 'dark');
    });

    it('adds dark class to document', () => {
      const store = useThemeStore();
      store.setThemeMode('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes dark class when set to light', () => {
      document.documentElement.classList.add('dark');
      const store = useThemeStore();
      store.setThemeMode('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('setThemeStyle', () => {
    it('updates the theme style', () => {
      const store = useThemeStore();
      store.setThemeStyle('minimal');
      expect(store.theme.style).toBe('minimal');
    });

    it('saves to localStorage', () => {
      const store = useThemeStore();
      store.setThemeStyle('colorful');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('themeStyle', 'colorful');
    });
  });

  describe('toggleThemeMode', () => {
    it('toggles from light to dark', () => {
      const store = useThemeStore();
      store.toggleThemeMode();
      expect(store.theme.mode).toBe('dark');
    });

    it('toggles from dark to light', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'themeMode') return 'dark';
        return null;
      });
      const store = useThemeStore();
      store.toggleThemeMode();
      expect(store.theme.mode).toBe('light');
    });
  });
});
