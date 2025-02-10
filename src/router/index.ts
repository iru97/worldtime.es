import { createRouter, createWebHistory } from 'vue-router';
import { watch } from 'vue';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/views/LandingView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/home',
      component: () => import('@/views/HomeView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/privacy',
      component: () => import('@/views/PrivacyPolicyView.vue'),
    },
    {
      path: '/terms',
      component: () => import('@/views/TermsView.vue'),
    },
    {
      path: '/auth/callback',
      component: () => import('@/views/AuthCallbackView.vue'),
    },
    // Redirect all unmatched routes to landing for guests and home for authenticated users
    {
      path: '/:pathMatch(.*)*',
      redirect: to => {
        const authStore = useAuthStore();
        return authStore.isAuthenticated ? '/home' : '/';
      },
    },
  ],
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  if (authStore.loading) {
    await new Promise<void>((resolve) => {
      const unwatch = watch(
        () => authStore.loading,
        (loading) => {
          if (!loading) {
            unwatch();
            resolve();
          }
        }
      );
    });
  }

  // Redirect authenticated users from guest routes to home
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return '/home';
  }

  // Redirect unauthenticated users from protected routes to landing
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/';
  }
});

export default router;