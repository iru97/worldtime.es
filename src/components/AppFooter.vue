<template>
  <footer class="bg-[var(--card-bg)] py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid md:grid-cols-3 gap-8">
        <div>
          <div class="flex items-center gap-2 mb-4">
            <Clock class="w-6 h-6 text-[var(--accent-primary)]" />
            <span class="text-xl font-bold text-[var(--text-primary)]">{{ t('app.title') }}</span>
          </div>
          <p class="text-[var(--text-secondary)]">
            {{ t('app.description') }}
          </p>
        </div>
        <div>
          <h3 class="font-semibold text-[var(--text-primary)] mb-4">{{ t('footer.resources') }}</h3>
          <ul class="space-y-2">
            <li>
              <RouterLink to="/support" class="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                {{ t('footer.support') }}
              </RouterLink>
            </li>
          </ul>
        </div>
        <div>
          <h3 class="font-semibold text-[var(--text-primary)] mb-4">{{ t('footer.legal') }}</h3>
          <ul class="space-y-2">
            <li>
              <RouterLink to="/privacy" class="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                {{ t('footer.privacy') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/terms" class="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                {{ t('footer.terms') }}
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>
      <div class="mt-12 pt-8 border-t border-[var(--card-border)] text-center">
        <p class="text-[var(--text-secondary)] mb-2">
          {{ t('footer.copyright') }}
        </p>
        <p class="text-[var(--text-secondary)]">
          {{ t('footer.creator') }}
          <a 
            href="https://linkedin.com/in/iru-hernandez" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] transition-colors font-medium inline-flex items-center gap-1"
          >
            Iru Hernandez
            <Linkedin class="w-4 h-4" />
          </a>
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { Clock, Linkedin } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>