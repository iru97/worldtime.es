<template>
  <div class="min-h-screen bg-gradient-to-br from-[var(--bg-gradient-from)] to-[var(--bg-gradient-to)]">
    <!-- Navigation -->
    <nav class="absolute top-0 left-0 right-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-2">
            <Clock class="w-6 h-6 text-[var(--accent-primary)]" />
            <span class="text-lg font-bold text-[var(--text-primary)]">{{ t('app.title') }}</span>
          </div>
          <div class="flex items-center gap-4">
            <LanguageSelector />
            <ThemeToggle />
            <RouterLink
              to="/login"
              class="btn btn-primary"
            >
              {{ t('auth.signIn') }}
            </RouterLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24 sm:pt-32 sm:pb-32">
        <div class="text-center">
          <h1 class="text-4xl sm:text-6xl font-bold text-[var(--text-primary)] mb-6">
            {{ t('landing.hero.title') }}
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
              {{ t('landing.hero.highlight') }}
            </span>
          </h1>
          <p class="text-xl sm:text-2xl text-[var(--text-secondary)] mb-12 max-w-3xl mx-auto">
            {{ t('landing.hero.subtitle') }}
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <RouterLink
              to="/login"
              class="btn btn-primary text-lg px-8 py-3"
            >
              {{ t('landing.cta.start') }}
            </RouterLink>
            <a
              href="#demo"
              class="btn btn-secondary text-lg px-8 py-3"
            >
              {{ t('landing.cta.demo') }}
            </a>
          </div>
        </div>
      </div>

      <!-- Floating Time Cards -->
      <div class="hidden lg:block absolute -top-4 left-12 animate-float-1">
        <div class="card p-4 rotate-[-15deg]">
          <h3 class="font-medium text-[var(--text-primary)]">New York</h3>
          <p class="text-2xl font-mono font-bold text-[var(--accent-primary)]">09:00</p>
        </div>
      </div>
      <div class="hidden lg:block absolute top-1/4 right-24 animate-float-2">
        <div class="card p-4 rotate-[10deg]">
          <h3 class="font-medium text-[var(--text-primary)]">London</h3>
          <p class="text-2xl font-mono font-bold text-[var(--accent-primary)]">14:00</p>
        </div>
      </div>
      <div class="hidden lg:block absolute top-1/2 left-24 animate-float-3">
        <div class="card p-4 rotate-[-5deg]">
          <h3 class="font-medium text-[var(--text-primary)]">Tokyo</h3>
          <p class="text-2xl font-mono font-bold text-[var(--accent-primary)]">22:00</p>
        </div>
      </div>
      <div class="hidden lg:block absolute bottom-1/4 right-16 animate-float-4">
        <div class="card p-4 rotate-[15deg]">
          <h3 class="font-medium text-[var(--text-primary)]">Sydney</h3>
          <p class="text-2xl font-mono font-bold text-[var(--accent-primary)]">23:00</p>
        </div>
      </div>
      <div class="hidden lg:block absolute -bottom-8 left-32 animate-float-5">
        <div class="card p-4 rotate-[-8deg]">
          <h3 class="font-medium text-[var(--text-primary)]">Dubai</h3>
          <p class="text-2xl font-mono font-bold text-[var(--accent-primary)]">17:00</p>
        </div>
      </div>
    </header>

    <!-- Use Cases -->
    <section class="py-16 sm:py-24 bg-[var(--card-bg)]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] text-center mb-16">
          {{ t('landing.features.title') }}
        </h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div class="card hover:scale-105 transition-transform">
            <Users2 class="w-12 h-12 text-[var(--accent-primary)] mb-4" />
            <h3 class="text-xl font-semibold text-[var(--text-primary)] mb-2">
              {{ t('landing.features.team.title') }}
            </h3>
            <p class="text-[var(--text-secondary)]">
              {{ t('landing.features.team.description') }}
            </p>
          </div>

          <div class="card hover:scale-105 transition-transform">
            <CalendarClock class="w-12 h-12 text-[var(--accent-primary)] mb-4" />
            <h3 class="text-xl font-semibold text-[var(--text-primary)] mb-2">
              {{ t('landing.features.meetings.title') }}
            </h3>
            <p class="text-[var(--text-secondary)]">
              {{ t('landing.features.meetings.description') }}
            </p>
          </div>

          <div class="card hover:scale-105 transition-transform">
            <Plane class="w-12 h-12 text-[var(--accent-primary)] mb-4" />
            <h3 class="text-xl font-semibold text-[var(--text-primary)] mb-2">
              {{ t('landing.features.travel.title') }}
            </h3>
            <p class="text-[var(--text-secondary)]">
              {{ t('landing.features.travel.description') }}
            </p>
          </div>

          <div class="card hover:scale-105 transition-transform">
            <Clock class="w-12 h-12 text-[var(--accent-primary)] mb-4" />
            <h3 class="text-xl font-semibold text-[var(--text-primary)] mb-2">
              {{ t('landing.features.balance.title') }}
            </h3>
            <p class="text-[var(--text-secondary)]">
              {{ t('landing.features.balance.description') }}
            </p>
          </div>

          <div class="card hover:scale-105 transition-transform">
            <MessageSquare class="w-12 h-12 text-[var(--accent-primary)] mb-4" />
            <h3 class="text-xl font-semibold text-[var(--text-primary)] mb-2">
              {{ t('landing.features.communication.title') }}
            </h3>
            <p class="text-[var(--text-secondary)]">
              {{ t('landing.features.communication.description') }}
            </p>
          </div>

          <div class="card hover:scale-105 transition-transform">
            <Timer class="w-12 h-12 text-[var(--accent-primary)] mb-4" />
            <h3 class="text-xl font-semibold text-[var(--text-primary)] mb-2">
              {{ t('landing.features.deadlines.title') }}
            </h3>
            <p class="text-[var(--text-secondary)]">
              {{ t('landing.features.deadlines.description') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Interactive Demo -->
    <section id="demo" class="py-16 sm:py-24">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] text-center mb-16">
          {{ t('landing.demo.title') }}
        </h2>
        <div class="card p-8">
          <Timeline
            :selected-date="selectedDate"
            @update="handleTimelineUpdate"
          />
          <div class="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <PersonCard
              v-for="person in demoTeam"
              :key="person.id"
              :name="person.name"
              :timezone="person.timezone"
              :time="formatTime(selectedDate, person.timezone)"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-16 sm:py-24">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-6">
          {{ t('landing.cta.start') }}
        </h2>
        <p class="text-xl text-[var(--text-secondary)] mb-12 max-w-2xl mx-auto">
          {{ t('app.description') }}
        </p>
        <RouterLink
          to="/login"
          class="btn btn-primary text-lg px-12 py-4"
        >
          {{ t('landing.cta.start') }}
        </RouterLink>
      </div>
    </section>

    <!-- Footer -->
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Clock, Users2, CalendarClock, Plane, MessageSquare, Timer } from 'lucide-vue-next';
import Timeline from '@/components/Timeline.vue';
import PersonCard from '@/components/PersonCard.vue';
import AppFooter from '@/components/AppFooter.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';
import { TimeService } from '@/services/TimeService';

const { t } = useI18n();
const selectedDate = ref(new Date());
const timeService = new TimeService();

const demoTeam = [
  { id: 1, name: 'Sarah Johnson', timezone: 'America/New_York' },
  { id: 2, name: 'Alex Chen', timezone: 'Asia/Tokyo' },
  { id: 3, name: 'María García', timezone: 'Europe/Madrid' },
  { id: 4, name: 'John Smith', timezone: 'America/Los_Angeles' },
  { id: 5, name: 'Ana Silva', timezone: 'America/Sao_Paulo' },
  { id: 6, name: 'Mohammed Ahmed', timezone: 'Asia/Dubai' },
];

function handleTimelineUpdate(date: Date) {
  selectedDate.value = date;
}

function formatTime(date: Date, timezone: string): string {
  return timeService.formatTime(date, timezone, 'en');
}
</script>