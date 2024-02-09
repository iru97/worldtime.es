<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
    <header class="bg-white dark:bg-gray-800 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center gap-3">
            <Users class="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Contacts</h1>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <button
                @click="view = 'timeline'"
                class="px-3 py-2 rounded-lg transition-colors"
                :class="view === 'timeline' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'"
              >
                <Clock class="w-5 h-5" />
              </button>
              <button
                @click="view = 'list'"
                class="px-3 py-2 rounded-lg transition-colors"
                :class="view === 'list' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'"
              >
                <List class="w-5 h-5" />
              </button>
            </div>
            <ThemeToggle />
            <RouterLink
              to="/profile"
              class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <UserCircle class="w-6 h-6" />
            </RouterLink>
            <button
              @click="handleSignOut"
              class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <LogOut class="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Timeline View -->
      <div v-if="view === 'timeline'" class="space-y-8">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h2 class="text-lg font-medium text-gray-900 dark:text-white">Timeline View</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">See what time it is for your contacts</p>
          </div>
          <button
            @click="showAddContact = true"
            class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus class="w-5 h-5" />
            Add Contact
          </button>
        </div>

        <Timeline
          :selected-date="selectedDate"
          @update="handleTimelineUpdate"
        />

        <div class="space-y-4">
          <div
            v-for="contact in sortedContacts"
            :key="contact.id"
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div class="flex items-center justify-between">
              <div class="w-48">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ contact.name }}</h3>
              </div>
              <div class="flex items-center gap-6">
                <div class="text-center">
                  <div class="text-4xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {{ formatTime(selectedDate, contact.timezone) }}
                  </div>
                  <div class="text-xl font-medium text-indigo-500 dark:text-indigo-400 mt-1">
                    {{ formatTimezone(contact.timezone) }}
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    @click="handleEditContact(contact)"
                    class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Edit class="w-5 h-5" />
                  </button>
                  <button
                    @click="handleDeleteContact(contact.id)"
                    class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 class="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-else class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-lg font-medium text-gray-900 dark:text-white">Your Contacts</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">Manage your international network</p>
          </div>
          <button
            @click="showAddContact = true"
            class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus class="w-5 h-5" />
            Add Contact
          </button>
        </div>

        <!-- Search and Filter Section -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div class="flex flex-wrap gap-4">
            <div class="flex-1 min-w-[240px]">
              <div class="relative">
                <Search class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search contacts..."
                  class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div class="w-48">
              <select
                v-model="timezoneFilter"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Timezones</option>
                <option v-for="tz in uniqueTimezones" :key="tz" :value="tz">
                  {{ tz }}
                </option>
              </select>
            </div>
            <div class="w-48">
              <select
                v-model="statusFilter"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="working">Working</option>
                <option value="sleeping">Sleeping</option>
                <option value="free">Free Time</option>
              </select>
            </div>
            <div class="w-48">
              <select
                v-model="sortBy"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="name">Sort by Name</option>
                <option value="timezone">Sort by Timezone</option>
                <option value="status">Sort by Status</option>
                <option value="recent">Recently Added</option>
              </select>
            </div>
          </div>

          <div v-if="hasFilters" class="mt-4 flex items-center gap-2">
            <div class="text-sm text-gray-500 dark:text-gray-400">Active filters:</div>
            <div class="flex flex-wrap gap-2">
              <button
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-md text-sm hover:bg-indigo-100 dark:hover:bg-indigo-800"
              >
                Search: "{{ searchQuery }}"
                <X class="w-4 h-4" />
              </button>
              <button
                v-if="timezoneFilter"
                @click="timezoneFilter = ''"
                class="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-md text-sm hover:bg-indigo-100 dark:hover:bg-indigo-800"
              >
                Timezone: {{ timezoneFilter }}
                <X class="w-4 h-4" />
              </button>
              <button
                v-if="statusFilter"
                @click="statusFilter = ''"
                class="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-md text-sm hover:bg-indigo-100 dark:hover:bg-indigo-800"
              >
                Status: {{ statusFilter }}
                <X class="w-4 h-4" />
              </button>
              <button
                v-if="hasFilters"
                @click="clearFilters"
                class="inline-flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md text-sm hover:bg-red-100 dark:hover:bg-red-800"
              >
                Clear all
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="contactsStore.loading" class="text-center py-12">
          <Loader2 class="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
          <p class="mt-2 text-gray-600 dark:text-gray-400">Loading contacts...</p>
        </div>

        <div v-else-if="contactsStore.contacts.length === 0" class="text-center py-12">
          <Users class="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">No contacts yet</h3>
          <p class="text-gray-500 dark:text-gray-400">Get started by adding your first contact</p>
        </div>

        <div v-else>
          <div v-if="filteredContacts.length === 0" class="text-center py-12">
            <Search class="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">No matching contacts</h3>
            <p class="text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
          </div>

          <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ContactCard
              v-for="contact in sortedContacts"
              :key="contact.id"
              :contact="contact"
              @edit="handleEditContact"
              @delete="handleDeleteContact"
            />
          </div>
        </div>
      </div>
    </main>

    <ContactModal
      v-if="showAddContact"
      @close="showAddContact = false"
      @submit="handleAddContact"
    />

    <ContactModal
      v-if="editingContact"
      :contact="editingContact"
      @close="editingContact = null"
      @submit="handleUpdateContact"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { Users, UserCircle, LogOut, Plus, Loader2, Search, X, List, Clock, Edit, Trash2 } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useContactsStore } from '@/stores/contacts';
