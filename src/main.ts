import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import router from './router';
import App from './App.vue';
import './index.css';
import { messages } from './i18n/messages';
import { useAuthStore } from '@/stores/auth';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
const authStore = useAuthStore();

const defaultLocale = navigator.language.split('-')[0] || 'en';
const supportedLocales = ['en', 'es'];
const locale = supportedLocales.includes(defaultLocale) ? defaultLocale : 'en';

const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'en',
  messages,
});

app
  .use(router)
  .use(i18n);

// Initialize auth store before mounting
authStore.initialize().then(() => {
  app.mount('#app');
});