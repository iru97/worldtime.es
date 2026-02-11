<template>
  <div class="min-h-screen bg-gradient-to-br from-[var(--bg-gradient-from)] to-[var(--bg-gradient-to)]">
    <!-- Header -->
    <header class="w-full bg-[var(--card-bg)] shadow-sm">
      <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div class="flex justify-between items-center h-14 sm:h-16">
          <!-- Logo and Title -->
          <div class="flex items-center gap-2">
            <Users class="w-6 h-6 sm:w-8 sm:h-8 text-[var(--accent-primary)]" />
            <h1 class="text-lg sm:text-2xl font-bold text-[var(--text-primary)] truncate">
              {{ $t('nav.contacts') }}
            </h1>
          </div>

          <!-- Desktop Actions -->
          <div class="hidden sm:flex items-center gap-4">
            <!-- View Toggle -->
            <div class="flex items-center gap-1 bg-[var(--accent-bg)] rounded-lg p-1" role="group" :aria-label="$t('nav.view')">
              <button
                @click="view = 'timeline'"
                class="p-2 rounded-md transition-colors"
                :class="view === 'timeline' ? 'bg-white text-[var(--accent-text)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'"
                :aria-label="$t('nav.timeline')"
                :aria-pressed="view === 'timeline'"
              >
                <Clock class="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                @click="view = 'list'"
                class="p-2 rounded-md transition-colors"
                :class="view === 'list' ? 'bg-white text-[var(--accent-text)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'"
                :aria-label="$t('nav.list')"
                :aria-pressed="view === 'list'"
              >
                <List class="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <!-- Meeting Finder -->
            <button
              @click="showMeetingFinder = true"
              class="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              :aria-label="$t('meeting.title')"
              :title="$t('meeting.title')"
            >
              <CalendarClock class="w-5 h-5" aria-hidden="true" />
            </button>

            <!-- Scheduling -->
            <RouterLink
              to="/scheduling"
              class="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              :aria-label="$t('scheduling.title')"
              :title="$t('scheduling.title')"
            >
              <CalendarRange class="w-5 h-5" aria-hidden="true" />
            </RouterLink>

            <!-- Import/Export -->
            <div class="relative">
              <button
                @click="showActionsMenu = !showActionsMenu"
                class="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="More actions"
              >
                <MoreVertical class="w-5 h-5" aria-hidden="true" />
              </button>
              <div
                v-if="showActionsMenu"
                class="absolute right-0 mt-2 w-48 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-lg z-50"
              >
                <button
                  @click="openImportExport('import')"
                  class="w-full px-4 py-2 text-left text-[var(--text-primary)] hover:bg-[var(--accent-bg)] flex items-center gap-2"
                >
                  <Upload class="w-4 h-4" aria-hidden="true" />
                  {{ $t('import.title') }}
                </button>
                <button
                  @click="openImportExport('export')"
                  class="w-full px-4 py-2 text-left text-[var(--text-primary)] hover:bg-[var(--accent-bg)] flex items-center gap-2"
                >
                  <Download class="w-4 h-4" aria-hidden="true" />
                  {{ $t('export.title') }}
                </button>
                <hr class="border-[var(--card-border)]" />
                <button
                  @click="showGroupManager = true; showActionsMenu = false"
                  class="w-full px-4 py-2 text-left text-[var(--text-primary)] hover:bg-[var(--accent-bg)] flex items-center gap-2"
                >
                  <FolderOpen class="w-4 h-4" aria-hidden="true" />
                  {{ $t('groups.manage') }}
                </button>
              </div>
            </div>

            <ThemeToggle />
            <LanguageSelector />

            <RouterLink
              to="/profile"
              class="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              :aria-label="$t('nav.profile')"
            >
              <UserCircle class="w-5 h-5" aria-hidden="true" />
            </RouterLink>

            <button
              @click="handleSignOut"
              class="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              :aria-label="$t('nav.signOut')"
            >
              <LogOut class="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <!-- Mobile Menu Button -->
          <button
            class="sm:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            @click="showMobileMenu = true"
            :aria-label="$t('nav.menu')"
            aria-haspopup="true"
          >
            <Menu class="w-6 h-6" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile Drawer -->
    <MobileDrawer
      v-model="showMobileMenu"
      v-model:view="view"
    />

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
      <div class="space-y-6">
        <!-- Search and Add Contact -->
        <div class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <!-- Search Input -->
          <div class="relative flex-1 max-w-md">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" aria-hidden="true" />
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              :placeholder="$t('contacts.search')"
              class="w-full pl-10 pr-4 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
              :aria-label="$t('contacts.search')"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              :aria-label="$t('common.cancel')"
            >
              <X class="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <button
            @click="showContactModal = true"
            class="btn btn-primary flex items-center justify-center gap-2"
          >
            <UserPlus class="w-5 h-5" aria-hidden="true" />
            {{ $t('contacts.addNew') }}
          </button>
        </div>

        <!-- Group Filter -->
        <div v-if="groupsStore.groups.length > 0" class="flex flex-wrap gap-2">
          <button
            @click="selectedGroupFilter = null"
            class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
            :class="selectedGroupFilter === null
              ? 'bg-[var(--accent-primary)] text-white'
              : 'bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--card-border)] hover:bg-[var(--accent-bg)]'"
          >
            {{ $t('groups.all') }}
          </button>
          <button
            v-for="group in groupsStore.groups"
            :key="group.id"
            @click="selectedGroupFilter = group.id"
            class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5"
            :class="selectedGroupFilter === group.id
              ? 'bg-[var(--accent-primary)] text-white'
              : 'bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--card-border)] hover:bg-[var(--accent-bg)]'"
          >
            <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: group.color || '#3B82F6' }" />
            {{ group.name }}
          </button>
          <button
            @click="selectedGroupFilter = 'ungrouped'"
            class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
            :class="selectedGroupFilter === 'ungrouped'
              ? 'bg-[var(--accent-primary)] text-white'
              : 'bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--card-border)] hover:bg-[var(--accent-bg)]'"
          >
            {{ $t('groups.ungrouped') }}
          </button>
        </div>

        <!-- Timeline View -->
        <Timeline
          v-if="view === 'timeline' && filteredContacts.length > 0"
          :selected-date="selectedDate"
          @update="handleTimeUpdate"
        />

        <!-- Contact List -->
        <div v-if="contactsStore.loading" class="flex justify-center py-8">
          <Loader2 class="w-8 h-8 text-[var(--accent-primary)] animate-spin" aria-label="Loading" />
        </div>

        <!-- Empty State -->
        <div
          v-else-if="contactsStore.contacts.length === 0"
          class="card p-12 text-center"
        >
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent-bg)] flex items-center justify-center">
            <Users class="w-8 h-8 text-[var(--accent-primary)]" aria-hidden="true" />
          </div>
          <h3 class="text-xl font-semibold text-[var(--text-primary)] mb-2">
            {{ $t('contacts.empty.title') }}
          </h3>
          <p class="text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">
            {{ $t('contacts.empty.description') }}
          </p>
          <button
            @click="showContactModal = true"
            class="btn btn-primary inline-flex items-center gap-2"
          >
            <UserPlus class="w-5 h-5" aria-hidden="true" />
            {{ $t('contacts.addNew') }}
          </button>
        </div>

        <!-- No Results State -->
        <div
          v-else-if="filteredContacts.length === 0 && searchQuery"
          class="card p-12 text-center"
        >
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent-bg)] flex items-center justify-center">
            <Search class="w-8 h-8 text-[var(--accent-primary)]" aria-hidden="true" />
          </div>
          <h3 class="text-xl font-semibold text-[var(--text-primary)] mb-2">
            {{ $t('contacts.noResults') }}
          </h3>
          <p class="text-[var(--text-secondary)] mb-6">
            "{{ searchQuery }}"
          </p>
          <button
            @click="searchQuery = ''"
            class="btn btn-secondary inline-flex items-center gap-2"
          >
            <X class="w-5 h-5" aria-hidden="true" />
            {{ $t('common.cancel') }}
          </button>
        </div>

        <!-- Contact List Content -->
        <div v-else>
          <div v-if="view === 'timeline'" class="space-y-4">
            <TimeCard
              v-for="contact in filteredContacts"
              :key="contact.id"
              :name="contact.name"
              :timezone="contact.timezone"
              :time="formatTime(selectedDate, contact.timezone)"
            />
          </div>
          <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ContactCard
              v-for="contact in filteredContacts"
              :key="contact.id"
              :contact="contact"
              @edit="handleEditContact"
              @delete="handleDeleteContact"
            />
          </div>
        </div>
      </div>
    </main>

    <!-- Contact Modal -->
    <ContactModal
      v-if="showContactModal"
      :contact="selectedContact"
      @close="handleCloseModal"
      @submit="handleSubmitContact"
    />

    <!-- Meeting Finder Modal -->
    <MeetingFinder
      v-if="showMeetingFinder"
      :contacts="contactsStore.contacts"
      @close="showMeetingFinder = false"
    />

    <!-- Import/Export Modal -->
    <ImportExportModal
      v-if="showImportExport"
      :mode="importExportMode"
      @close="showImportExport = false"
      @imported="contactsStore.fetchContacts()"
    />

    <!-- Keyboard Shortcuts Modal -->
    <KeyboardShortcutsModal
      :show="showShortcutsModal"
      :shortcuts="shortcuts"
      @close="showShortcutsModal = false"
    />

    <!-- Group Manager Modal -->
    <GroupManager
      v-if="showGroupManager"
      @close="showGroupManager = false"
    />

    <!-- Onboarding Flow -->
    <OnboardingFlow
      v-if="showOnboarding"
      @complete="handleOnboardingComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  Users, Clock, List, Menu, UserCircle, LogOut, UserPlus,
  Loader2, Search, X, CalendarClock, MoreVertical, Upload, Download, FolderOpen, CalendarRange
} from 'lucide-vue-next';
import type { Contact } from '@/types';
import { TimeService } from '@/services/TimeService';
import { useAuthStore } from '@/stores/auth';
import { useContactsStore } from '@/stores/contacts';
import { useNotificationStore } from '@/stores/notifications';
import { useGroupsStore } from '@/stores/groups';
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts';
import Timeline from '@/components/Timeline.vue';
import TimeCard from '@/components/TimeCard.vue';
import ContactCard from '@/components/ContactCard.vue';
import ContactModal from '@/components/ContactModal.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';
import MobileDrawer from '@/components/MobileDrawer.vue';
import MeetingFinder from '@/components/MeetingFinder.vue';
import ImportExportModal from '@/components/ImportExportModal.vue';
import KeyboardShortcutsModal from '@/components/KeyboardShortcutsModal.vue';
import GroupManager from '@/components/GroupManager.vue';
import OnboardingFlow from '@/components/OnboardingFlow.vue';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const contactsStore = useContactsStore();
const notificationStore = useNotificationStore();
const groupsStore = useGroupsStore();
const timeService = new TimeService();
const { shortcuts, showShortcutsModal } = useKeyboardShortcuts();

