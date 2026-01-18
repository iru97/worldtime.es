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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Users, Clock, List, Menu, UserCircle, LogOut, UserPlus, Loader2, Search, X } from 'lucide-vue-next';
import type { Contact } from '@/types';
import { TimeService } from '@/services/TimeService';
import { useAuthStore } from '@/stores/auth';
import { useContactsStore } from '@/stores/contacts';
import { useNotificationStore } from '@/stores/notifications';
import Timeline from '@/components/Timeline.vue';
import TimeCard from '@/components/TimeCard.vue';
import ContactCard from '@/components/ContactCard.vue';
import ContactModal from '@/components/ContactModal.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';
import MobileDrawer from '@/components/MobileDrawer.vue';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const contactsStore = useContactsStore();
const notificationStore = useNotificationStore();
const timeService = new TimeService();

const view = ref<'timeline' | 'list'>('timeline');
const selectedDate = ref(new Date());
const showMobileMenu = ref(false);
const showContactModal = ref(false);
const selectedContact = ref<Contact | null>(null);
const searchQuery = ref('');

// Filter contacts based on search query
const filteredContacts = computed(() => {
  if (!searchQuery.value.trim()) {
    return contactsStore.contacts;
  }

  const query = searchQuery.value.toLowerCase().trim();
  return contactsStore.contacts.filter((contact) => {
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query) ||
      contact.timezone.toLowerCase().includes(query) ||
      (contact.location && contact.location.toLowerCase().includes(query)) ||
      (contact.phone && contact.phone.includes(query))
    );
  });
});

onMounted(async () => {
  await contactsStore.fetchContacts();
});

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
