<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="emit('close')">
    <div class="card max-w-lg w-full max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between p-6 border-b border-[var(--card-border)]">
        <h2 class="text-xl font-semibold text-[var(--text-primary)]">
          {{ props.link ? $t('scheduling.editLink') : $t('scheduling.createLink') }}
        </h2>
        <button @click="emit('close')" class="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <X class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Title -->
        <div>
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {{ $t('scheduling.linkTitle') }} *
          </label>
          <input
            v-model="form.title"
            type="text"
            required
            class="input"
            :placeholder="$t('scheduling.linkTitlePlaceholder')"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {{ $t('scheduling.linkDescription') }}
          </label>
          <textarea
            v-model="form.description"
            rows="2"
            class="input"
            :placeholder="$t('scheduling.linkDescriptionPlaceholder')"
          />
        </div>

        <!-- Duration -->
        <div>
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {{ $t('scheduling.duration') }} *
          </label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="duration in [15, 30, 45, 60]"
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

        <!-- Location -->
        <div>
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {{ $t('scheduling.locationType') }}
          </label>
          <select v-model="form.location_type" class="input">
            <option value="video">{{ $t('scheduling.videoCall') }}</option>
            <option value="phone">{{ $t('scheduling.phoneCall') }}</option>
            <option value="in_person">{{ $t('scheduling.inPerson') }}</option>
            <option value="custom">{{ $t('scheduling.custom') }}</option>
          </select>
          <input
            v-if="form.location_type === 'custom' || form.location_type === 'in_person'"
            v-model="form.location_value"
            type="text"
            class="input mt-2"
            :placeholder="$t('scheduling.locationPlaceholder')"
          />
        </div>

        <!-- Buffers -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              {{ $t('scheduling.bufferBefore') }}
            </label>
            <select v-model="form.buffer_before_minutes" class="input">
              <option :value="0">{{ $t('scheduling.noBuffer') }}</option>
              <option :value="5">5 {{ $t('scheduling.min') }}</option>
              <option :value="10">10 {{ $t('scheduling.min') }}</option>
              <option :value="15">15 {{ $t('scheduling.min') }}</option>
              <option :value="30">30 {{ $t('scheduling.min') }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              {{ $t('scheduling.bufferAfter') }}
            </label>
            <select v-model="form.buffer_after_minutes" class="input">
              <option :value="0">{{ $t('scheduling.noBuffer') }}</option>
              <option :value="5">5 {{ $t('scheduling.min') }}</option>
              <option :value="10">10 {{ $t('scheduling.min') }}</option>
              <option :value="15">15 {{ $t('scheduling.min') }}</option>
              <option :value="30">30 {{ $t('scheduling.min') }}</option>
            </select>
          </div>
        </div>

        <!-- Scheduling Limits -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              {{ $t('scheduling.minNotice') }}
            </label>
            <select v-model="form.min_notice_hours" class="input">
              <option :value="1">1 {{ $t('scheduling.hour') }}</option>
              <option :value="4">4 {{ $t('scheduling.hours') }}</option>
              <option :value="24">1 {{ $t('scheduling.day') }}</option>
              <option :value="48">2 {{ $t('scheduling.days') }}</option>
              <option :value="168">1 {{ $t('scheduling.week') }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              {{ $t('scheduling.maxDaysAhead') }}
            </label>
            <select v-model="form.max_days_ahead" class="input">
              <option :value="7">1 {{ $t('scheduling.week') }}</option>
              <option :value="14">2 {{ $t('scheduling.weeks') }}</option>
              <option :value="30">1 {{ $t('scheduling.month') }}</option>
              <option :value="60">2 {{ $t('scheduling.months') }}</option>
              <option :value="90">3 {{ $t('scheduling.months') }}</option>
            </select>
          </div>
        </div>

        <!-- Color -->
        <div>
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {{ $t('scheduling.color') }}
          </label>
          <div class="flex gap-2">
            <button
              v-for="color in colors"
              :key="color"
              type="button"
              @click="form.color = color"
              class="w-8 h-8 rounded-full transition-transform"
              :class="form.color === color ? 'ring-2 ring-offset-2 ring-[var(--accent-primary)] scale-110' : ''"
              :style="{ backgroundColor: color }"
            />
          </div>
        </div>

        <!-- Active Status -->
        <div class="flex items-center gap-3">
          <input
            id="is_active"
            v-model="form.is_active"
            type="checkbox"
            class="w-4 h-4 text-[var(--accent-primary)] rounded"
          />
          <label for="is_active" class="text-sm text-[var(--text-secondary)]">
            {{ $t('scheduling.linkActive') }}
          </label>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t border-[var(--card-border)]">
          <button type="button" @click="emit('close')" class="btn btn-secondary">
            {{ $t('common.cancel') }}
          </button>
          <button type="submit" :disabled="saving" class="btn btn-primary flex items-center gap-2">
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
            {{ props.link ? $t('common.save') : $t('common.add') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { X, Loader2 } from 'lucide-vue-next';
import { useBookingsStore } from '@/stores/bookings';
import type { BookingLink } from '@/types';

const props = defineProps<{
  link?: BookingLink | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const bookingsStore = useBookingsStore();
const saving = ref(false);

const colors = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#06B6D4', '#6366F1',
];

const form = reactive({
  title: props.link?.title || '',
  description: props.link?.description || '',
  duration_minutes: props.link?.duration_minutes || 30,
  location_type: props.link?.location_type || 'video',
  location_value: props.link?.location_value || '',
  buffer_before_minutes: props.link?.buffer_before_minutes || 0,
  buffer_after_minutes: props.link?.buffer_after_minutes || 0,
  min_notice_hours: props.link?.min_notice_hours || 24,
  max_days_ahead: props.link?.max_days_ahead || 60,
  color: props.link?.color || '#3B82F6',
  is_active: props.link?.is_active ?? true,
});

async function handleSubmit() {
  saving.value = true;

  let result;
  if (props.link) {
    result = await bookingsStore.updateBookingLink(props.link.id, form);
  } else {
    result = await bookingsStore.createBookingLink(form);
  }

  saving.value = false;

  if (result.success) {
    emit('saved');
  }
}
</script>
