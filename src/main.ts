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

// Get preferred language from localStorage or browser
const savedLanguage = localStorage.getItem('preferred-language');
const browserLanguage = navigator.language.split('-')[0];
const defaultLocale = savedLanguage || (browserLanguage === 'es' ? 'es' : 'en');

const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
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