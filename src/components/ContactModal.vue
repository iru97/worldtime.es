<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div class="card max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-semibold text-[var(--text-primary)]">
          {{ props.contact ? 'Edit Contact' : 'Add Contact' }}
        </h2>
        <button
          @click="$emit('close')"
          class="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X class="w-6 h-6" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label for="name" class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Name
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            class="input"
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Email
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="input"
          />
        </div>

        <div>
          <label for="phone" class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Phone (optional)
          </label>
          <input
            id="phone"
            v-model="form.phone"
            type="tel"
            class="input"
          />
        </div>

        <div>
          <label for="timezone" class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Timezone
          </label>
          <select
            id="timezone"
            v-model="form.timezone"
            required
            class="input"
          >
            <option value="">Select a timezone</option>
            <option v-for="tz in timezones" :key="tz" :value="tz">
              {{ tz }}
            </option>
          </select>
        </div>

        <div>
          <label for="location" class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Location (optional)
          </label>
          <input
            id="location"
            v-model="form.location"
            type="text"
            class="input"
          />
        </div>

        <div>
          <label for="notes" class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            v-model="form.notes"
            rows="3"
            class="input"
          ></textarea>
        </div>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="$emit('close')"
            class="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
          >
            {{ props.contact ? 'Update' : 'Add' }} Contact
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { X } from 'lucide-vue-next';
import type { Contact } from '@/types';
import { TimeService } from '@/services/TimeService';

const props = defineProps<{
  contact?: Contact;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', contact: Partial<Contact>): void;
}>();

const timeService = new TimeService();
const timezones = ref<string[]>([]);

const form = ref({
  name: props.contact?.name || '',
  email: props.contact?.email || '',
  phone: props.contact?.phone || '',
  timezone: props.contact?.timezone || '',
  location: props.contact?.location || '',
  notes: props.contact?.notes || '',
});

function handleSubmit() {
  emit('submit', {
    ...form.value,
    id: props.contact?.id,
    user_id: props.contact?.user_id,
  });
}

onMounted(() => {
  timezones.value = timeService.getTimezones();
});
</script>