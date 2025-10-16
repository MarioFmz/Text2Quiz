<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto py-8 px-4">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">Descubre Quizzes</h1>
        <p class="text-gray-600">Explora y practica con exámenes de oposición compartidos por la comunidad</p>
      </div>

      <!-- Search and Filters -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <!-- Search Bar -->
        <div class="mb-6">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar quizzes..."
              class="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              @input="debouncedSearch"
            />
            <svg class="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <!-- Filters -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Category Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            <select
              v-model="selectedCategory"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              @change="handleFilterChange"
            >
              <option value="">Todas las categorías</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.icon }} {{ category.name }}
              </option>
            </select>
          </div>

          <!-- Difficulty Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Dificultad</label>
            <select
              v-model="selectedDifficulty"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              @change="handleFilterChange"
            >
              <option value="">Todas las dificultades</option>
              <option value="easy">Fácil</option>
              <option value="medium">Medio</option>
              <option value="hard">Difícil</option>
            </select>
          </div>

          <!-- Sort By -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
            <select
              v-model="sortBy"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              @change="handleFilterChange"
            >
              <option value="recent">Más recientes</option>
              <option value="completed">Más completados</option>
              <option value="popular">Más populares</option>
              <option value="likes">Más gustados</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p class="mt-4 text-gray-600">Cargando quizzes...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="quizzes.length === 0 && !loading" class="max-w-2xl mx-auto">
        <div class="text-center py-16 px-4 bg-white rounded-2xl shadow-lg">
          <!-- Large animated icon -->
          <div class="mb-8">
            <div class="text-7xl sm:text-8xl mb-4 transform hover:scale-110 transition-transform duration-300">🔍</div>
          </div>

          <!-- Engaging heading with gradient -->
          <h2 class="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600">
            No encontramos quizzes con esos filtros
          </h2>

          <!-- Descriptive and encouraging text -->
          <p class="text-lg text-gray-600 mb-8 leading-relaxed">
            Intenta ajustar tus filtros o búsqueda, o
            <span class="font-semibold text-indigo-600">sé el primero en crear un quiz</span> sobre este tema.
          </p>

          <!-- Suggestions cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div class="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 text-center">
              <div class="text-3xl mb-2">🔄</div>
              <p class="text-sm font-semibold text-gray-700 mb-1">Limpia los filtros</p>
              <p class="text-xs text-gray-600">Ver todos los quizzes</p>
            </div>
            <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 text-center">
              <div class="text-3xl mb-2">🔎</div>
              <p class="text-sm font-semibold text-gray-700 mb-1">Prueba otra búsqueda</p>
              <p class="text-xs text-gray-600">Usa palabras clave diferentes</p>
            </div>
            <div class="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg p-4 text-center">
              <div class="text-3xl mb-2">✨</div>
              <p class="text-sm font-semibold text-gray-700 mb-1">Crea el tuyo</p>
              <p class="text-xs text-gray-600">Sube un documento</p>
            </div>
          </div>

          <!-- Action button -->
          <router-link
            to="/upload"
            class="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <span>📤</span>
            <span>Crear mi primer quiz</span>
            <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </router-link>
        </div>
      </div>

      <!-- Quizzes Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div
          v-for="quiz in quizzes"
          :key="quiz.id"
          class="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
        >
          <!-- Quiz Header -->
          <div class="p-6">
            <!-- Category Badge -->
            <div class="flex items-center justify-between mb-3">
              <span v-if="quiz.category" class="text-xs font-medium px-3 py-1 rounded-full bg-indigo-100 text-indigo-800">
                {{ quiz.category.icon }} {{ quiz.category.name }}
              </span>
              <span v-if="quiz.is_verified" class="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-800" title="Verificado">
                ✓ Oficial
              </span>
            </div>

            <!-- Quiz Title -->
            <h3 class="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{{ quiz.title }}</h3>

            <!-- Quiz Meta -->
            <div class="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ quiz.total_questions }} preguntas</span>
              </div>
              <div :class="getDifficultyClass(quiz.difficulty)" class="flex items-center gap-1">
                <span>{{ getDifficultyLabel(quiz.difficulty) }}</span>
              </div>
            </div>

            <!-- Tags -->
            <div v-if="quiz.tags && quiz.tags.length > 0" class="flex flex-wrap gap-2 mb-4">
              <span
                v-for="tag in quiz.tags.slice(0, 3)"
                :key="tag"
                class="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
              >
                {{ tag }}
              </span>
            </div>

            <!-- Source -->
            <p v-if="quiz.source" class="text-xs text-gray-500 mb-4 italic">
              Fuente: {{ quiz.source }}
            </p>
          </div>

          <!-- Quiz Footer -->
          <div class="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <!-- Stats -->
            <div class="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <div class="flex items-center gap-1" title="Vistas">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{{ quiz.views_count || 0 }}</span>
              </div>

              <div class="flex items-center gap-1" title="Participantes">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{{ quiz.participants_count || 0 }}</span>
              </div>

              <button
                @click="toggleLike(quiz)"
                class="flex items-center gap-1 px-2 py-1 rounded-lg transition-colors hover:bg-gray-200 ml-auto"
                :class="quiz.is_liked ? 'text-red-600' : 'text-gray-600'"
              >
                <svg class="w-4 h-4" :fill="quiz.is_liked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span class="text-xs font-medium">{{ quiz.likes_count || 0 }}</span>
              </button>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col gap-2">
              <button
                @click="joinGlobalChallenge(quiz)"
                class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Desafío Global
              </button>
              <button
                @click="copyToMyQuizzes(quiz)"
                class="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Agregar a mis quizzes
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="flex justify-center items-center gap-2">
        <button
          @click="goToPage(pagination.page - 1)"
          :disabled="pagination.page === 1"
          class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>

        <div class="flex gap-2">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="goToPage(page)"
            :class="page === pagination.page ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
            class="px-4 py-2 border border-gray-300 rounded-lg"
          >
            {{ page }}
          </button>
        </div>

        <button
          @click="goToPage(pagination.page + 1)"
          :disabled="pagination.page === pagination.totalPages"
          class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
    </div>

    <!-- Modal for messages -->
    <Transition name="fade">
      <div
        v-if="showModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        @click.self="closeModal"
      >
        <div class="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl transform transition-all">
          <div class="text-center mb-6">
            <div class="text-5xl mb-4">
              {{ modalType === 'success' ? '✅' : '❌' }}
            </div>
            <h2 class="text-2xl font-bold mb-2">{{ modalTitle }}</h2>
            <p class="text-gray-600">{{ modalMessage }}</p>
          </div>

          <button
            @click="closeModal"
            class="w-full px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            Aceptar
          </button>
        </div>
      </div>
    </Transition>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import AppLayout from '../components/AppLayout.vue'
