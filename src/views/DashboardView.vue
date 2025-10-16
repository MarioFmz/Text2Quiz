<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import { quizzesService } from '@/services/quizzesService'
import { useToast } from '@/composables/useToast'
import type { Question } from '@/types'

const { user } = useAuth()
const router = useRouter()
const { success } = useToast()

type PracticeMode = 'dashboard' | 'flashcards' | 'express' | 'daily'

const stats = ref({
  totalDocuments: 0,
  totalQuizzes: 0,
  averageAccuracy: 0,
  recentProgress: [] as any[]
})
const loading = ref(true)
const userStreak = ref({ current_streak: 0, longest_streak: 0 })
const myChallenges = ref<any[]>([])
const loadingChallenges = ref(true)

// Practice mode state
const practiceMode = ref<PracticeMode>('dashboard')
const practiceLoading = ref(false)
const questions = ref<Question[]>([])
const currentIndex = ref(0)
const showAnswer = ref(false)
const userAnswers = ref<Record<string, string>>({})
const showResults = ref(false)
const knownCards = ref<string[]>([])
const unknownCards = ref<string[]>([])

onMounted(async () => {
  if (user.value) {
    // Load stats
    stats.value = await quizzesService.getUserStats(user.value.id)
    loading.value = false

    // Load user challenges
    await loadMyChallenges()
  }
})

