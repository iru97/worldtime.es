import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { teamService } from '@/services/api/TeamService';
import { useNotificationStore } from './notifications';
import type { Team, TeamMember } from '@/types';

export const useTeamsStore = defineStore('teams', () => {
  // State
  const teams = ref<Team[]>([]);
  const currentTeam = ref<Team | null>(null);
  const members = ref<TeamMember[]>([]);
  const loading = ref(false);
  const membersLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const hasTeams = computed(() => teams.value.length > 0);

  const ownedTeams = computed(() =>
    teams.value.filter((t) => t.owner_id === currentTeam.value?.owner_id)
  );

  const memberTeams = computed(() =>
    teams.value.filter((t) => t.owner_id !== currentTeam.value?.owner_id)
  );

  const currentTeamMembers = computed(() => members.value);

  const isOwner = computed(() => {
    if (!currentTeam.value) return false;
    const member = members.value.find((m) => m.role === 'owner');
    return !!member;
  });

  const isAdmin = computed(() => {
    const member = members.value.find((m) => ['owner', 'admin'].includes(m.role));
    return !!member;
  });

  // Actions
  async function fetchTeams() {
    loading.value = true;
    error.value = null;

    try {
      const result = await teamService.getTeams();
      if (result.success && result.data) {
        teams.value = result.data;
        // Auto-select first team if none selected
        if (!currentTeam.value && teams.value.length > 0) {
          await selectTeam(teams.value[0].id);
        }
      } else {
        error.value = result.error?.message || 'Failed to fetch teams';
      }
    } finally {
      loading.value = false;
    }
  }

  async function selectTeam(teamId: string) {
    const team = teams.value.find((t) => t.id === teamId);
    if (team) {
      currentTeam.value = team;
      await fetchMembers(teamId);
    }
  }

  async function fetchMembers(teamId: string) {
    membersLoading.value = true;

    try {
      const result = await teamService.getTeamMembers(teamId);
      if (result.success && result.data) {
        members.value = result.data.data;
      }
    } finally {
      membersLoading.value = false;
    }
  }

  async function createTeam(data: {
    name: string;
    description?: string;
  }): Promise<Team | null> {
    const notifications = useNotificationStore();
    loading.value = true;

    try {
      const result = await teamService.createTeam(data);
      if (result.success && result.data) {
        teams.value.unshift(result.data);
        currentTeam.value = result.data;
        notifications.success('Team created successfully');
        await fetchMembers(result.data.id);
        return result.data;
      } else {
        notifications.error(result.error?.message || 'Failed to create team');
        return null;
      }
    } finally {
      loading.value = false;
    }
  }

  async function updateTeam(data: Partial<Team>): Promise<boolean> {
    if (!currentTeam.value) return false;

    const notifications = useNotificationStore();

    try {
      const result = await teamService.updateTeam(currentTeam.value.id, data);
      if (result.success && result.data) {
        const index = teams.value.findIndex((t) => t.id === currentTeam.value?.id);
        if (index >= 0) {
          teams.value[index] = result.data;
        }
        currentTeam.value = result.data;
        notifications.success('Team updated successfully');
        return true;
      } else {
        notifications.error(result.error?.message || 'Failed to update team');
        return false;
      }
    } catch {
      notifications.error('Failed to update team');
      return false;
    }
  }

  async function deleteTeam(teamId: string): Promise<boolean> {
    const notifications = useNotificationStore();

    try {
      const result = await teamService.deleteTeam(teamId);
      if (result.success) {
        teams.value = teams.value.filter((t) => t.id !== teamId);
        if (currentTeam.value?.id === teamId) {
          currentTeam.value = teams.value[0] || null;
          if (currentTeam.value) {
            await fetchMembers(currentTeam.value.id);
          } else {
            members.value = [];
          }
        }
        notifications.success('Team deleted successfully');
        return true;
      } else {
        notifications.error(result.error?.message || 'Failed to delete team');
        return false;
      }
    } catch {
      notifications.error('Failed to delete team');
      return false;
    }
  }

  async function inviteMember(
    email: string,
    role: 'admin' | 'member' = 'member'
  ): Promise<boolean> {
    if (!currentTeam.value) return false;

    const notifications = useNotificationStore();

    try {
      const result = await teamService.inviteMember(currentTeam.value.id, email, role);
      if (result.success && result.data) {
        members.value.push(result.data);
        notifications.success('Invitation sent successfully');
        return true;
      } else {
        notifications.error(result.error?.message || 'Failed to invite member');
        return false;
      }
    } catch {
      notifications.error('Failed to invite member');
      return false;
    }
  }

  async function updateMemberRole(
    memberId: string,
    role: 'admin' | 'member'
  ): Promise<boolean> {
    if (!currentTeam.value) return false;

    const notifications = useNotificationStore();

    try {
      const result = await teamService.updateMemberRole(currentTeam.value.id, memberId, role);
      if (result.success && result.data) {
        const index = members.value.findIndex((m) => m.id === memberId);
        if (index >= 0) {
          members.value[index] = result.data;
        }
        notifications.success('Member role updated');
        return true;
      } else {
        notifications.error(result.error?.message || 'Failed to update role');
        return false;
      }
    } catch {
      notifications.error('Failed to update role');
      return false;
    }
  }

  async function removeMember(memberId: string): Promise<boolean> {
    if (!currentTeam.value) return false;

    const notifications = useNotificationStore();

    try {
      const result = await teamService.removeMember(currentTeam.value.id, memberId);
      if (result.success) {
        members.value = members.value.filter((m) => m.id !== memberId);
        notifications.success('Member removed from team');
        return true;
      } else {
        notifications.error(result.error?.message || 'Failed to remove member');
        return false;
      }
    } catch {
      notifications.error('Failed to remove member');
      return false;
    }
  }

  async function leaveTeam(teamId: string): Promise<boolean> {
    const notifications = useNotificationStore();

    try {
      const result = await teamService.leaveTeam(teamId);
      if (result.success) {
        teams.value = teams.value.filter((t) => t.id !== teamId);
        if (currentTeam.value?.id === teamId) {
          currentTeam.value = teams.value[0] || null;
          if (currentTeam.value) {
            await fetchMembers(currentTeam.value.id);
          } else {
            members.value = [];
          }
        }
        notifications.success('You have left the team');
        return true;
      } else {
        notifications.error(result.error?.message || 'Failed to leave team');
        return false;
      }
    } catch {
      notifications.error('Failed to leave team');
      return false;
    }
  }

  function clearTeams() {
    teams.value = [];
    currentTeam.value = null;
    members.value = [];
    error.value = null;
  }

  return {
    // State
    teams,
    currentTeam,
    members,
    loading,
    membersLoading,
    error,

    // Getters
    hasTeams,
    ownedTeams,
    memberTeams,
    currentTeamMembers,
    isOwner,
    isAdmin,

    // Actions
    fetchTeams,
    selectTeam,
    fetchMembers,
    createTeam,
    updateTeam,
    deleteTeam,
    inviteMember,
    updateMemberRole,
    removeMember,
    leaveTeam,
    clearTeams,
  };
});
