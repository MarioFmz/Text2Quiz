import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/upload',
    name: 'upload',
    component: () => import('@/views/UploadView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/documents',
    name: 'documents',
    component: () => import('@/views/DocumentsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/quiz/:id',
    name: 'quiz',
    component: () => import('@/views/QuizView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/challenge/:identifier',
    name: 'challenge',
    component: () => import('@/views/ChallengeView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/practice',
    name: 'practice',
    component: () => import('@/views/QuickPracticeView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-challenges',
    name: 'my-challenges',
    component: () => import('@/views/MyChallengesView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard para rutas protegidas
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Esperar a que la autenticación se inicialice
  if (authStore.loading) {
    await new Promise<void>((resolve) => {
      const unwatch = authStore.$subscribe(() => {
        if (!authStore.loading) {
          unwatch()
          resolve()
        }
      })
    })
  }

  if (to.meta.requiresAuth && !authStore.user) {
    next('/login')
  } else if ((to.name === 'login' || to.name === 'register') && authStore.user) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