import { getPublicQuizzes, getCategories, toggleQuizLike } from '../services/publicQuizzesService'
import type { PublicQuizWithDetails, QuizCategory } from '../types'

const router = useRouter()
const authStore = useAuthStore()

// State
const loading = ref(true)
const quizzes = ref<PublicQuizWithDetails[]>([])
const categories = ref<QuizCategory[]>([])

const searchQuery = ref('')
const selectedCategory = ref('')
const selectedDifficulty = ref('')
const sortBy = ref('recent')

const pagination = ref({
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0
})

// Modal state
const showModal = ref(false)
const modalTitle = ref('')
const modalMessage = ref('')
const modalType = ref<'success' | 'error'>('success')

// Computed
const visiblePages = computed(() => {
  const current = pagination.value.page
  const total = pagination.value.totalPages
  const delta = 2
  const range = []
  const rangeWithDots = []

  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i)
  }

  if (current - delta > 2) {
    rangeWithDots.push(1, '...')
  } else {
    rangeWithDots.push(1)
  }

  rangeWithDots.push(...range)

  if (current + delta < total - 1) {
    rangeWithDots.push('...', total)
  } else if (total > 1) {
    rangeWithDots.push(total)
  }

  return rangeWithDots.filter((v, i, a) => a.indexOf(v) === i)
})