const loadMyChallenges = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/challenges/my-challenges?userId=${user.value?.id}`)

    if (response.ok) {
      const data = await response.json()
      // Only show active challenges, limit to 3
      myChallenges.value = (data.challenges || [])
        .filter((c: any) => c.is_active)
        .slice(0, 3)
    }
  } catch (error) {
    console.error('Error loading challenges:', error)
  } finally {
    loadingChallenges.value = false
  }
}

// Practice mode functions
const loadUserStreak = async () => {
  if (!user.value) return

  try {
    // TODO: Load user streak from API
    userStreak.value = {
      current_streak: 0,
      longest_streak: 0,
      last_completed_date: null
    }
  } catch (error) {
    console.error('Error loading streak:', error)
  }
}

const startFlashCards = async () => {
  practiceLoading.value = true
  try {
    // Get random questions from user's completed quizzes
    const allQuestions = await quizzesService.getAllQuestions(user.value!.id)

    // Shuffle and take 20 questions
    questions.value = shuffleArray(allQuestions).slice(0, 20)
    currentIndex.value = 0
    showAnswer.value = false
    knownCards.value = []
    unknownCards.value = []
    practiceMode.value = 'flashcards'
  } catch (error) {
    console.error('Error loading questions:', error)
    alert('Error al cargar las preguntas. Asegúrate de haber completado al menos un quiz.')
  } finally {
    practiceLoading.value = false
  }
}

const startQuizExpress = async () => {
  practiceLoading.value = true
  try {
    // Get 5 random questions from user's documents
    const allQuestions = await quizzesService.getAllQuestions(user.value!.id)

    questions.value = shuffleArray(allQuestions).slice(0, 5)
    currentIndex.value = 0
    userAnswers.value = {}
    showResults.value = false
    practiceMode.value = 'express'
  } catch (error) {
    console.error('Error loading questions:', error)
    alert('Error al cargar las preguntas. Asegúrate de haber completado al menos un quiz.')
  } finally {
    practiceLoading.value = false
  }
}

const startDailyChallenge = async () => {
  practiceLoading.value = true
  try {
    // TODO: Load daily challenge from API
    // For now, use random questions
    const allQuestions = await quizzesService.getAllQuestions(user.value!.id)

    questions.value = shuffleArray(allQuestions).slice(0, 10)
    currentIndex.value = 0
    userAnswers.value = {}
    showResults.value = false
    practiceMode.value = 'daily'
  } catch (error) {
    console.error('Error loading daily challenge:', error)
    alert('Error al cargar el desafío diario. Asegúrate de haber completado al menos un quiz.')
  } finally {
    practiceLoading.value = false
  }
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Flash Cards methods
const flipCard = () => {
  showAnswer.value = !showAnswer.value
}

const markAsKnown = () => {
  knownCards.value.push(questions.value[currentIndex.value].id)
  nextCard()
}

const markAsUnknown = () => {
  unknownCards.value.push(questions.value[currentIndex.value].id)
  nextCard()
}

const nextCard = () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    showAnswer.value = false
  } else {
    showResults.value = true
  }
}

// Quiz Express & Daily Challenge methods
const selectAnswer = (questionId: string, answer: string) => {
  userAnswers.value[questionId] = answer

  // Auto-advance after selection
  setTimeout(() => {
    if (currentIndex.value < questions.value.length - 1) {
      currentIndex.value++
    } else {
      finishQuiz()
    }
  }, 300)
}

const finishQuiz = () => {
  showResults.value = true

  // Update streak if daily challenge
  if (practiceMode.value === 'daily') {
    updateStreak()
  }
}

const updateStreak = async () => {
  // TODO: Update streak via API
  const results = calculateResults()
  if (results.percentage >= 70) {
    userStreak.value.current_streak++
    if (userStreak.value.current_streak > userStreak.value.longest_streak) {
      userStreak.value.longest_streak = userStreak.value.current_streak
    }
  }
}

const calculateResults = () => {
  const correctCount = questions.value.filter(
    q => userAnswers.value[q.id] === q.correct_answer
  ).length

  return {
    correct: correctCount,
    incorrect: questions.value.length - correctCount,
    percentage: Math.round((correctCount / questions.value.length) * 100)
  }
}

const backToMenu = () => {
  practiceMode.value = 'dashboard'
  questions.value = []
  currentIndex.value = 0
  showAnswer.value = false
  userAnswers.value = {}
  showResults.value = false
  knownCards.value = []
  unknownCards.value = []
}

const retryPractice = () => {
  currentIndex.value = 0
  showAnswer.value = false
  userAnswers.value = {}
  showResults.value = false
  knownCards.value = []
  unknownCards.value = []
}

const currentQuestion = computed(() => questions.value[currentIndex.value])

const progress = computed(() => {
  return ((currentIndex.value + 1) / questions.value.length) * 100
})

const getShareUrl = (slug: string) => {
  return `${window.location.origin}/challenge/${slug}`
}

const copyToClipboard = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url)
    success('¡Enlace copiado al portapapeles!')
  } catch (error) {
    console.error('Error copying:', error)
  }
}
</script>

<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <!-- Header -->
      <div class="mb-8 sm:mb-12">
        <h1 class="text-3xl sm:text-4xl font-bold mb-2">Dashboard</h1>
        <p class="text-gray-600">Bienvenido, {{ user?.email?.split('@')[0] || 'Usuario' }}</p>
      </div>

      <!-- BIENVENIDA - Cuando NO hay quizzes -->
      <div v-if="!loading && stats.totalQuizzes === 0 && practiceMode === 'dashboard'" class="mb-10 sm:mb-12">
        <div class="card bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 p-8 sm:p-12 text-center">
          <div class="text-6xl sm:text-8xl mb-6 animate-bounce">✨</div>
          <h2 class="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">
            ¡Bienvenido a Text2Quiz!
          </h2>
          <p class="text-lg text-gray-700 mb-6 max-w-2xl mx-auto">
            Transforma tus documentos en quizzes interactivos con IA.
            Empieza creando tu primer quiz ahora.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <router-link
              to="/create-quiz"
              class="btn btn-primary text-lg px-8 py-4 transform hover:scale-105 transition-all"
            >
              ✨ Crear Mi Primer Quiz
            </router-link>
          </div>

          <div class="grid sm:grid-cols-3 gap-6 mt-8 text-left max-w-3xl mx-auto">
            <div class="bg-white rounded-lg p-4 shadow-sm">
              <div class="text-3xl mb-2">🤖</div>
              <h3 class="font-bold mb-1">1. IA Genera Quiz</h3>
              <p class="text-sm text-gray-600">Crea quizzes automáticamente desde tus documentos</p>
            </div>
            <div class="bg-white rounded-lg p-4 shadow-sm">
              <div class="text-3xl mb-2">🎯</div>
              <h3 class="font-bold mb-1">2. Practica y Mejora</h3>
              <p class="text-sm text-gray-600">Aprende con retroalimentación al instante</p>
            </div>
            <div class="bg-white rounded-lg p-4 shadow-sm">
              <div class="text-3xl mb-2">🏆</div>
              <h3 class="font-bold mb-1">3. Compite con Amigos</h3>
              <p class="text-sm text-gray-600">Comparte desafíos y compara resultados</p>
            </div>
          </div>
        </div>
      </div>

      <!-- PRÁCTICA RÁPIDA - Solo cuando SÍ hay quizzes -->
      <div v-else-if="!loading && stats.totalQuizzes > 0 && practiceMode === 'dashboard'" class="mb-10 sm:mb-12">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold flex items-center space-x-2">
            <span class="text-3xl">⚡</span>
            <span>Práctica Rápida</span>
          </h2>
          <div v-if="userStreak.current_streak > 0" class="flex items-center space-x-2 bg-orange-50 px-3 sm:px-4 py-2 rounded-lg">
            <span class="text-xl sm:text-2xl">🔥</span>
            <span class="font-bold text-orange-600 text-sm sm:text-base">{{ userStreak.current_streak }} días</span>
          </div>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <!-- Daily Challenge - MÁS DESTACADO -->
          <button
            @click="startDailyChallenge"
            class="card hover:shadow-2xl transition-all text-left p-6 border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-blue-50 relative transform hover:scale-105"
          >
            <div class="absolute top-4 right-4 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
              HOY
            </div>
            <div class="text-5xl sm:text-6xl mb-4">🌟</div>
            <h3 class="text-xl sm:text-2xl font-bold mb-2 text-purple-900">Desafío Diario</h3>
            <p class="text-sm text-gray-700 mb-4 font-medium">
              ¡Mantén tu racha activa!
            </p>
            <div class="flex items-center space-x-2 text-xs text-gray-600">
              <span>🔥</span>
              <span>10 preguntas · 5 min</span>
            </div>
          </button>

          <!-- Quiz Express -->
          <button
            @click="startQuizExpress"
            class="card hover:shadow-xl transition-all text-left p-6 border-2 border-transparent hover:border-green-300"
          >
            <div class="text-4xl sm:text-5xl mb-4">⚡</div>
            <h3 class="text-lg sm:text-xl font-bold mb-2">Quiz Express</h3>
            <p class="text-sm text-gray-600 mb-4">
              Quiz rápido de 5 preguntas
            </p>
            <div class="flex items-center space-x-2 text-xs text-gray-500">
              <span>⏱️</span>
              <span>2-3 minutos</span>
            </div>
          </button>

          <!-- Flash Cards -->
          <button
            @click="startFlashCards"
            class="card hover:shadow-xl transition-all text-left p-6 border-2 border-transparent hover:border-blue-300"
          >
            <div class="text-4xl sm:text-5xl mb-4">🎴</div>
            <h3 class="text-lg sm:text-xl font-bold mb-2">Flash Cards</h3>
            <p class="text-sm text-gray-600 mb-4">
              Repasa conceptos clave
            </p>
            <div class="flex items-center space-x-2 text-xs text-gray-500">
              <span>📊</span>
              <span>20 tarjetas</span>
            </div>
          </button>
        </div>
      </div>

      <!-- 2. MIS DESAFÍOS - SOLO SI TIENE DESAFÍOS -->
      <div v-if="!loadingChallenges && myChallenges.length > 0 && practiceMode === 'dashboard'" class="mb-10 sm:mb-12">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold flex items-center space-x-2">
            <span class="text-3xl">🏆</span>
            <span>Mis Desafíos</span>
          </h2>
          <router-link
            to="/my-challenges"
            class="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Ver todos →
          </router-link>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div
            v-for="challenge in myChallenges"
            :key="challenge.id"
            class="card hover:shadow-lg transition-shadow"
          >
            <div class="mb-4">
              <h3 class="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                {{ challenge.quiz_title }}
              </h3>
              <div class="text-xs text-gray-500">
                Compartido hace {{ Math.floor((Date.now() - new Date(challenge.created_at).getTime()) / (1000 * 60 * 60 * 24)) }} días
              </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-3 gap-2 mb-4">
              <div class="bg-blue-50 rounded-lg p-2 text-center">
                <div class="text-lg font-bold text-blue-600">{{ challenge.total_attempts }}</div>
                <div class="text-xs text-gray-600">Intentos</div>
              </div>
              <div class="bg-green-50 rounded-lg p-2 text-center">
                <div class="text-lg font-bold text-green-600">{{ challenge.best_score }}%</div>
                <div class="text-xs text-gray-600">Mejor</div>
              </div>
              <div class="bg-orange-50 rounded-lg p-2 text-center">
                <div class="text-lg font-bold text-orange-600">
                  {{ challenge.creator_rank ? `#${challenge.creator_rank}` : '-' }}
                </div>
                <div class="text-xs text-gray-600">Tu Pos</div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex space-x-2">
              <button
                @click="copyToClipboard(getShareUrl(challenge.share_slug))"
                class="btn btn-secondary flex-1 text-xs sm:text-sm py-2"
              >
                📋 Copiar
              </button>
              <button
                @click="router.push(`/challenge/${challenge.share_slug}`)"
                class="btn btn-primary flex-1 text-xs sm:text-sm py-2"
              >
                Ver
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. ESTADÍSTICAS - Solo cuando hay quizzes -->
      <div v-if="!loading && stats.totalQuizzes > 0 && practiceMode === 'dashboard'">
        <h2 class="text-xl font-bold mb-4 text-gray-700">Tus estadísticas</h2>
        <div class="grid grid-cols-3 gap-3 sm:gap-4">
          <div class="card bg-gray-50 text-center py-4">
            <div class="text-2xl mb-1">📚</div>
            <div class="text-2xl font-bold mb-1">{{ stats.totalDocuments }}</div>
            <div class="text-xs text-gray-600">Documentos</div>
          </div>

          <div class="card bg-gray-50 text-center py-4">
            <div class="text-2xl mb-1">✅</div>
            <div class="text-2xl font-bold mb-1">{{ stats.totalQuizzes }}</div>
            <div class="text-xs text-gray-600">Quizzes</div>
          </div>

          <div class="card bg-gray-50 text-center py-4">
            <div class="text-2xl mb-1">📈</div>
            <div class="text-2xl font-bold mb-1">{{ stats.averageAccuracy }}%</div>
            <div class="text-xs text-gray-600">Precisión</div>
          </div>
        </div>
      </div>

      <!-- PRACTICE MODES -->

      <!-- Flash Cards Mode -->
      <div v-if="practiceMode === 'flashcards' && !showResults" class="space-y-6">
        <div class="flex items-center justify-between mb-4">
          <button @click="backToMenu" class="btn btn-secondary">
            ← Volver
          </button>
          <span class="text-sm text-gray-600">
            {{ currentIndex + 1 }} / {{ questions.length }}
          </span>
        </div>

        <div class="card min-h-[400px] flex flex-col justify-center items-center p-8 cursor-pointer" @click="flipCard">
          <div class="text-center">
            <div class="text-sm text-gray-500 mb-4">
              {{ showAnswer ? 'RESPUESTA' : 'PREGUNTA' }}
            </div>

            <div v-if="!showAnswer" class="text-xl sm:text-2xl font-semibold mb-6">
              {{ currentQuestion.question_text }}
            </div>

            <div v-else class="space-y-4">
              <p class="text-lg text-gray-700 mb-4">{{ currentQuestion.question_text }}</p>
              <p class="text-xl sm:text-2xl font-bold text-green-600 mb-4">
                {{ currentQuestion.correct_answer }}
              </p>
              <p v-if="currentQuestion.explanation" class="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                {{ currentQuestion.explanation }}
              </p>
            </div>

            <div class="text-sm text-gray-400 mt-8">
              Toca para {{ showAnswer ? 'volver' : 'ver respuesta' }}
            </div>
          </div>
        </div>

        <div v-if="showAnswer" class="flex gap-4">
          <button @click.stop="markAsUnknown" class="btn btn-secondary flex-1">
            ❌ No la sabía
          </button>
          <button @click.stop="markAsKnown" class="btn btn-primary flex-1">
            ✅ La sabía
          </button>
        </div>

        <!-- Progress bar -->
        <div class="bg-gray-200 rounded-full h-2">
          <div
            class="bg-blue-500 h-2 rounded-full transition-all"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
      </div>

      <!-- Flash Cards Results -->
      <div v-else-if="practiceMode === 'flashcards' && showResults" class="space-y-6">
        <h1 class="text-2xl sm:text-3xl font-bold mb-6">📊 Resultados - Flash Cards</h1>

        <div class="card text-center">
          <div class="text-5xl mb-4">🎯</div>
          <h2 class="text-2xl font-bold mb-6">¡Sesión completada!</h2>

          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="p-4 bg-green-50 rounded-lg">
              <div class="text-3xl font-bold text-green-700">{{ knownCards.length }}</div>
              <div class="text-sm text-green-600">Conocidas</div>
            </div>
            <div class="p-4 bg-red-50 rounded-lg">
              <div class="text-3xl font-bold text-red-700">{{ unknownCards.length }}</div>
              <div class="text-sm text-red-600">Por repasar</div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <button @click="retryPractice" class="btn btn-secondary w-full sm:w-auto">
              Repetir
            </button>
            <button @click="backToMenu" class="btn btn-primary w-full sm:w-auto">
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>

      <!-- Quiz Express / Daily Challenge Mode -->
      <div v-else-if="(practiceMode === 'express' || practiceMode === 'daily') && !showResults" class="space-y-6">
        <div class="flex items-center justify-between mb-4">
          <button @click="backToMenu" class="btn btn-secondary">
            ← Volver
          </button>
          <div class="flex items-center space-x-3">
            <span v-if="practiceMode === 'daily'" class="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
              🌟 Desafío Diario
            </span>
            <span class="text-sm text-gray-600">
              {{ currentIndex + 1 }} / {{ questions.length }}
            </span>
          </div>
        </div>

        <div class="card">
          <h2 class="text-lg sm:text-xl font-semibold mb-6">
            {{ currentQuestion.question_text }}
          </h2>

          <div class="space-y-3">
            <button
              v-for="(option, index) in currentQuestion.options"
              :key="index"
              @click="selectAnswer(currentQuestion.id, option)"
              class="w-full text-left p-4 rounded-lg border-2 transition-all"
              :class="
                userAnswers[currentQuestion.id] === option
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              "
            >
              {{ option }}
            </button>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="bg-gray-200 rounded-full h-2">
          <div
            class="bg-blue-500 h-2 rounded-full transition-all"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
      </div>

      <!-- Quiz Results -->
      <div v-else-if="(practiceMode === 'express' || practiceMode === 'daily') && showResults" class="space-y-6">
        <h1 class="text-2xl sm:text-3xl font-bold mb-6">
          {{ practiceMode === 'daily' ? '🌟 Desafío Diario Completado' : '⚡ Quiz Express Completado' }}
        </h1>

        <div class="card text-center">
          <div class="text-5xl mb-4">
            {{ calculateResults().percentage >= 80 ? '🎉' : '📚' }}
          </div>
          <h2 class="text-3xl font-bold mb-2">
            {{ calculateResults().percentage }}%
          </h2>
          <p class="text-gray-600 mb-8">
            {{ calculateResults().correct }} de {{ questions.length }} respuestas correctas
          </p>

          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="p-4 bg-green-50 rounded-lg">
              <div class="text-2xl font-bold text-green-700">{{ calculateResults().correct }}</div>
              <div class="text-sm text-green-600">Correctas</div>
            </div>
            <div class="p-4 bg-red-50 rounded-lg">
              <div class="text-2xl font-bold text-red-700">{{ calculateResults().incorrect }}</div>
              <div class="text-sm text-red-600">Incorrectas</div>
            </div>
          </div>

          <!-- Streak Update -->
          <div v-if="practiceMode === 'daily' && calculateResults().percentage >= 70" class="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mb-6">
            <div class="flex items-center justify-center space-x-3">
              <span class="text-3xl">🔥</span>
              <div>
                <p class="font-bold text-orange-900">¡Racha actualizada!</p>
                <p class="text-sm text-orange-700">{{ userStreak?.current_streak || 0 }} días consecutivos</p>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <button @click="retryPractice" class="btn btn-secondary w-full sm:w-auto">
              Reintentar
            </button>
            <button @click="backToMenu" class="btn btn-primary w-full sm:w-auto">
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
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