import type { Contact } from '@/types';
import ContactCard from '@/components/ContactCard.vue';
import ContactModal from '@/components/ContactModal.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import Timeline from '@/components/Timeline.vue';
import { useContactAvailability } from '@/composables/useContactAvailability';
import { TimeService } from '@/services/TimeService';

const router = useRouter();
const authStore = useAuthStore();
const contactsStore = useContactsStore();
const timeService = new TimeService();
const showAddContact = ref(false);
const editingContact = ref<Contact | null>(null);
const searchQuery = ref('');
const timezoneFilter = ref('');
const statusFilter = ref('');
const sortBy = ref('name');
const selectedDate = ref(new Date());
const view = ref<'list' | 'timeline'>('timeline');

// Cache contact statuses to improve performance
const contactStatuses = ref(new Map<string, string>());

function formatTime(date: Date, timezone: string): string {
  return date.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatTimezone(timezone: string): string {
  return timezone.split('/')[1].replace(/_/g, ' ');
}

function getContactStatus(contact: Contact) {
  const { statusColor, statusText } = useContactAvailability(contact.timezone);
  return {
    color: statusColor.value,
    text: statusText.value,
  };
}

// Get unique timezones from contacts
const uniqueTimezones = computed(() => {
  const timezones = new Set(contactsStore.contacts.map(contact => contact.timezone));
  return Array.from(timezones).sort();
});

// Check if any filters are active
const hasFilters = computed(() => {
  return !!(searchQuery.value || timezoneFilter.value || statusFilter.value);
});

// Filter contacts based on search query and filters
const filteredContacts = computed(() => {
  return contactsStore.contacts.filter(contact => {
    const matchesSearch = !searchQuery.value || 
      contact.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (contact.location && contact.location.toLowerCase().includes(searchQuery.value.toLowerCase()));

    const matchesTimezone = !timezoneFilter.value || contact.timezone === timezoneFilter.value;

    const matchesStatus = !statusFilter.value || getContactStatus(contact).text.toLowerCase() === statusFilter.value;

    return matchesSearch && matchesTimezone && matchesStatus;
  });
});

// Sort filtered contacts
const sortedContacts = computed(() => {
  return [...filteredContacts.value].sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'timezone':
        return a.timezone.localeCompare(b.timezone);
      case 'status':
        return getContactStatus(a).text.localeCompare(getContactStatus(b).text);
      case 'recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });
});

// Clear all filters
function clearFilters() {
  searchQuery.value = '';
  timezoneFilter.value = '';
  statusFilter.value = '';
}

function handleTimelineUpdate(date: Date) {
  selectedDate.value = date;
}

// Update contact statuses periodically
let statusUpdateInterval: number;

onMounted(() => {
  contactsStore.fetchContacts();
  // Update contact statuses every minute
  statusUpdateInterval = window.setInterval(() => {
    contactStatuses.value.clear();
  }, 60000);
});

onUnmounted(() => {
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
  }
});

async function handleAddContact(contact: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { success } = await contactsStore.addContact(contact);
  if (success) {
    showAddContact.value = false;
  }
}

async function handleUpdateContact(contact: Contact) {
  const { success } = await contactsStore.updateContact(contact.id, contact);
  if (success) {
    editingContact.value = null;
  }
}

async function handleDeleteContact(id: string) {
  if (confirm('Are you sure you want to delete this contact?')) {
    await contactsStore.deleteContact(id);
  }
}

function handleEditContact(contact: Contact) {
  editingContact.value = contact;
}

async function handleSignOut() {
  await authStore.signOut();
  router.push('/login');
}
</script>