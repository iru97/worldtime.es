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
            <div class="flex items-center gap-1 bg-[var(--accent-bg)] rounded-lg p-1">
              <button
                @click="view = 'timeline'"
                class="p-2 rounded-md transition-colors"
                :class="view === 'timeline' ? 'bg-white text-[var(--accent-text)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'"
              >
                <Clock class="w-5 h-5" />
              </button>
              <button
                @click="view = 'list'"
                class="p-2 rounded-md transition-colors"
                :class="view === 'list' ? 'bg-white text-[var(--accent-text)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'"
              >
                <List class="w-5 h-5" />
              </button>
            </div>

            <ThemeToggle />
            <LanguageSelector />

            <RouterLink
              to="/profile"
              class="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <UserCircle class="w-5 h-5" />
            </RouterLink>
            
            <button
              @click="handleSignOut"
              class="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <LogOut class="w-5 h-5" />
            </button>
          </div>

          <!-- Mobile Menu Button -->
          <button
            class="sm:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            @click="showMobileMenu = true"
          >
            <Menu class="w-6 h-6" />
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
        <!-- Add Contact Button -->
        <div class="flex justify-end">
          <button
            @click="showContactModal = true"
            class="btn btn-primary flex items-center gap-2"
          >
            <UserPlus class="w-5 h-5" />
            {{ $t('contacts.addNew') }}
          </button>
        </div>

        <!-- Timeline View -->
        <Timeline
          v-if="view === 'timeline'"
          :selected-date="selectedDate"
          @update="handleTimeUpdate"
        />

        <!-- Contact List -->
        <div v-if="contactsStore.loading" class="flex justify-center py-8">
          <Loader2 class="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
        </div>

        <div v-else>
          <div v-if="view === 'timeline'" class="space-y-4">
            <TimeCard
              v-for="contact in contactsStore.contacts"
              :key="contact.id"
              :name="contact.name"
              :timezone="contact.timezone"
              :time="formatTime(selectedDate, contact.timezone)"
            />
          </div>
          <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ContactCard
              v-for="contact in contactsStore.contacts"
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Users, Clock, List, Menu, UserCircle, LogOut, UserPlus, Loader2 } from 'lucide-vue-next';
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
  if (!confirm($t('contacts.deleteConfirm'))) return;

  const { success } = await contactsStore.deleteContact(id);
  if (success) {
    notificationStore.add('success', 'Contact deleted successfully');
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
      notificationStore.add('success', 'Contact updated successfully');
      handleCloseModal();
    }
  } else {
    const { success } = await contactsStore.addContact(contact);
    if (success) {
      notificationStore.add('success', 'Contact added successfully');
      handleCloseModal();
    }
  }
}
</script>
```