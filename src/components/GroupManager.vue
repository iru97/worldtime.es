<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="emit('close')">
    <div class="card max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="p-6 border-b border-[var(--card-border)]">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-[var(--accent-bg)] flex items-center justify-center">
              <FolderOpen class="w-5 h-5 text-[var(--accent-primary)]" aria-hidden="true" />
            </div>
            <div>
              <h2 class="text-xl font-semibold text-[var(--text-primary)]">{{ $t('groups.title') }}</h2>
              <p class="text-sm text-[var(--text-secondary)]">{{ $t('groups.description') }}</p>
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
        <!-- Add new group -->
        <form @submit.prevent="handleAddGroup" class="flex gap-2">
          <div class="flex-1 relative">
            <input
              v-model="newGroupName"
              type="text"
              :placeholder="$t('groups.newGroupPlaceholder')"
              class="w-full px-4 py-2 pl-10 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
            />
            <div
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
              :style="{ backgroundColor: newGroupColor }"
            />
          </div>
          <button type="button" @click="cycleColor" class="p-2 border border-[var(--card-border)] rounded-lg hover:bg-[var(--accent-bg)] transition-colors" :aria-label="$t('groups.changeColor')">
            <Palette class="w-5 h-5 text-[var(--text-secondary)]" aria-hidden="true" />
          </button>
          <button
            type="submit"
            :disabled="!newGroupName.trim() || isAdding"
            class="btn btn-primary flex items-center gap-2"
          >
            <Plus v-if="!isAdding" class="w-5 h-5" aria-hidden="true" />
            <Loader2 v-else class="w-5 h-5 animate-spin" aria-hidden="true" />
            {{ $t('groups.add') }}
          </button>
        </form>

        <!-- Groups list -->
        <div class="space-y-2">
          <div v-if="groupsStore.loading" class="flex items-center justify-center py-8">
            <Loader2 class="w-6 h-6 animate-spin text-[var(--accent-primary)]" aria-hidden="true" />
          </div>

          <div v-else-if="groupsStore.groups.length === 0" class="text-center py-8">
            <FolderOpen class="w-12 h-12 mx-auto text-[var(--text-secondary)] mb-3" aria-hidden="true" />
            <p class="text-[var(--text-secondary)]">{{ $t('groups.empty') }}</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="group in groupsStore.groups"
              :key="group.id"
              class="flex items-center gap-3 p-3 border border-[var(--card-border)] rounded-lg hover:bg-[var(--accent-bg)] transition-colors"
            >
              <div class="w-4 h-4 rounded-full flex-shrink-0" :style="{ backgroundColor: group.color || '#3B82F6' }" />

              <!-- Edit mode -->
              <template v-if="editingGroupId === group.id">
                <input
                  v-model="editGroupName"
                  type="text"
                  class="flex-1 px-2 py-1 border border-[var(--card-border)] rounded bg-[var(--card-bg)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
                  @keyup.enter="handleSaveEdit"
                  @keyup.escape="cancelEdit"
                />
                <button @click="handleSaveEdit" class="p-1 text-green-500 hover:text-green-600" :aria-label="$t('common.save')">
                  <Check class="w-4 h-4" aria-hidden="true" />
                </button>
                <button @click="cancelEdit" class="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" :aria-label="$t('common.cancel')">
                  <X class="w-4 h-4" aria-hidden="true" />
                </button>
              </template>

              <!-- View mode -->
              <template v-else>
                <span class="flex-1 text-[var(--text-primary)]">{{ group.name }}</span>
                <span class="text-sm text-[var(--text-secondary)]">
                  {{ getContactCount(group.id) }} {{ $t('groups.contacts') }}
                </span>
                <button @click="startEdit(group)" class="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" :aria-label="$t('common.edit')">
                  <Pencil class="w-4 h-4" aria-hidden="true" />
                </button>
                <button @click="handleDeleteGroup(group.id)" class="p-1 text-[var(--text-secondary)] hover:text-red-500" :aria-label="$t('common.delete')">
                  <Trash2 class="w-4 h-4" aria-hidden="true" />
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { FolderOpen, X, Plus, Pencil, Trash2, Loader2, Palette, Check } from 'lucide-vue-next';
import { useGroupsStore } from '@/stores/groups';
import { useContactsStore } from '@/stores/contacts';
import type { ContactGroup } from '@/types';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const groupsStore = useGroupsStore();
const contactsStore = useContactsStore();

const newGroupName = ref('');
const newGroupColor = ref(groupsStore.getNextColor());
const isAdding = ref(false);
const editingGroupId = ref<string | null>(null);
const editGroupName = ref('');

let colorIndex = 0;

function cycleColor() {
  colorIndex = (colorIndex + 1) % groupsStore.GROUP_COLORS.length;
  newGroupColor.value = groupsStore.GROUP_COLORS[colorIndex];
}

function getContactCount(groupId: string): number {
  return contactsStore.contacts.filter((c) => c.group_id === groupId).length;
}

async function handleAddGroup() {
  if (!newGroupName.value.trim()) return;

  isAdding.value = true;
  const result = await groupsStore.addGroup(newGroupName.value.trim(), newGroupColor.value);
  if (result.success) {
    newGroupName.value = '';
    newGroupColor.value = groupsStore.getNextColor();
  }
  isAdding.value = false;
}

function startEdit(group: ContactGroup) {
  editingGroupId.value = group.id;
  editGroupName.value = group.name;
}

function cancelEdit() {
  editingGroupId.value = null;
  editGroupName.value = '';
}

async function handleSaveEdit() {
  if (!editingGroupId.value || !editGroupName.value.trim()) return;

  await groupsStore.updateGroup(editingGroupId.value, { name: editGroupName.value.trim() });
  cancelEdit();
}

async function handleDeleteGroup(id: string) {
  if (confirm('Are you sure you want to delete this group? Contacts in this group will not be deleted.')) {
    await groupsStore.deleteGroup(id);
  }
}

onMounted(() => {
  if (groupsStore.groups.length === 0) {
    groupsStore.fetchGroups();
  }
});
</script>