const view = ref<'timeline' | 'list'>('timeline');
const selectedDate = ref(new Date());
const showMobileMenu = ref(false);
const showContactModal = ref(false);
const selectedContact = ref<Contact | null>(null);
const searchQuery = ref('');
const showMeetingFinder = ref(false);
const showImportExport = ref(false);
const importExportMode = ref<'import' | 'export'>('export');
const showActionsMenu = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);
const showGroupManager = ref(false);
const selectedGroupFilter = ref<string | null>(null);
const showOnboarding = ref(false);

// Check if onboarding should be shown
function checkOnboarding() {
  try {
    const completed = localStorage.getItem('onboardingCompleted');
    if (!completed) {
      showOnboarding.value = true;
    }
  } catch {
    // Ignore localStorage errors
  }
}

function handleOnboardingComplete() {
  showOnboarding.value = false;
}

// Filter contacts based on search query and group filter
const filteredContacts = computed(() => {
  let contacts = contactsStore.contacts;

  // Apply group filter
  if (selectedGroupFilter.value !== null) {
    if (selectedGroupFilter.value === 'ungrouped') {
      contacts = contacts.filter((c) => !c.group_id);
    } else {
      contacts = contacts.filter((c) => c.group_id === selectedGroupFilter.value);
    }
  }

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    contacts = contacts.filter((contact) => {
      return (
        contact.name.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.timezone.toLowerCase().includes(query) ||
        (contact.location && contact.location.toLowerCase().includes(query)) ||
        (contact.phone && contact.phone.includes(query))
      );
    });
  }

  return contacts;
});

