import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";
import router from "./router";
import App from "./App.vue";
import "./index.css";
import { messages } from "./i18n/messages";
import { useAuthStore } from "@/stores/auth";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
const authStore = useAuthStore();

// Safe localStorage access helper
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// Get preferred language from localStorage or browser
const savedLanguage = safeGetItem("preferred-language");
const browserLanguage = navigator.language.split("-")[0];
const defaultLocale = savedLanguage || (browserLanguage === "es" ? "es" : "en");

const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: "en",
  messages,
  globalInjection: true,
});

app.use(router);
app.use(i18n);

// Initialize auth store before mounting with error handling and timeout
const AUTH_TIMEOUT = 10000; // 10 seconds

Promise.race([
  authStore.initialize(),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Auth initialization timeout')), AUTH_TIMEOUT)
  )
])
  .catch((error) => {
    console.error('Auth initialization failed:', error);
  })
  .finally(() => {
    app.mount("#app");
  });
