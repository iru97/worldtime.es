<template>
  <div class="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-[var(--card-shadow)] overflow-hidden">
    <!-- Header with name and actions -->
    <div class="p-6 flex justify-between items-start border-b border-[var(--card-border)]">
      <div>
        <h3 class="text-xl font-semibold text-[var(--text-primary)] mb-1">{{ contact.name }}</h3>
        <p class="text-sm text-[var(--text-secondary)]">
          {{ contact.location || $t('contacts.noLocation') }}
        </p>
      </div>
      <div class="flex gap-2">
        <button
          @click="emit('edit', contact)"
          class="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-lg"
          :title="$t('person.edit')"
          :aria-label="$t('person.edit')"
        >
          <Edit class="w-5 h-5" aria-hidden="true" />
        </button>
        <button
          @click="emit('delete', contact.id)"
          class="p-2 text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors rounded-lg"
          :title="$t('person.delete')"
          :aria-label="$t('person.delete')"
        >
          <Trash2 class="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Time and Status -->
    <div class="p-6 bg-[var(--accent-bg)] border-b border-[var(--card-border)]">
      <div class="flex items-center gap-3 mb-3">
        <Clock class="w-6 h-6" :class="availability.statusColor" />
        <div class="flex flex-col">
          <span class="text-2xl font-mono font-bold" :class="availability.statusColor">
            {{ availability.state.currentTime }}
          </span>
          <span class="text-sm font-medium" :class="availability.statusColor">
            {{ availability.statusText }}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
        <Timer class="w-4 h-4" />
        <span>
          {{ availability.state.timeUntilNextStatus }} {{ $t('contacts.untilStatusChange') }}
        </span>
      </div>
    </div>

    <!-- Contact Info -->
    <div class="p-6 space-y-4">
      <!-- Email -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-[var(--accent-bg)] flex items-center justify-center">
          <Mail class="w-5 h-5 text-[var(--accent-text)]" />
        </div>
        <div>
          <p class="text-sm text-[var(--text-secondary)] mb-0.5">{{ $t('contacts.email') }}</p>
          <a
            :href="`mailto:${contact.email}`"
            class="text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors"
          >
            {{ contact.email }}
          </a>
        </div>
      </div>

      <!-- Phone -->
      <div v-if="contact.phone" class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-[var(--accent-bg)] flex items-center justify-center">
          <Phone class="w-5 h-5 text-[var(--accent-text)]" />
        </div>
        <div>
          <p class="text-sm text-[var(--text-secondary)] mb-0.5">{{ $t('contacts.phone') }}</p>
          <a
            :href="`tel:${contact.phone}`"
            class="text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors"
          >
            {{ contact.phone }}
          </a>
        </div>
      </div>

      <!-- Local Time -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-[var(--accent-bg)] flex items-center justify-center">
          <Globe2 class="w-5 h-5 text-[var(--accent-text)]" />
        </div>
        <div>
          <p class="text-sm text-[var(--text-secondary)] mb-0.5">{{ $t('contacts.yourTime') }}</p>
          <p class="text-[var(--text-primary)]">{{ availability.state.localTime }}</p>
        </div>
      </div>
    </div>

    <!-- Notes -->
    <div v-if="contact.notes" class="px-6 pb-6">
      <div class="p-4 rounded-lg bg-[var(--accent-bg)] text-sm text-[var(--text-secondary)]">
        {{ contact.notes }}
      </div>
    </div>

    <!-- Footer -->
    <div class="px-6 py-4 bg-[var(--card-bg)] border-t border-[var(--card-border)]">
      <div class="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        <Globe2 class="w-4 h-4" />
        <span>{{ contact.timezone }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Edit, Trash2, Mail, Phone, Clock, Timer, Globe2 } from 'lucide-vue-next';
import type { Contact } from '@/types';
import { useContactAvailability } from '@/composables/useContactAvailability';

const props = defineProps<{
  contact: Contact;
}>();

const emit = defineEmits<{
  (e: 'edit', contact: Contact): void;
  (e: 'delete', id: string): void;
}>();

const availability = useContactAvailability(props.contact.timezone);
</script>