// Modal helper
function showModalMessage(title: string, message: string, type: 'success' | 'error' = 'success') {
  modalTitle.value = title
  modalMessage.value = message
  modalType.value = type
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

// Methods
async function loadQuizzes() {
  try {
    loading.value = true
    const response = await getPublicQuizzes(
      {
        category: selectedCategory.value || undefined,
        difficulty: selectedDifficulty.value as any || undefined,
        search: searchQuery.value || undefined,
        sortBy: sortBy.value as any,
        page: pagination.value.page,
        limit: pagination.value.limit
      },
      authStore.user?.id
    )

    quizzes.value = response.quizzes
    pagination.value = response.pagination
  } catch (error) {
    console.error('Error loading quizzes:', error)
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    categories.value = await getCategories()
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

let searchTimeout: number | null = null
function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1
    loadQuizzes()
  }, 500) as unknown as number
}

function handleFilterChange() {
  pagination.value.page = 1
  loadQuizzes()
}

function goToPage(page: number | string) {
  if (typeof page !== 'number') return
  pagination.value.page = page
  loadQuizzes()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function goToQuiz(quizId: string) {
  router.push(`/public-quiz/${quizId}`)
}

async function joinGlobalChallenge(quiz: PublicQuizWithDetails) {
  if (!authStore.user) {
    router.push('/login')
    return
  }

  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

    // Get or create global challenge
    const response = await fetch(`${apiUrl}/api/quizzes/${quiz.id}/get-or-create-challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: authStore.user.id })
    })

    if (!response.ok) {
      throw new Error('Failed to create/get challenge')
    }

    const data = await response.json()

    // Redirect to the challenge
    router.push(`/challenge/${data.challenge.share_slug}`)
  } catch (error) {
    console.error('Error joining global challenge:', error)
    showModalMessage('Error', 'No se pudo unir al desafío global. Por favor, intenta de nuevo.', 'error')
  }
}

async function copyToMyQuizzes(quiz: PublicQuizWithDetails) {
  if (!authStore.user) {
    router.push('/login')
    return
  }

  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

    const response = await fetch(`${apiUrl}/api/quizzes/${quiz.id}/copy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: authStore.user.id })
    })

    if (!response.ok) {
      throw new Error('Failed to copy quiz')
    }

    const data = await response.json()

    // Show success modal and redirect after 1.5 seconds
    showModalMessage('¡Éxito!', 'Quiz copiado exitosamente a tus quizzes. Redirigiendo...', 'success')
    setTimeout(() => {
      router.push('/quizzes')
    }, 1500)
  } catch (error) {
    console.error('Error copying quiz:', error)
    showModalMessage('Error', 'No se pudo copiar el quiz. Por favor, intenta de nuevo.', 'error')
  }
}

async function toggleLike(quiz: PublicQuizWithDetails) {
  if (!authStore.user) {
    router.push('/login')
    return
  }

  try {
    const result = await toggleQuizLike(quiz.id, authStore.user.id)
    quiz.is_liked = result.liked
    quiz.likes_count = (quiz.likes_count || 0) + (result.liked ? 1 : -1)
  } catch (error) {
    console.error('Error toggling like:', error)
  }
}

function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    easy: 'Fácil',
    medium: 'Medio',
    hard: 'Difícil'
  }
  return labels[difficulty] || difficulty
}

function getDifficultyClass(difficulty: string): string {
  const classes: Record<string, string> = {
    easy: 'text-green-600',
    medium: 'text-yellow-600',
    hard: 'text-red-600'
  }
  return classes[difficulty] || 'text-gray-600'
}

// Lifecycle
onMounted(async () => {
  await Promise.all([loadCategories(), loadQuizzes()])
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .bg-white,
.fade-leave-active .bg-white {
  transition: transform 0.3s ease;
}

.fade-enter-from .bg-white {
  transform: scale(0.9);
}

.fade-leave-to .bg-white {
  transform: scale(0.9);
}
</style>
