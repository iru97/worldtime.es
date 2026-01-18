<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="emit('close')">
    <div class="card max-w-md w-full p-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <FileText class="w-6 h-6 text-[var(--accent-primary)]" aria-hidden="true" />
          <h2 class="text-xl font-semibold text-[var(--text-primary)]">
            {{ mode === 'import' ? $t('import.title') : $t('export.title') }}
          </h2>
        </div>
        <button
          @click="emit('close')"
          class="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          :aria-label="$t('common.cancel')"
        >
          <X class="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <!-- Export Mode -->
      <div v-if="mode === 'export'" class="space-y-4">
        <p class="text-[var(--text-secondary)]">{{ $t('export.description') }}</p>
        <div class="grid grid-cols-2 gap-3">
          <button
            @click="handleExport('json')"
            class="btn btn-secondary flex items-center justify-center gap-2"
          >
            <FileJson class="w-5 h-5" aria-hidden="true" />
            {{ $t('export.json') }}
          </button>
          <button
            @click="handleExport('csv')"
            class="btn btn-secondary flex items-center justify-center gap-2"
          >
            <FileSpreadsheet class="w-5 h-5" aria-hidden="true" />
            {{ $t('export.csv') }}
          </button>
        </div>
      </div>

      <!-- Import Mode -->
      <div v-else class="space-y-4">
        <p class="text-[var(--text-secondary)]">{{ $t('import.description') }}</p>

        <div
          class="border-2 border-dashed border-[var(--card-border)] rounded-lg p-8 text-center"
          :class="{ 'border-[var(--accent-primary)] bg-[var(--accent-bg)]': isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".json,.csv"
            class="hidden"
            @change="handleFileSelect"
          />
          <Upload class="w-10 h-10 mx-auto text-[var(--text-tertiary)] mb-3" aria-hidden="true" />
          <p class="text-[var(--text-secondary)] mb-2">Drag and drop a file here, or</p>
          <button @click="fileInput?.click()" class="btn btn-primary">
            {{ $t('import.selectFile') }}
          </button>
          <p class="text-sm text-[var(--text-tertiary)] mt-2">Supports JSON and CSV files</p>
        </div>

        <!-- Import Progress -->
        <div v-if="importing" class="flex items-center gap-3 p-4 bg-[var(--accent-bg)] rounded-lg">
          <Loader2 class="w-5 h-5 animate-spin text-[var(--accent-primary)]" aria-hidden="true" />
          <span class="text-[var(--text-primary)]">Importing contacts...</span>
        </div>

        <!-- Import Results -->
        <div v-if="importResult" class="space-y-3">
          <div
            v-if="importResult.imported > 0"
            class="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg"
          >
            <CheckCircle class="w-5 h-5" aria-hidden="true" />
            <span>Imported {{ importResult.imported }} contacts successfully</span>
          </div>
          <div
            v-if="importResult.errors.length > 0"
            class="p-3 bg-[var(--danger-bg)] text-[var(--danger)] rounded-lg"
          >
            <div class="flex items-center gap-2 mb-2">
              <AlertCircle class="w-5 h-5" aria-hidden="true" />
              <span>{{ importResult.errors.length }} error(s) occurred</span>
            </div>
            <ul class="text-sm list-disc list-inside">
              <li v-for="(error, index) in importResult.errors.slice(0, 5)" :key="index">
                {{ error }}
              </li>
              <li v-if="importResult.errors.length > 5">
                ...and {{ importResult.errors.length - 5 }} more
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { FileText, X, FileJson, FileSpreadsheet, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-vue-next';
import { importExportService, type ImportResult } from '@/services/ImportExportService';
import { useContactsStore } from '@/stores/contacts';
import { useNotificationStore } from '@/stores/notifications';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  mode: 'import' | 'export';
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'imported'): void;
}>();

const { t } = useI18n();
const contactsStore = useContactsStore();
const notificationStore = useNotificationStore();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const importing = ref(false);
const importResult = ref<ImportResult | null>(null);

function handleExport(format: 'json' | 'csv') {
  importExportService.exportContacts(contactsStore.contacts, format);
  notificationStore.add('success', t('export.success'));
  emit('close');
}

async function handleDrop(event: DragEvent) {
  isDragging.value = false;
  const file = event.dataTransfer?.files[0];
  if (file) {
    await processFile(file);
  }
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    await processFile(file);
  }
}

async function processFile(file: File) {
  importing.value = true;
  importResult.value = null;

  try {
    const content = await importExportService.readFile(file);
    const format = file.name.endsWith('.json') ? 'json' : 'csv';

    const result = await importExportService.importContacts(content, format, async (contact) => {
      return await contactsStore.addContact(contact);
    });

    importResult.value = result;

    if (result.imported > 0) {
      notificationStore.add('success', t('import.success'));
      emit('imported');
    }
  } catch (error) {
    notificationStore.add('error', t('import.error'));
  } finally {
    importing.value = false;
  }
}
</script>
