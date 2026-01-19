import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts() {
  const router = useRouter();
  const showShortcutsModal = ref(false);

  const shortcuts: Shortcut[] = [
    {
      key: 'n',
      ctrl: true,
      description: 'Add new contact',
      action: () => {
        document.dispatchEvent(new CustomEvent('shortcut:new-contact'));
      },
    },
    {
      key: 'f',
      ctrl: true,
      description: 'Focus search',
      action: () => {
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      },
    },
    {
      key: 'm',
      ctrl: true,
      description: 'Open meeting finder',
      action: () => {
        document.dispatchEvent(new CustomEvent('shortcut:meeting-finder'));
      },
    },
    {
      key: 'e',
      ctrl: true,
      description: 'Export contacts',
      action: () => {
        document.dispatchEvent(new CustomEvent('shortcut:export'));
      },
    },
    {
      key: 'i',
      ctrl: true,
      description: 'Import contacts',
      action: () => {
        document.dispatchEvent(new CustomEvent('shortcut:import'));
      },
    },
    {
      key: '1',
      ctrl: true,
      description: 'Timeline view',
      action: () => {
        document.dispatchEvent(new CustomEvent('shortcut:view', { detail: 'timeline' }));
      },
    },
    {
      key: '2',
      ctrl: true,
      description: 'List view',
      action: () => {
        document.dispatchEvent(new CustomEvent('shortcut:view', { detail: 'list' }));
      },
    },
    {
      key: 'p',
      ctrl: true,
      description: 'Go to profile',
      action: () => {
        router.push('/profile');
      },
    },
    {
      key: '/',
      description: 'Show keyboard shortcuts',
      action: () => {
        showShortcutsModal.value = true;
      },
    },
    {
      key: 'Escape',
      description: 'Close modal / Clear search',
      action: () => {
        document.dispatchEvent(new CustomEvent('shortcut:escape'));
      },
    },
  ];

  function handleKeyDown(event: KeyboardEvent) {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Only allow Escape in inputs
      if (event.key !== 'Escape') return;
    }

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

      if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  return {
    shortcuts,
    showShortcutsModal,
  };
}
