<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
    <!-- Loading State -->
    <div v-if="loading" class="min-h-screen flex items-center justify-center">
      <Loader2 class="w-8 h-8 animate-spin text-purple-500" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="min-h-screen flex items-center justify-center p-4">
      <div class="card max-w-md w-full p-8 text-center">
        <AlertCircle class="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h2 class="text-xl font-semibold text-[var(--text-primary)] mb-2">Poll Not Found</h2>
        <p class="text-[var(--text-secondary)]">{{ error }}</p>
      </div>
    </div>

    <!-- Poll Closed State -->
    <div v-else-if="poll?.status === 'closed'" class="min-h-screen flex items-center justify-center p-4">
      <div class="card max-w-md w-full p-8 text-center">
        <XCircle class="w-12 h-12 mx-auto mb-4 text-orange-500" />
        <h2 class="text-xl font-semibold text-[var(--text-primary)] mb-2">Poll Closed</h2>
        <p class="text-[var(--text-secondary)]">This poll is no longer accepting votes.</p>
      </div>
    </div>

    <!-- Poll Confirmed State -->
    <div v-else-if="poll?.status === 'confirmed'" class="min-h-screen flex items-center justify-center p-4">
      <div class="card max-w-lg w-full p-8">
        <div class="text-center mb-6">
          <CheckCircle class="w-12 h-12 mx-auto mb-4 text-green-500" />
          <h2 class="text-xl font-semibold text-[var(--text-primary)] mb-2">Meeting Confirmed!</h2>
          <p class="text-[var(--text-secondary)]">The meeting time has been finalized.</p>
        </div>

        <div class="bg-[var(--accent-bg)] rounded-lg p-4">
          <h3 class="font-semibold text-[var(--text-primary)] mb-3">{{ poll.title }}</h3>
          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-2 text-[var(--text-secondary)]">
              <CalendarDays class="w-4 h-4" />
              {{ formatConfirmedTime(confirmedOption!) }}
            </div>
            <div v-if="poll.location" class="flex items-center gap-2 text-[var(--text-secondary)]">
              <MapPin class="w-4 h-4" />
              {{ poll.location }}
            </div>
            <div class="flex items-center gap-2 text-[var(--text-secondary)]">
              <Clock class="w-4 h-4" />
              {{ poll.duration_minutes }} minutes
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Voting Interface -->
    <div v-else-if="poll" class="max-w-3xl mx-auto py-8 px-4">
      <!-- Header -->
      <div class="card p-6 mb-6">
        <h1 class="text-2xl font-bold text-[var(--text-primary)] mb-2">{{ poll.title }}</h1>
        <p v-if="poll.description" class="text-[var(--text-secondary)] mb-4">
          {{ poll.description }}
        </p>
        <div class="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
          <span class="flex items-center gap-1">
            <Clock class="w-4 h-4" />
            {{ poll.duration_minutes }} minutes
          </span>
          <span v-if="poll.location" class="flex items-center gap-1">
            <MapPin class="w-4 h-4" />
            {{ poll.location }}
          </span>
          <span v-if="poll.deadline" class="flex items-center gap-1">
            <Calendar class="w-4 h-4" />
            Deadline: {{ formatDeadline(poll.deadline) }}
          </span>
        </div>
      </div>

      <!-- Success Message -->
      <div v-if="submitted" class="card p-6 mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <div class="flex items-center gap-3">
          <CheckCircle class="w-6 h-6 text-green-600 dark:text-green-400" />
          <div>
            <p class="font-medium text-green-800 dark:text-green-200">Your votes have been submitted!</p>
            <p class="text-sm text-green-600 dark:text-green-400">You can update your votes anytime before the poll closes.</p>
          </div>
        </div>
      </div>

      <!-- Voting Form -->
      <div class="card p-6">
        <!-- Timezone Selector -->
        <div class="flex items-center gap-2 mb-6">
          <Globe class="w-4 h-4 text-[var(--text-tertiary)]" />
          <span class="text-sm text-[var(--text-secondary)]">Show times in:</span>
          <select v-model="viewTimezone" class="input text-sm w-auto">
            <option v-for="tz in commonTimezones" :key="tz" :value="tz">
              {{ formatTimezone(tz) }}
            </option>
          </select>
        </div>

        <!-- Participant Info -->
        <div class="grid md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-[var(--card-border)]">
          <div>
            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Your Name *
            </label>
            <input
              v-model="participant.name"
              type="text"
              required
              class="input"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Email (optional)
            </label>
            <input
              v-model="participant.email"
              type="email"
              class="input"
              placeholder="your@email.com"
            />
          </div>
        </div>

        <!-- Time Options Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr>
                <th class="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                  Time Options
                </th>
                <th class="text-center py-3 px-4 text-sm font-medium text-green-600 dark:text-green-400 w-20">
                  <Check class="w-5 h-5 mx-auto" />
                </th>
                <th v-if="poll.allow_maybe" class="text-center py-3 px-4 text-sm font-medium text-yellow-600 dark:text-yellow-400 w-20">
                  <HelpCircle class="w-5 h-5 mx-auto" />
                </th>
                <th class="text-center py-3 px-4 text-sm font-medium text-red-500 w-20">
                  <X class="w-5 h-5 mx-auto" />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="option in sortedOptions"
                :key="option.id"
                class="border-t border-[var(--card-border)]"
              >
                <td class="py-4 px-4">
                  <div class="font-medium text-[var(--text-primary)]">
                    {{ formatOptionDate(option.start_time) }}
                  </div>
                  <div class="text-sm text-[var(--text-secondary)]">
                    {{ formatOptionTime(option.start_time) }} - {{ formatOptionTime(option.end_time) }}
                  </div>
                  <div v-if="option.vote_count > 0" class="text-xs text-green-600 dark:text-green-400 mt-1">
                    {{ option.vote_count }} {{ option.vote_count === 1 ? 'person' : 'people' }} available
                    <span v-if="option.maybe_count > 0" class="text-yellow-600 dark:text-yellow-400">
                      • {{ option.maybe_count }} maybe
                    </span>
                  </div>
                </td>
                <td class="text-center py-4 px-4">
                  <button
                    @click="setVote(option.id, 'yes')"
                    class="w-10 h-10 rounded-full transition-colors flex items-center justify-center mx-auto"
                    :class="
                      votes[option.id] === 'yes'
                        ? 'bg-green-500 text-white'
                        : 'bg-[var(--accent-bg)] text-[var(--text-tertiary)] hover:bg-green-100 dark:hover:bg-green-900'
                    "
                  >
                    <Check class="w-5 h-5" />
                  </button>
                </td>
                <td v-if="poll.allow_maybe" class="text-center py-4 px-4">
                  <button
                    @click="setVote(option.id, 'maybe')"
                    class="w-10 h-10 rounded-full transition-colors flex items-center justify-center mx-auto"
                    :class="
                      votes[option.id] === 'maybe'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-[var(--accent-bg)] text-[var(--text-tertiary)] hover:bg-yellow-100 dark:hover:bg-yellow-900'
                    "
                  >
                    <HelpCircle class="w-5 h-5" />
                  </button>
                </td>
                <td class="text-center py-4 px-4">
                  <button
                    @click="setVote(option.id, 'no')"
                    class="w-10 h-10 rounded-full transition-colors flex items-center justify-center mx-auto"
                    :class="
                      votes[option.id] === 'no'
                        ? 'bg-red-500 text-white'
                        : 'bg-[var(--accent-bg)] text-[var(--text-tertiary)] hover:bg-red-100 dark:hover:bg-red-900'
                    "
                  >
                    <X class="w-5 h-5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Comment -->
        <div v-if="poll.allow_comments" class="mt-6">
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Comment (optional)
          </label>
          <textarea
            v-model="participant.comment"
            rows="2"
            class="input"
            placeholder="Any notes or preferences?"
          />
        </div>

        <!-- Submit -->
        <button
          @click="submitVotes"
          :disabled="submitting || !participant.name || Object.keys(votes).length === 0"
          class="btn btn-primary w-full mt-6 flex items-center justify-center gap-2"
        >
          <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
          {{ submitting ? 'Submitting...' : submitted ? 'Update Votes' : 'Submit Votes' }}
        </button>
      </div>

      <!-- Participants List -->
      <div v-if="participants.length > 0" class="card p-6 mt-6">
        <h3 class="font-semibold text-[var(--text-primary)] mb-4">
          Participants ({{ participants.length }})
        </h3>

        <div class="space-y-3">
          <div
            v-for="p in participants"
            :key="p.email || p.name"
            class="flex items-center justify-between py-2 border-b border-[var(--card-border)] last:border-0"
          >
            <div>
              <span class="font-medium text-[var(--text-primary)]">
                {{ poll.is_anonymous ? 'Anonymous' : p.name }}
              </span>
              <p v-if="p.comment && !poll.is_anonymous" class="text-sm text-[var(--text-secondary)]">
                "{{ p.comment }}"
              </p>
            </div>
            <div class="flex items-center gap-1">
              <span
                v-for="(vote, optionId) in p.votes"
                :key="optionId"
                class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                :class="{
                  'bg-green-500': vote === 'yes',
                  'bg-yellow-500': vote === 'maybe',
                  'bg-red-500': vote === 'no',
                }"
              >
                {{ vote === 'yes' ? '✓' : vote === 'maybe' ? '?' : '✗' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="py-6 text-center text-sm text-[var(--text-tertiary)]">
      Powered by <a href="/" class="hover:text-[var(--text-primary)]">WorldTime</a>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';
import {
  Loader2, AlertCircle, Clock, MapPin, Calendar, Globe,
  Check, X, HelpCircle, CheckCircle, XCircle, CalendarDays
} from 'lucide-vue-next';
import { pollService } from '@/services/api';
import type { MeetingPoll, PollOption, PollParticipant } from '@/types';

const route = useRoute();

// State
const loading = ref(true);
const error = ref<string | null>(null);
const poll = ref<MeetingPoll | null>(null);
const participants = ref<PollParticipant[]>([]);
const submitted = ref(false);
const submitting = ref(false);

const viewTimezone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone);
const votes = reactive<Record<string, 'yes' | 'no' | 'maybe'>>({});
const participant = reactive({
  name: '',
  email: '',
  comment: '',
});

const commonTimezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

// Computed
const sortedOptions = computed(() => {
  if (!poll.value?.options) return [];
  return [...poll.value.options].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
});

const confirmedOption = computed(() => {
  if (!poll.value?.confirmed_option_id || !poll.value.options) return null;
  return poll.value.options.find((o) => o.id === poll.value!.confirmed_option_id);
});

// Methods
function formatTimezone(tz: string): string {
  try {
    const now = new Date();
    const offset = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short',
    }).formatToParts(now).find(p => p.type === 'timeZoneName')?.value || '';

    const city = tz.split('/').pop()?.replace(/_/g, ' ') || tz;
    return `${city} (${offset})`;
  } catch {
    return tz;
  }
}

function formatOptionDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: viewTimezone.value,
  });
}

function formatOptionTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: viewTimezone.value,
  });
}

function formatDeadline(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatConfirmedTime(option: PollOption): string {
  const date = new Date(option.start_time);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function setVote(optionId: string, vote: 'yes' | 'no' | 'maybe') {
  if (votes[optionId] === vote) {
    delete votes[optionId];
  } else {
    votes[optionId] = vote;
  }
}

async function submitVotes() {
  if (!poll.value || !participant.name || Object.keys(votes).length === 0) return;

  submitting.value = true;

  const result = await pollService.submitVotes(
    poll.value.slug,
    {
      name: participant.name,
      email: participant.email || undefined,
      comment: participant.comment || undefined,
    },
    votes
  );

  submitting.value = false;

  if (result.success) {
    submitted.value = true;
    // Refresh participants
    await loadParticipants();
  } else {
    alert(result.error?.message || 'Failed to submit votes');
  }
}

async function loadParticipants() {
  if (!poll.value) return;

  const result = await pollService.getPollParticipants(poll.value.id);
  if (result.success && result.data) {
    participants.value = result.data;
  }
}

// Load poll
onMounted(async () => {
  const { slug } = route.params;

  if (!slug) {
    error.value = 'Invalid poll link';
    loading.value = false;
    return;
  }

  const result = await pollService.getPollBySlug(slug as string);

  if (result.success && result.data) {
    poll.value = result.data;

    // Load participants if poll is open
    if (result.data.status === 'open') {
      await loadParticipants();
    }
  } else {
    error.value = result.error?.message || 'Poll not found';
  }

  loading.value = false;
});
</script>
