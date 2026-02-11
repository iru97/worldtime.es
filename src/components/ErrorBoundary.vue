<template>
  <div v-if="error" class="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
    <div class="card max-w-md w-full p-8 text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--danger-bg)] flex items-center justify-center">
        <AlertTriangle class="w-8 h-8 text-[var(--danger)]" aria-hidden="true" />
      </div>
      <h1 class="text-xl font-semibold text-[var(--text-primary)] mb-2">
        {{ $t('error.title') }}
      </h1>
      <p class="text-[var(--text-secondary)] mb-6">
        {{ $t('error.description') }}
      </p>
      <div class="space-y-3">
        <button
          @click="handleRetry"
          class="btn btn-primary w-full flex items-center justify-center gap-2"
        >
          <RefreshCw class="w-5 h-5" aria-hidden="true" />
          {{ $t('error.retry') }}
        </button>
        <button
          @click="handleGoHome"
          class="btn btn-secondary w-full flex items-center justify-center gap-2"
        >
          <Home class="w-5 h-5" aria-hidden="true" />
          {{ $t('error.goHome') }}
        </button>
      </div>
      <details v-if="isDev" class="mt-6 text-left">
        <summary class="text-sm text-[var(--text-tertiary)] cursor-pointer">
          Technical details
        </summary>
        <pre class="mt-2 p-3 bg-[var(--bg-secondary)] rounded-lg text-xs overflow-auto text-[var(--text-secondary)]">{{ errorDetails }}</pre>
      </details>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, computed } from 'vue';
import { useRouter } from 'vue-router';
import { AlertTriangle, RefreshCw, Home } from 'lucide-vue-next';
import { logger } from '@/services/LoggingService';

const router = useRouter();
const error = ref<Error | null>(null);
const errorInfo = ref<string>('');

const isDev = computed(() => import.meta.env.DEV);

const errorDetails = computed(() => {
  if (!error.value) return '';
  return `Error: ${error.value.message}\n\nStack: ${error.value.stack || 'No stack trace'}\n\nInfo: ${errorInfo.value}`;
});

onErrorCaptured((err, instance, info) => {
  error.value = err as Error;
  errorInfo.value = info;

  // Log the error
  logger.error('Vue Error Boundary caught error', {
    error: err,
    component: instance?.$options?.name || 'Unknown',
    info,
  });

  // Prevent error from propagating
  return false;
});

function handleRetry() {
  error.value = null;
  errorInfo.value = '';
  window.location.reload();
}

function handleGoHome() {
  error.value = null;
  errorInfo.value = '';
  router.push('/');
}
</script>
