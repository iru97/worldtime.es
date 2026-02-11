<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="emit('close')">
    <div class="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between p-6 border-b border-[var(--card-border)]">
        <h2 class="text-xl font-semibold text-[var(--text-primary)]">
          {{ $t('scheduling.createPoll') }}
        </h2>
        <button @click="emit('close')" class="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <X class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Title -->
        <div>
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {{ $t('scheduling.pollTitle') }} *
          </label>
          <input
            v-model="form.title"
            type="text"
            required
            class="input"
            :placeholder="$t('scheduling.pollTitlePlaceholder')"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {{ $t('scheduling.pollDescription') }}
          </label>
          <textarea
            v-model="form.description"
            rows="2"
            class="input"
            :placeholder="$t('scheduling.pollDescriptionPlaceholder')"
          />
        </div>

        <!-- Location -->
        <div>
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {{ $t('scheduling.location') }}
          </label>
          <input
            v-model="form.location"
            type="text"
            class="input"
            :placeholder="$t('scheduling.locationPlaceholder')"
          />
        </div>

        <!-- Duration -->
        <div>
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {{ $t('scheduling.meetingDuration') }}
          </label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="duration in [30, 60, 90, 120]"
              :key="duration"
              type="button"
              @click="form.duration_minutes = duration"
              class="py-2 px-4 rounded-lg border transition-colors"
              :class="
                form.duration_minutes === duration
                  ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                  : 'border-[var(--card-border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]'
              "
            >
              {{ duration }} {{ $t('scheduling.min') }}
            </button>
          </div>
        </div>

        <!-- Time Options -->
        <div>
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            {{ $t('scheduling.timeOptions') }} *
          </label>

          <div class="space-y-3">
            <div
              v-for="(option, index) in form.options"
              :key="index"
              class="flex items-center gap-3"
            >
              <input
                v-model="option.date"
                type="date"
                required
                class="input flex-1"
              />
              <input
                v-model="option.time"
                type="time"
                required
                class="input w-32"
              />
              <button
                v-if="form.options.length > 1"
                type="button"
                @click="removeOption(index)"
                class="p-2 text-red-500 hover:text-red-600"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            type="button"
            @click="addOption"
            class="mt-3 text-sm text-[var(--accent-primary)] hover:underline flex items-center gap-1"
          >
            <Plus class="w-4 h-4" />
            {{ $t('scheduling.addTimeOption') }}
          </button>
        </div>

        <!-- Settings -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-[var(--text-secondary)]">
            {{ $t('scheduling.pollSettings') }}
          </label>

          <div class="flex items-center gap-3">
            <input
              id="allow_maybe"
              v-model="form.allow_maybe"
              type="checkbox"
              class="w-4 h-4 text-[var(--accent-primary)] rounded"
            />
            <label for="allow_maybe" class="text-sm text-[var(--text-secondary)]">
              {{ $t('scheduling.allowMaybe') }}
            </label>
          </div>

          <div class="flex items-center gap-3">
            <input
              id="allow_comments"
              v-model="form.allow_comments"
              type="checkbox"
              class="w-4 h-4 text-[var(--accent-primary)] rounded"
            />
            <label for="allow_comments" class="text-sm text-[var(--text-secondary)]">
              {{ $t('scheduling.allowComments') }}
            </label>
          </div>

          <div class="flex items-center gap-3">
            <input
              id="is_anonymous"
              v-model="form.is_anonymous"
              type="checkbox"
              class="w-4 h-4 text-[var(--accent-primary)] rounded"
            />
            <label for="is_anonymous" class="text-sm text-[var(--text-secondary)]">
              {{ $t('scheduling.anonymousPoll') }}
            </label>
          </div>
        </div>

        <!-- Deadline -->
        <div>
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {{ $t('scheduling.deadline') }}
          </label>
          <input
            v-model="form.deadline"
            type="datetime-local"
            class="input"
          />
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t border-[var(--card-border)]">
          <button type="button" @click="emit('close')" class="btn btn-secondary">
            {{ $t('common.cancel') }}
          </button>
          <button
            type="submit"
            :disabled="saving || form.options.length === 0"
            class="btn btn-primary flex items-center gap-2"
          >
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
            {{ $t('scheduling.createPoll') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { X, Loader2, Trash2, Plus } from 'lucide-vue-next';
import { usePollsStore } from '@/stores/polls';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const pollsStore = usePollsStore();
const saving = ref(false);

// Initialize with tomorrow's date
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

const form = reactive({
  title: '',
  description: '',
  location: '',
  duration_minutes: 60,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  deadline: '',
  is_anonymous: false,
  allow_comments: true,
  allow_maybe: true,
  options: [
    { date: tomorrowStr, time: '09:00' },
    { date: tomorrowStr, time: '14:00' },
  ],
});

function addOption() {
  const lastOption = form.options[form.options.length - 1];
  form.options.push({
    date: lastOption?.date || tomorrowStr,
    time: '10:00',
  });
}

function removeOption(index: number) {
  form.options.splice(index, 1);
}

async function handleSubmit() {
  if (form.options.length === 0) return;

  saving.value = true;

  // Convert options to proper format
  const options = form.options.map((opt) => {
    const startDate = new Date(`${opt.date}T${opt.time}`);
    const endDate = new Date(startDate.getTime() + form.duration_minutes * 60 * 1000);
    return {
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
    };
  });

  const result = await pollsStore.createPoll({
    ...form,
    deadline: form.deadline || undefined,
    options,
  });

  saving.value = false;

  if (result.success) {
    emit('saved');
  }
}
</script>
