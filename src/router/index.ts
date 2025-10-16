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
    path: '/create-quiz',
    name: 'create-quiz',
    component: () => import('@/views/CreateQuizView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/documents',
    name: 'documents',
    component: () => import('@/views/DocumentsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/quizzes',
    name: 'quizzes',
    component: () => import('@/views/QuizzesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/quiz/:id',
    name: 'quiz',
    component: () => import('@/views/QuizView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/public-quizzes',
    name: 'public-quizzes',
    component: () => import('@/views/PublicQuizzesView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/public-quiz/:id',
    name: 'public-quiz',
    component: () => import('@/views/PublicQuizDetailView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/challenge/:identifier',
    name: 'challenge',
    component: () => import('@/views/ChallengeView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/my-challenges',
    name: 'my-challenges',
    component: () => import('@/views/MyChallengesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard para rutas protegidas
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // SIEMPRE esperar a que se cargue el estado de autenticación
  // Esto evita el "parpadeo" donde el usuario ve la página como no autenticado
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

  // Redirigir usuarios autenticados de login/register al dashboard
  if ((to.name === 'login' || to.name === 'register') && authStore.user) {
    next('/dashboard')
    return
  }

  // Redirigir usuarios autenticados de la home al dashboard
  if (to.name === 'home' && authStore.user) {
    next('/dashboard')
    return
  }

  // Verificar autenticación para rutas protegidas
  if (to.meta.requiresAuth && !authStore.user) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else {
    next()
  }
})

export default router
