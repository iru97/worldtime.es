<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <router-link
              to="/home"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft class="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </router-link>
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ t('teams.title') }}
              </h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ t('teams.subtitle') }}
              </p>
            </div>
          </div>
          <button
            @click="showCreateModal = true"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus class="w-5 h-5" />
            <span class="hidden sm:inline">{{ t('teams.createTeam') }}</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-blue-600" />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!hasTeams"
        class="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
      >
        <Users class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ t('teams.noTeams') }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ t('teams.noTeamsDescription') }}
        </p>
        <button
          @click="showCreateModal = true"
          class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus class="w-5 h-5" />
          {{ t('teams.createFirstTeam') }}
        </button>
      </div>

      <!-- Teams Grid -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Teams List -->
        <div class="lg:col-span-1 space-y-4">
          <h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {{ t('teams.yourTeams') }}
          </h2>
          <div class="space-y-2">
            <button
              v-for="team in teams"
              :key="team.id"
              @click="selectTeam(team.id)"
              class="w-full flex items-center gap-3 p-4 rounded-lg text-left transition-colors"
              :class="
                currentTeam?.id === team.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
              "
            >
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-bold"
                :style="{ backgroundColor: getTeamColor(team.name) }"
              >
                {{ team.name.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 dark:text-white truncate">
                  {{ team.name }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ getMemberCount(team.id) }} {{ t('teams.members') }}
                </p>
              </div>
              <ChevronRight class="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <!-- Team Details -->
        <div v-if="currentTeam" class="lg:col-span-2 space-y-6">
          <!-- Team Info Card -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div class="flex items-start justify-between mb-6">
              <div class="flex items-center gap-4">
                <div
                  class="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
                  :style="{ backgroundColor: getTeamColor(currentTeam.name) }"
                >
                  {{ currentTeam.name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                    {{ currentTeam.name }}
                  </h2>
                  <p class="text-gray-500 dark:text-gray-400">
                    {{ currentTeam.description || t('teams.noDescription') }}
                  </p>
                </div>
              </div>
              <div v-if="isOwner" class="flex items-center gap-2">
                <button
                  @click="showEditModal = true"
                  class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  :aria-label="t('common.edit')"
                >
                  <Settings class="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  @click="confirmDeleteTeam"
                  class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  :aria-label="t('common.delete')"
                >
                  <Trash2 class="w-5 h-5 text-red-500" />
                </button>
              </div>
            </div>

            <!-- Team Stats -->
            <div class="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div class="text-center">
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ members.length }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('teams.members') }}</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ getTimezoneCount() }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('teams.timezones') }}</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ getAdminCount() }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('teams.admins') }}</p>
              </div>
            </div>
          </div>

          <!-- Members Section -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ t('teams.members') }}
              </h3>
              <button
                v-if="isAdmin"
                @click="showInviteModal = true"
                class="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <UserPlus class="w-4 h-4" />
                {{ t('teams.inviteMember') }}
              </button>
            </div>

            <!-- Members Loading -->
            <div v-if="membersLoading" class="flex justify-center py-8">
              <Loader2 class="w-6 h-6 animate-spin text-blue-600" />
            </div>

            <!-- Members List -->
            <div v-else class="space-y-3">
              <div
                v-for="member in members"
                :key="member.id"
                class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    <User class="w-5 h-5" />
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ member.invited_email || 'Team Member' }}
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ getRoleBadge(member.role) }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="getRoleBadgeClass(member.role)"
                  >
                    {{ member.role }}
                  </span>
                  <div v-if="isOwner && member.role !== 'owner'" class="relative">
                    <button
                      @click="toggleMemberMenu(member.id)"
                      class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      <MoreVertical class="w-4 h-4 text-gray-500" />
                    </button>
                    <div
                      v-if="openMemberMenu === member.id"
                      class="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10"
                    >
                      <button
                        @click="changeMemberRole(member)"
                        class="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {{ member.role === 'admin' ? t('teams.demoteToMember') : t('teams.promoteToAdmin') }}
                      </button>
                      <button
                        @click="confirmRemoveMember(member)"
                        class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        {{ t('teams.removeMember') }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Leave Team -->
          <div
            v-if="!isOwner"
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  {{ t('teams.leaveTeam') }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ t('teams.leaveTeamDescription') }}
                </p>
              </div>
              <button
                @click="confirmLeaveTeam"
                class="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                {{ t('teams.leave') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Create Team Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="showCreateModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {{ t('teams.createTeam') }}
        </h2>
        <form @submit.prevent="handleCreateTeam">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('teams.teamName') }}
              </label>
              <input
                v-model="newTeam.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                :placeholder="t('teams.teamNamePlaceholder')"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('teams.description') }}
              </label>
              <textarea
                v-model="newTeam.description"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                :placeholder="t('teams.descriptionPlaceholder')"
              ></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button
              type="button"
              @click="showCreateModal = false"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="!newTeam.name"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {{ t('teams.create') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Invite Member Modal -->
    <div
      v-if="showInviteModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="showInviteModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {{ t('teams.inviteMember') }}
        </h2>
        <form @submit.prevent="handleInviteMember">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('teams.emailAddress') }}
              </label>
              <input
                v-model="inviteEmail"
                type="email"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                :placeholder="t('teams.emailPlaceholder')"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('teams.role') }}
              </label>
              <select
                v-model="inviteRole"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="member">{{ t('teams.roleMember') }}</option>
                <option value="admin">{{ t('teams.roleAdmin') }}</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button
              type="button"
              @click="showInviteModal = false"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="!inviteEmail"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {{ t('teams.sendInvite') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useTeamsStore } from '@/stores/teams';
import {
  ArrowLeft,
  Plus,
  Users,
  ChevronRight,
  Settings,
  Trash2,
  UserPlus,
  User,
  MoreVertical,
  Loader2,
} from 'lucide-vue-next';
import type { TeamMember } from '@/types';

const { t } = useI18n();
const teamsStore = useTeamsStore();

const {
  teams,
  currentTeam,
  members,
  loading,
  membersLoading,
  hasTeams,
  isOwner,
  isAdmin,
} = storeToRefs(teamsStore);

// Modals
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showInviteModal = ref(false);

// Forms
const newTeam = ref({ name: '', description: '' });
const inviteEmail = ref('');
const inviteRole = ref<'admin' | 'member'>('member');

// Member menu
const openMemberMenu = ref<string | null>(null);

// Actions
const { selectTeam, createTeam, inviteMember, updateMemberRole, removeMember, leaveTeam, deleteTeam } =
  teamsStore;

onMounted(() => {
  teamsStore.fetchTeams();
});

function getTeamColor(name: string): string {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

function getMemberCount(teamId: string): number {
  if (currentTeam.value?.id === teamId) {
    return members.value.length;
  }
  return 0; // Would need to fetch individually
}

function getTimezoneCount(): number {
  // Placeholder - would need user timezone data
  return Math.min(members.value.length, 3);
}

function getAdminCount(): number {
  return members.value.filter((m) => ['owner', 'admin'].includes(m.role)).length;
}

function getRoleBadge(role: string): string {
  switch (role) {
    case 'owner':
      return t('teams.roleOwner');
    case 'admin':
      return t('teams.roleAdmin');
    default:
      return t('teams.roleMember');
  }
}

function getRoleBadgeClass(role: string): string {
  switch (role) {
    case 'owner':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    case 'admin':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}

function toggleMemberMenu(memberId: string) {
  openMemberMenu.value = openMemberMenu.value === memberId ? null : memberId;
}

async function handleCreateTeam() {
  const result = await createTeam(newTeam.value);
  if (result) {
    showCreateModal.value = false;
    newTeam.value = { name: '', description: '' };
  }
}

async function handleInviteMember() {
  const result = await inviteMember(inviteEmail.value, inviteRole.value);
  if (result) {
    showInviteModal.value = false;
    inviteEmail.value = '';
    inviteRole.value = 'member';
  }
}

async function changeMemberRole(member: TeamMember) {
  const newRole = member.role === 'admin' ? 'member' : 'admin';
  await updateMemberRole(member.id, newRole);
  openMemberMenu.value = null;
}

function confirmRemoveMember(member: TeamMember) {
  if (confirm(t('teams.confirmRemoveMember', { name: member.invited_email }))) {
    removeMember(member.id);
  }
  openMemberMenu.value = null;
}

function confirmLeaveTeam() {
  if (currentTeam.value && confirm(t('teams.confirmLeave', { name: currentTeam.value.name }))) {
    leaveTeam(currentTeam.value.id);
  }
}

function confirmDeleteTeam() {
  if (currentTeam.value && confirm(t('teams.confirmDelete', { name: currentTeam.value.name }))) {
    deleteTeam(currentTeam.value.id);
  }
}
</script>
