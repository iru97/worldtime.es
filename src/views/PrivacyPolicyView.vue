<template>
  <div class="min-h-screen bg-gradient-to-br from-[var(--bg-gradient-from)] to-[var(--bg-gradient-to)]">
    <header class="bg-[var(--card-bg)] shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <h1 class="text-2xl font-bold text-[var(--text-primary)]">Privacy Policy</h1>
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
          <h2 class="text-xl font-semibold text-[var(--text-primary)] mb-4">Introduction</h2>
          <p class="text-[var(--text-secondary)]">
            At WorldTime, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-[var(--text-primary)] mb-4">Information We Collect</h2>
          <div class="space-y-4 text-[var(--text-secondary)]">
            <p>We collect information that you provide directly to us:</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>Account information (email address)</li>
              <li>Profile information (timezone, language preferences)</li>
              <li>Contact information you add to your account</li>
              <li>Usage data and preferences</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-[var(--text-primary)] mb-4">How We Use Your Information</h2>
          <div class="space-y-4 text-[var(--text-secondary)]">
            <p>We use the information we collect to:</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process and complete transactions</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Understand how you use our service</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-[var(--text-primary)] mb-4">Data Security</h2>
          <p class="text-[var(--text-secondary)]">
            We implement appropriate technical and organizational measures to maintain the security of your personal information, including encryption of data in transit and at rest.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-[var(--text-primary)] mb-4">Your Rights</h2>
          <div class="space-y-4 text-[var(--text-secondary)]">
            <p>You have the right to:</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your information</li>
              <li>Object to our use of your information</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-[var(--text-primary)] mb-4">Contact Us</h2>
          <p class="text-[var(--text-secondary)]">
            If you have any questions about this Privacy Policy, please contact us at privacy@worldtime.app
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