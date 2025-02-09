<template>
  <div class="min-h-screen bg-gradient-to-br from-[var(--bg-gradient-from)] to-[var(--bg-gradient-to)]">
    <header class="bg-[var(--card-bg)] shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <h1 class="text-2xl font-bold text-[var(--text-primary)]">Terms of Service</h1>
          <RouterLink
            to="/"
            class="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
          >
            <ArrowLeft class="w-5 h-5" />
            Back to Home
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="card space-y-8">
        <section>
          <h2 class="text-xl font-semibold text-[var(--text-primary)] mb-4">Agreement to Terms</h2>
          <p class="text-[var(--text-secondary)]">
            By accessing or using WorldTime, you agree to be bound by these Terms of Service and all applicable laws and regulations.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-[var(--text-primary)] mb-4">Use License</h2>
          <div class="space-y-4 text-[var(--text-secondary)]">
            <p>Permission is granted to temporarily use WorldTime for personal, non-commercial use only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to decompile or reverse engineer any software</li>
              <li>Remove any copyright or proprietary notations</li>
              <li>Transfer the materials to another person</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-[var(--text-primary)] mb-4">User Account</h2>
          <div class="space-y-4 text-[var(--text-secondary)]">
            <p>To use certain features of WorldTime, you must:</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>Register for an account</li>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account</li>
              <li>Notify us immediately of any unauthorized use</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-[var(--text-primary)] mb-4">Disclaimer</h2>
          <p class="text-[var(--text-secondary)]">
            The materials on WorldTime are provided on an 'as is' basis. WorldTime makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-[var(--text-primary)] mb-4">Limitations</h2>
          <p class="text-[var(--text-secondary)]">
            In no event shall WorldTime or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use WorldTime.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-[var(--text-primary)] mb-4">Governing Law</h2>
          <p class="text-[var(--text-secondary)]">
            These terms and conditions are governed by and construed in accordance with the laws of your jurisdiction and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </p>
        </section>

        <div class="text-sm text-[var(--text-tertiary)] pt-4 border-t border-[var(--card-border)]">
          Last updated: March 15, 2025
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next';
</script>