// Keyboard shortcut handlers
function handleShortcutNewContact() {
  showContactModal.value = true;
}

function handleShortcutMeetingFinder() {
  showMeetingFinder.value = true;
}

function handleShortcutExport() {
  openImportExport('export');
}

function handleShortcutImport() {
  openImportExport('import');
}

function handleShortcutView(event: CustomEvent) {
  view.value = event.detail;
}

function handleShortcutEscape() {
  if (showContactModal.value) {
    handleCloseModal();
  } else if (showMeetingFinder.value) {
    showMeetingFinder.value = false;
  } else if (showImportExport.value) {
    showImportExport.value = false;
  } else if (showShortcutsModal.value) {
    showShortcutsModal.value = false;
  } else if (searchQuery.value) {
    searchQuery.value = '';
  }
}

onMounted(async () => {
  checkOnboarding();
  await Promise.all([contactsStore.fetchContacts(), groupsStore.fetchGroups()]);

  // Listen for keyboard shortcut events
  document.addEventListener('shortcut:new-contact', handleShortcutNewContact);
  document.addEventListener('shortcut:meeting-finder', handleShortcutMeetingFinder);
  document.addEventListener('shortcut:export', handleShortcutExport);
  document.addEventListener('shortcut:import', handleShortcutImport);
  document.addEventListener('shortcut:view', handleShortcutView as EventListener);
  document.addEventListener('shortcut:escape', handleShortcutEscape);

  // Close actions menu on click outside
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('shortcut:new-contact', handleShortcutNewContact);
  document.removeEventListener('shortcut:meeting-finder', handleShortcutMeetingFinder);
  document.removeEventListener('shortcut:export', handleShortcutExport);
  document.removeEventListener('shortcut:import', handleShortcutImport);
  document.removeEventListener('shortcut:view', handleShortcutView as EventListener);
  document.removeEventListener('shortcut:escape', handleShortcutEscape);
  document.removeEventListener('click', handleClickOutside);
});

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('[aria-label="More actions"]')) {
    showActionsMenu.value = false;
  }
}

