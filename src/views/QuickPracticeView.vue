<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRoute } from 'vue-router'
import { quizzesService } from '@/services/quizzesService'
import type { Question } from '@/types'

const { user } = useAuth()
const route = useRoute()

type PracticeMode = 'menu' | 'flashcards' | 'express' | 'daily'

const mode = ref<PracticeMode>('menu')
const loading = ref(false)
const questions = ref<Question[]>([])
const currentIndex = ref(0)
const showAnswer = ref(false)
const userAnswers = ref<Record<string, string>>({})
const showResults = ref(false)
const dailyChallenge = ref<any>(null)
const userStreak = ref<any>(null)

// Flash Cards state
const knownCards = ref<string[]>([])
const unknownCards = ref<string[]>([])

onMounted(async () => {
  await loadUserStreak()

  // Check if there's a mode parameter in the URL
  const urlMode = route.query.mode as string
  if (urlMode === 'flashcards') {
    await startFlashCards()
  } else if (urlMode === 'express') {
    await startQuizExpress()
  } else if (urlMode === 'daily') {
    await startDailyChallenge()
  }
})

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
  loading.value = true
  try {
    // Get random questions from user's completed quizzes
    const allQuestions = await quizzesService.getAllQuestions(user.value!.id)

    // Shuffle and take 20 questions
    questions.value = shuffleArray(allQuestions).slice(0, 20)
    currentIndex.value = 0
    showAnswer.value = false
    knownCards.value = []
    unknownCards.value = []
    mode.value = 'flashcards'
  } catch (error) {
    console.error('Error loading questions:', error)
    alert('Error al cargar las preguntas. Asegúrate de haber completado al menos un quiz.')
  } finally {
    loading.value = false
  }
}

const startQuizExpress = async () => {
  loading.value = true
  try {
    // Get 5 random questions from user's documents
    const allQuestions = await quizzesService.getAllQuestions(user.value!.id)

    questions.value = shuffleArray(allQuestions).slice(0, 5)
    currentIndex.value = 0
    userAnswers.value = {}
    showResults.value = false
    mode.value = 'express'
  } catch (error) {
    console.error('Error loading questions:', error)
    alert('Error al cargar las preguntas. Asegúrate de haber completado al menos un quiz.')
  } finally {
    loading.value = false
  }
}

const startDailyChallenge = async () => {
  loading.value = true
  try {
    // TODO: Load daily challenge from API
    // For now, use random questions
    const allQuestions = await quizzesService.getAllQuestions(user.value!.id)

    questions.value = shuffleArray(allQuestions).slice(0, 10)
    currentIndex.value = 0
    userAnswers.value = {}
    showResults.value = false
    mode.value = 'daily'

    dailyChallenge.value = {
      challenge_date: new Date().toISOString().split('T')[0],
      difficulty: 'medium'
    }
  } catch (error) {
    console.error('Error loading daily challenge:', error)
    alert('Error al cargar el desafío diario. Asegúrate de haber completado al menos un quiz.')
  } finally {
    loading.value = false
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

const previousCard = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    showAnswer.value = false
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
  if (mode.value === 'daily') {
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
  mode.value = 'menu'
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
</script>

<template>
  <AppLayout>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <!-- Menu -->
      <div v-if="mode === 'menu'" class="space-y-6">
        <div class="text-center mb-8">
          <h1 class="text-3xl sm:text-4xl font-bold mb-3">⚡ Práctica Rápida</h1>
          <p class="text-gray-600">Elige tu modo de estudio favorito</p>
        </div>

        <!-- User Streak Display -->
        <div v-if="userStreak" class="card bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-orange-900">🔥 Racha actual</h3>
              <p class="text-3xl font-bold text-orange-600">{{ userStreak.current_streak }} días</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-600">Mejor racha</p>
              <p class="text-xl font-bold text-gray-900">{{ userStreak.longest_streak }} días</p>
            </div>
          </div>
        </div>

        <!-- Practice Modes -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <!-- Flash Cards -->
          <button
            @click="startFlashCards"
            :disabled="loading"
            class="card hover:shadow-xl transition-all text-left p-6 border-2 hover:border-blue-300"
          >
            <div class="text-4xl mb-4">🎴</div>
            <h3 class="text-xl font-bold mb-2">Flash Cards</h3>
            <p class="text-sm text-gray-600 mb-4">
              Repasa conceptos con tarjetas interactivas. Marca las que conoces y las que necesitas repasar.
            </p>
            <div class="flex items-center space-x-2 text-sm text-gray-500">
              <span>📊</span>
              <span>20 tarjetas</span>
            </div>
          </button>

          <!-- Quiz Express -->
          <button
            @click="startQuizExpress"
            :disabled="loading"
            class="card hover:shadow-xl transition-all text-left p-6 border-2 hover:border-green-300"
          >
            <div class="text-4xl mb-4">⚡</div>
            <h3 class="text-xl font-bold mb-2">Quiz Express</h3>
            <p class="text-sm text-gray-600 mb-4">
              Quiz rápido de 5 preguntas. Perfecto para una sesión corta de estudio.
            </p>
            <div class="flex items-center space-x-2 text-sm text-gray-500">
              <span>⏱️</span>
              <span>2-3 minutos</span>
            </div>
          </button>

          <!-- Daily Challenge -->
          <button
            @click="startDailyChallenge"
            :disabled="loading"
            class="card hover:shadow-xl transition-all text-left p-6 border-2 hover:border-purple-300 relative overflow-hidden"
          >
            <div class="absolute top-2 right-2 bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full">
              HOY
            </div>
            <div class="text-4xl mb-4">🌟</div>
            <h3 class="text-xl font-bold mb-2">Desafío Diario</h3>
            <p class="text-sm text-gray-600 mb-4">
              Completa el quiz del día y mantén tu racha activa. ¡10 preguntas nuevas cada día!
            </p>
            <div class="flex items-center space-x-2 text-sm text-gray-500">
              <span>🔥</span>
              <span>Mantén tu racha</span>
            </div>
          </button>
        </div>

        <div v-if="loading" class="text-center py-12">
          <p class="text-gray-600">Preparando preguntas...</p>
        </div>
      </div>

      <!-- Flash Cards Mode -->
      <div v-else-if="mode === 'flashcards' && !showResults" class="space-y-6">
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
      <div v-else-if="mode === 'flashcards' && showResults" class="space-y-6">
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
              Volver al menú
            </button>
          </div>
        </div>
      </div>

      <!-- Quiz Express / Daily Challenge Mode -->
      <div v-else-if="(mode === 'express' || mode === 'daily') && !showResults" class="space-y-6">
        <div class="flex items-center justify-between mb-4">
          <button @click="backToMenu" class="btn btn-secondary">
            ← Volver
          </button>
          <div class="flex items-center space-x-3">
            <span v-if="mode === 'daily'" class="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
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
      <div v-else-if="(mode === 'express' || mode === 'daily') && showResults" class="space-y-6">
        <h1 class="text-2xl sm:text-3xl font-bold mb-6">
          {{ mode === 'daily' ? '🌟 Desafío Diario Completado' : '⚡ Quiz Express Completado' }}
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
          <div v-if="mode === 'daily' && calculateResults().percentage >= 70" class="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mb-6">
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
              Volver al menú
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
