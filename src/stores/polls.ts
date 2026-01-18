import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { pollService } from '@/services/api';
import { useNotificationStore } from './notifications';
import type { MeetingPoll, PollOption, PollParticipant } from '@/types';

export const usePollsStore = defineStore('polls', () => {
  const notificationStore = useNotificationStore();

  // State
  const polls = ref<MeetingPoll[]>([]);
  const currentPoll = ref<MeetingPoll | null>(null);
  const participants = ref<PollParticipant[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const stats = ref<{
    total: number;
    open: number;
    closed: number;
    confirmed: number;
  } | null>(null);

  // Getters
  const openPolls = computed(() => polls.value.filter((p) => p.status === 'open'));
  const closedPolls = computed(() => polls.value.filter((p) => p.status === 'closed'));
  const confirmedPolls = computed(() => polls.value.filter((p) => p.status === 'confirmed'));

  // Actions
  async function fetchPolls(status?: MeetingPoll['status']) {
    loading.value = true;
    error.value = null;

    const result = await pollService.getPolls(status);

    if (result.success && result.data) {
      polls.value = result.data;
    } else {
      error.value = result.error?.message || 'Failed to fetch polls';
      notificationStore.add('error', error.value);
    }

    loading.value = false;
    return result;
  }

  async function fetchPoll(id: string) {
    loading.value = true;
    error.value = null;

    const result = await pollService.getPoll(id);

    if (result.success && result.data) {
      currentPoll.value = result.data;
    } else {
      error.value = result.error?.message || 'Failed to fetch poll';
    }

    loading.value = false;
    return result;
  }

  async function fetchPollBySlug(slug: string) {
    loading.value = true;
    error.value = null;

    const result = await pollService.getPollBySlug(slug);

    if (result.success && result.data) {
      currentPoll.value = result.data;
    } else {
      error.value = result.error?.message || 'Poll not found';
    }

    loading.value = false;
    return result;
  }

  async function createPoll(data: {
    title: string;
    description?: string;
    location?: string;
    duration_minutes?: number;
    timezone?: string;
    deadline?: string;
    is_anonymous?: boolean;
    allow_comments?: boolean;
    allow_maybe?: boolean;
    limit_per_option?: number;
    auto_confirm?: boolean;
    options: { start_time: string; end_time: string }[];
  }) {
    loading.value = true;
    const result = await pollService.createPoll(data);

    if (result.success && result.data) {
      polls.value.unshift(result.data);
      notificationStore.add('success', 'Poll created');
    } else {
      notificationStore.add('error', result.error?.message || 'Failed to create poll');
    }

    loading.value = false;
    return result;
  }

  async function updatePoll(id: string, data: Partial<MeetingPoll>) {
    const result = await pollService.updatePoll(id, data);

    if (result.success && result.data) {
      const index = polls.value.findIndex((p) => p.id === id);
      if (index >= 0) {
        polls.value[index] = result.data;
      }
      if (currentPoll.value?.id === id) {
        currentPoll.value = result.data;
      }
      notificationStore.add('success', 'Poll updated');
    } else {
      notificationStore.add('error', result.error?.message || 'Failed to update poll');
    }

    return result;
  }

  async function closePoll(id: string) {
    const result = await pollService.closePoll(id);

    if (result.success && result.data) {
      const index = polls.value.findIndex((p) => p.id === id);
      if (index >= 0) {
        polls.value[index] = result.data;
      }
      if (currentPoll.value?.id === id) {
        currentPoll.value = result.data;
      }
      notificationStore.add('success', 'Poll closed');
    } else {
      notificationStore.add('error', result.error?.message || 'Failed to close poll');
    }

    return result;
  }

  async function confirmPoll(id: string, optionId: string) {
    const result = await pollService.confirmPoll(id, optionId);

    if (result.success && result.data) {
      const index = polls.value.findIndex((p) => p.id === id);
      if (index >= 0) {
        polls.value[index] = result.data;
      }
      if (currentPoll.value?.id === id) {
        currentPoll.value = result.data;
      }
      notificationStore.add('success', 'Meeting time confirmed');
    } else {
      notificationStore.add('error', result.error?.message || 'Failed to confirm poll');
    }

    return result;
  }

  async function deletePoll(id: string) {
    const result = await pollService.deletePoll(id);

    if (result.success) {
      polls.value = polls.value.filter((p) => p.id !== id);
      if (currentPoll.value?.id === id) {
        currentPoll.value = null;
      }
      notificationStore.add('success', 'Poll deleted');
    } else {
      notificationStore.add('error', result.error?.message || 'Failed to delete poll');
    }

    return result;
  }

  async function submitVotes(
    pollSlug: string,
    participant: { name: string; email?: string; comment?: string },
    votes: Record<string, 'yes' | 'no' | 'maybe'>
  ) {
    loading.value = true;
    const result = await pollService.submitVotes(pollSlug, participant, votes);

    if (result.success) {
      notificationStore.add('success', 'Votes submitted');
      // Refresh poll data
      await fetchPollBySlug(pollSlug);
    } else {
      notificationStore.add('error', result.error?.message || 'Failed to submit votes');
    }

    loading.value = false;
    return result;
  }

  async function fetchParticipants(pollId: string) {
    const result = await pollService.getPollParticipants(pollId);

    if (result.success && result.data) {
      participants.value = result.data;
    }

    return result;
  }

  async function fetchBestOptions(pollId: string) {
    return await pollService.getBestOptions(pollId);
  }

  async function fetchStats() {
    const result = await pollService.getPollStats();

    if (result.success && result.data) {
      stats.value = result.data;
    }

    return result;
  }

  function getPollUrl(poll: MeetingPoll): string {
    return `${window.location.origin}/poll/${poll.slug}`;
  }

  function clearCurrentPoll() {
    currentPoll.value = null;
    participants.value = [];
  }

  return {
    // State
    polls,
    currentPoll,
    participants,
    loading,
    error,
    stats,

    // Getters
    openPolls,
    closedPolls,
    confirmedPolls,

    // Actions
    fetchPolls,
    fetchPoll,
    fetchPollBySlug,
    createPoll,
    updatePoll,
    closePoll,
    confirmPoll,
    deletePoll,
    submitVotes,
    fetchParticipants,
    fetchBestOptions,
    fetchStats,
    getPollUrl,
    clearCurrentPoll,
  };
});