function openImportExport(mode: 'import' | 'export') {
  importExportMode.value = mode;
  showImportExport.value = true;
  showActionsMenu.value = false;
}

function handleTimeUpdate(date: Date) {
  selectedDate.value = date;
}

function formatTime(date: Date, timezone: string): string {
  return timeService.formatTime(date, timezone, 'en');
}

async function handleSignOut() {
  await authStore.signOut();
  router.push('/login');
}

function handleEditContact(contact: Contact) {
  selectedContact.value = contact;
  showContactModal.value = true;
}

async function handleDeleteContact(id: string) {
  if (!confirm(t('contacts.deleteConfirm'))) return;

  const { success } = await contactsStore.deleteContact(id);
  if (success) {
    notificationStore.add('success', t('profile.updateSuccess'));
  }
}

function handleCloseModal() {
  showContactModal.value = false;
  selectedContact.value = null;
}

async function handleSubmitContact(contact: Partial<Contact>) {
  if (selectedContact.value) {
    const { success } = await contactsStore.updateContact(selectedContact.value.id, contact);
    if (success) {
      notificationStore.add('success', t('profile.updateSuccess'));
      handleCloseModal();
    }
  } else {
    const { success } = await contactsStore.addContact(contact);
    if (success) {
      notificationStore.add('success', t('profile.updateSuccess'));
      handleCloseModal();
    }
  }
}
</script>
