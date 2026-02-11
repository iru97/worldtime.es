<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="emit('close')">
    <div class="card max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="p-6 border-b border-[var(--card-border)]">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-[var(--accent-bg)] flex items-center justify-center">
              <Calendar class="w-5 h-5 text-[var(--accent-primary)]" aria-hidden="true" />
            </div>
            <div>
              <h2 class="text-xl font-semibold text-[var(--text-primary)]">{{ $t('meeting.title') }}</h2>
              <p class="text-sm text-[var(--text-secondary)]">{{ $t('meeting.description') }}</p>
            </div>
          </div>
          <button
            @click="emit('close')"
            class="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            :aria-label="$t('common.cancel')"
          >
            <X class="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto flex-1 space-y-6">
        <!-- Contact Selection -->
        <div>
          <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
            {{ $t('meeting.selectContacts') }}
          </label>
          <div class="space-y-2 max-h-48 overflow-y-auto border border-[var(--card-border)] rounded-lg p-2">
            <label
              v-for="contact in contacts"
              :key="contact.id"
              class="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--accent-bg)] cursor-pointer"
            >
              <input
                type="checkbox"
                :value="contact.id"
                v-model="selectedContactIds"
                class="w-4 h-4 text-[var(--accent-primary)] rounded border-[var(--card-border)] focus:ring-[var(--accent-primary)]"
              />
              <div class="flex-1">
                <p class="text-[var(--text-primary)]">{{ contact.name }}</p>
                <p class="text-sm text-[var(--text-secondary)]">{{ contact.timezone }}</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Duration -->
        <div>
          <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
            {{ $t('meeting.duration') }}
          </label>
          <select
            v-model="duration"
            class="w-full px-4 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]"
          >
            <option :value="30">30 min</option>
            <option :value="60">1 hour</option>
            <option :value="90">1.5 hours</option>
            <option :value="120">2 hours</option>
          </select>
        </div>

        <!-- Find Button -->
        <button
          @click="handleFindTimes"
          :disabled="selectedContactIds.length < 2 || isCalculating"
          class="btn btn-primary w-full flex items-center justify-center gap-2"
        >
          <Loader2 v-if="isCalculating" class="w-5 h-5 animate-spin" aria-hidden="true" />
          <Search v-else class="w-5 h-5" aria-hidden="true" />
          {{ $t('meeting.findTime') }}
        </button>

        <!-- Results -->
        <div v-if="results" class="space-y-4">
          <div v-if="!results.hasOverlap" class="p-4 bg-[var(--danger-bg)] text-[var(--danger)] rounded-lg flex items-center gap-2">
            <AlertCircle class="w-5 h-5" aria-hidden="true" />
            {{ $t('meeting.noOverlap') }}
          </div>

          <div>
            <h3 class="text-lg font-medium text-[var(--text-primary)] mb-3">{{ $t('meeting.bestTimes') }}</h3>
            <div class="space-y-3">
              <div
                v-for="(slot, index) in results.slots"
                :key="slot.hour"
                class="p-4 rounded-lg border border-[var(--card-border)]"
                :class="index === 0 ? 'bg-[var(--accent-bg)]' : 'bg-[var(--card-bg)]'"
              >
                <div class="flex items-center justify-between mb-3">
                  <span class="text-lg font-mono font-bold text-[var(--text-primary)]">
                    {{ formatHour(slot.hour) }} {{ userTimezone }}
                  </span>
                  <span
                    class="px-2 py-1 rounded-full text-xs font-medium"
                    :class="getScoreClass(slot.score, selectedContactIds.length)"
                  >
                    {{ getScoreLabel(slot.score, selectedContactIds.length) }}
                  </span>
                </div>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="participant in slot.participantStatuses"
                    :key="participant.contactId"
                    class="flex items-center gap-1 text-sm"
                  >
                    <span class="w-2 h-2 rounded-full" :class="getStatusDotClass(participant.status)" />
                    <span class="text-[var(--text-secondary)]">
                      {{ participant.contactName }}: {{ formatHour(participant.localHour) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Calendar, X, Search, Loader2, AlertCircle } from 'lucide-vue-next';
import type { Contact } from '@/types';
import { useBestTime } from '@/composables/useBestTime';
import { useAuthStore } from '@/stores/auth';

const props = defineProps<{
  contacts: Contact[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const authStore = useAuthStore();
const { isCalculating, results, findBestTimes, formatHour } = useBestTime();

const selectedContactIds = ref<string[]>([]);
const duration = ref(60);

const userTimezone = computed(() => {
  const tz = authStore.user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return tz.split('/').pop()?.replace(/_/g, ' ') || tz;
});

function handleFindTimes() {
  const selectedContacts = props.contacts.filter((c) => selectedContactIds.value.includes(c.id));
  const refTimezone = authStore.user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  findBestTimes(selectedContacts, refTimezone, duration.value / 60);
}

function getScoreClass(score: number, participants: number): string {
  const maxScore = participants * 2;
  const percentage = score / maxScore;

  if (percentage >= 0.9) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
  if (percentage >= 0.7) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
}

function getScoreLabel(score: number, participants: number): string {
  const maxScore = participants * 2;
  const percentage = score / maxScore;

  if (percentage >= 0.9) return 'Excellent';
  if (percentage >= 0.7) return 'Good';
  if (percentage >= 0.5) return 'Fair';
  return 'Poor';
}

function getStatusDotClass(status: 'working' | 'free' | 'sleeping'): string {
  switch (status) {
    case 'working':
      return 'bg-green-500';
    case 'free':
      return 'bg-yellow-500';
    case 'sleeping':
      return 'bg-indigo-400';
  }
}
</script>
