<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { quizzesService } from '@/services/quizzesService'
import type { Quiz } from '@/types'

const router = useRouter()
const { user } = useAuth()

const quizzes = ref<Quiz[]>([])
const loading = ref(true)
const error = ref('')
const deletingId = ref<string | null>(null)
const showDeleteModal = ref(false)
const quizToDelete = ref<string | null>(null)
const searchQuery = ref('')
const filterDifficulty = ref<'all' | 'easy' | 'medium' | 'hard'>('all')

onMounted(async () => {
  await loadQuizzes()
})

const loadQuizzes = async () => {
  if (!user.value) return

  try {
    loading.value = true
    quizzes.value = await quizzesService.getUserQuizzes(user.value.id)
  } catch (e: any) {
    error.value = e.message || 'Error al cargar quizzes'
  } finally {
    loading.value = false
  }
}

const filteredQuizzes = computed(() => {
  let filtered = quizzes.value

  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(quiz =>
      quiz.title.toLowerCase().includes(query)
    )
  }

  // Filtrar por dificultad
  if (filterDifficulty.value !== 'all') {
    filtered = filtered.filter(quiz => quiz.difficulty === filterDifficulty.value)
  }

  return filtered
})

const goToQuiz = (quizId: string) => {
  router.push(`/quiz/${quizId}`)
}

const promptDeleteQuiz = (quizId: string) => {
  quizToDelete.value = quizId
  showDeleteModal.value = true
}

const confirmDeleteQuiz = async () => {
  if (!user.value || !quizToDelete.value) return

  try {
    deletingId.value = quizToDelete.value
    await quizzesService.deleteQuiz(quizToDelete.value, user.value.id)
    quizzes.value = quizzes.value.filter(q => q.id !== quizToDelete.value)
  } catch (e: any) {
    error.value = e.message || 'Error al eliminar quiz'
  } finally {
    deletingId.value = null
    quizToDelete.value = null
  }
}

const cancelDelete = () => {
  quizToDelete.value = null
}

const getDifficultyIcon = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return '🟢'
    case 'medium': return '🟡'
    case 'hard': return '🔴'
    default: return '⚪'
  }
}

const getDifficultyText = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'Fácil'
    case 'medium': return 'Medio'
    case 'hard': return 'Difícil'
    default: return 'N/A'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto px-3 py-4 sm:px-6 lg:px-8 sm:py-8">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold">Mis Quizzes</h1>
        <router-link to="/create-quiz" class="btn btn-primary w-full sm:w-auto text-center">
          Crear nuevo quiz
        </router-link>
      </div>

      <!-- Filtros y búsqueda -->
      <div v-if="quizzes.length > 0" class="card mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- Búsqueda -->
          <div class="flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar quiz por título..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <!-- Filtro de dificultad -->
          <div class="sm:w-48">
            <select
              v-model="filterDifficulty"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="all">Todas las dificultades</option>
              <option value="easy">🟢 Fácil</option>
              <option value="medium">🟡 Medio</option>
              <option value="hard">🔴 Difícil</option>
            </select>
          </div>
        </div>

        <div class="mt-4 text-sm text-gray-600">
          Mostrando {{ filteredQuizzes.length }} de {{ quizzes.length }} quizzes
        </div>
      </div>

      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Cargando quizzes...</p>
      </div>

      <div v-else-if="quizzes.length === 0" class="max-w-2xl mx-auto">
        <div class="text-center py-16 px-4">
          <!-- Large animated icon -->
          <div class="mb-8 animate-bounce">
            <div class="text-7xl sm:text-8xl mb-4">📚</div>
          </div>

          <!-- Engaging heading with gradient -->
          <h2 class="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            ¡Tu biblioteca de quizzes está esperando!
          </h2>

          <!-- Descriptive and encouraging text -->
          <p class="text-lg text-gray-600 mb-8 leading-relaxed">
            Comienza tu viaje de aprendizaje creando tu primer quiz.
            <span class="font-semibold text-indigo-600">Transforma cualquier documento</span> en una experiencia interactiva
            o explora quizzes públicos de la comunidad.
          </p>

          <!-- Multiple action buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <router-link
              to="/upload"
              class="group relative px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
            >
              <span class="flex items-center justify-center gap-2">
                <span>📄</span>
                <span>Subir documento</span>
                <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </router-link>

            <router-link
              to="/public-quizzes"
              class="px-8 py-4 text-lg font-semibold text-indigo-600 bg-white border-2 border-indigo-600 rounded-xl hover:bg-indigo-50 transform hover:scale-105 transition-all duration-300 w-full sm:w-auto"
            >
              <span class="flex items-center justify-center gap-2">
                <span>🌍</span>
                <span>Explorar quizzes públicos</span>
              </span>
            </router-link>
          </div>

          <!-- Quick stats or features -->
          <div class="mt-12 grid grid-cols-3 gap-6">
            <div class="text-center">
              <div class="text-4xl mb-2">✨</div>
              <p class="text-sm text-gray-600">IA Avanzada</p>
            </div>
            <div class="text-center">
              <div class="text-4xl mb-2">🎯</div>
              <p class="text-sm text-gray-600">Aprende Jugando</p>
            </div>
            <div class="text-center">
              <div class="text-4xl mb-2">📊</div>
              <p class="text-sm text-gray-600">Sigue tu Progreso</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-800">{{ error }}</p>
        </div>

        <div v-if="filteredQuizzes.length === 0" class="text-center py-12 card">
          <p class="text-gray-600">No se encontraron quizzes con los filtros seleccionados</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div
            v-for="quiz in filteredQuizzes"
            :key="quiz.id"
            class="card hover:shadow-md transition-shadow cursor-pointer"
            @click="goToQuiz(quiz.id)"
          >
            <div class="mb-4">
              <div class="flex items-start space-x-3">
                <span class="text-3xl flex-shrink-0">{{ getDifficultyIcon(quiz.difficulty) }}</span>
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-gray-900 line-clamp-2 mb-1">{{ quiz.title }}</h3>
                  <p class="text-sm text-gray-500">{{ formatDate(quiz.generated_at) }}</p>
                </div>
              </div>
            </div>

            <div class="mb-4 space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Dificultad:</span>
                <span class="font-medium">{{ getDifficultyText(quiz.difficulty) }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Preguntas:</span>
                <span class="font-medium">{{ quiz.num_questions }}</span>
              </div>
            </div>

            <!-- Resumen si existe -->
            <div v-if="quiz.summary" class="mb-4">
              <p class="text-sm text-gray-600 line-clamp-2">{{ quiz.summary }}</p>
            </div>

            <div class="flex gap-2" @click.stop>
              <button
                @click="goToQuiz(quiz.id)"
                class="flex-1 btn btn-primary text-sm"
              >
                Realizar quiz
              </button>
              <button
                @click="promptDeleteQuiz(quiz.id)"
                :disabled="deletingId === quiz.id"
                class="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                :class="{ 'opacity-50 cursor-not-allowed': deletingId === quiz.id }"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      :show="showDeleteModal"
      title="Eliminar quiz"
      message="¿Estás seguro de que deseas eliminar este quiz? Esta acción no se puede deshacer."
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      @confirm="confirmDeleteQuiz"
      @cancel="cancelDelete"
      @close="showDeleteModal = false"
    />
  </AppLayout>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
