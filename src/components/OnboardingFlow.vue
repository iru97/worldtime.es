<template>
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div class="card max-w-lg w-full overflow-hidden">
      <!-- Progress indicator -->
      <div class="flex gap-1 p-4 bg-[var(--accent-bg)]">
        <div
          v-for="(_, index) in steps"
          :key="index"
          class="h-1 flex-1 rounded-full transition-colors"
          :class="index <= currentStep ? 'bg-[var(--accent-primary)]' : 'bg-[var(--card-border)]'"
        />
      </div>

      <!-- Step content -->
      <div class="p-8">
        <!-- Step 1: Welcome -->
        <div v-if="currentStep === 0" class="text-center">
          <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--accent-bg)] flex items-center justify-center">
            <Globe2 class="w-10 h-10 text-[var(--accent-primary)]" aria-hidden="true" />
          </div>
          <h2 class="text-2xl font-bold text-[var(--text-primary)] mb-3">
            {{ $t('onboarding.welcome.title') }}
          </h2>
          <p class="text-[var(--text-secondary)] mb-6">
            {{ $t('onboarding.welcome.description') }}
          </p>
        </div>

        <!-- Step 2: Add contacts -->
        <div v-else-if="currentStep === 1" class="text-center">
          <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--accent-bg)] flex items-center justify-center">
            <UserPlus class="w-10 h-10 text-[var(--accent-primary)]" aria-hidden="true" />
          </div>
          <h2 class="text-2xl font-bold text-[var(--text-primary)] mb-3">
            {{ $t('onboarding.contacts.title') }}
          </h2>
          <p class="text-[var(--text-secondary)] mb-6">
            {{ $t('onboarding.contacts.description') }}
          </p>
        </div>

        <!-- Step 3: Meeting finder -->
        <div v-else-if="currentStep === 2" class="text-center">
          <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--accent-bg)] flex items-center justify-center">
            <CalendarClock class="w-10 h-10 text-[var(--accent-primary)]" aria-hidden="true" />
          </div>
          <h2 class="text-2xl font-bold text-[var(--text-primary)] mb-3">
            {{ $t('onboarding.meetings.title') }}
          </h2>
          <p class="text-[var(--text-secondary)] mb-6">
            {{ $t('onboarding.meetings.description') }}
          </p>
        </div>

        <!-- Step 4: Keyboard shortcuts -->
        <div v-else-if="currentStep === 3" class="text-center">
          <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--accent-bg)] flex items-center justify-center">
            <Keyboard class="w-10 h-10 text-[var(--accent-primary)]" aria-hidden="true" />
          </div>
          <h2 class="text-2xl font-bold text-[var(--text-primary)] mb-3">
            {{ $t('onboarding.shortcuts.title') }}
          </h2>
          <p class="text-[var(--text-secondary)] mb-4">
            {{ $t('onboarding.shortcuts.description') }}
          </p>
          <div class="grid grid-cols-2 gap-2 text-left text-sm">
            <div class="flex items-center gap-2 p-2 bg-[var(--accent-bg)] rounded">
              <kbd class="px-2 py-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded text-xs">Ctrl+N</kbd>
              <span class="text-[var(--text-secondary)]">{{ $t('onboarding.shortcuts.newContact') }}</span>
            </div>
            <div class="flex items-center gap-2 p-2 bg-[var(--accent-bg)] rounded">
              <kbd class="px-2 py-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded text-xs">Ctrl+M</kbd>
              <span class="text-[var(--text-secondary)]">{{ $t('onboarding.shortcuts.meetingFinder') }}</span>
            </div>
            <div class="flex items-center gap-2 p-2 bg-[var(--accent-bg)] rounded">
              <kbd class="px-2 py-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded text-xs">Ctrl+F</kbd>
              <span class="text-[var(--text-secondary)]">{{ $t('onboarding.shortcuts.search') }}</span>
            </div>
            <div class="flex items-center gap-2 p-2 bg-[var(--accent-bg)] rounded">
              <kbd class="px-2 py-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded text-xs">/</kbd>
              <span class="text-[var(--text-secondary)]">{{ $t('onboarding.shortcuts.showAll') }}</span>
            </div>
          </div>
        </div>

        <!-- Step 5: Ready -->
        <div v-else class="text-center">
          <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <CheckCircle2 class="w-10 h-10 text-green-600 dark:text-green-400" aria-hidden="true" />
          </div>
          <h2 class="text-2xl font-bold text-[var(--text-primary)] mb-3">
            {{ $t('onboarding.ready.title') }}
          </h2>
          <p class="text-[var(--text-secondary)] mb-6">
            {{ $t('onboarding.ready.description') }}
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="p-6 border-t border-[var(--card-border)] flex justify-between items-center">
        <button
          v-if="currentStep > 0"
          @click="currentStep--"
          class="btn btn-secondary"
        >
          {{ $t('onboarding.back') }}
        </button>
        <div v-else />

        <div class="flex gap-3">
          <button
            v-if="currentStep < steps.length - 1"
            @click="handleSkip"
            class="btn btn-secondary"
          >
            {{ $t('onboarding.skip') }}
          </button>
          <button
            @click="handleNext"
            class="btn btn-primary"
          >
            {{ currentStep === steps.length - 1 ? $t('onboarding.getStarted') : $t('onboarding.next') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Globe2, UserPlus, CalendarClock, Keyboard, CheckCircle2 } from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'complete'): void;
}>();

const steps = ['welcome', 'contacts', 'meetings', 'shortcuts', 'ready'];
const currentStep = ref(0);

function handleNext() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
  } else {
    completeOnboarding();
  }
}

function handleSkip() {
  completeOnboarding();
}

function completeOnboarding() {
  try {
    localStorage.setItem('onboardingCompleted', 'true');
  } catch {
    // Ignore localStorage errors
  }
  emit('complete');
}
</script>
