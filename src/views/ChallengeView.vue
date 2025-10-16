<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { documentsService } from '@/services/documentsService'
import type { Question } from '@/types'
// @ts-ignore
import Confetti from '@/utils/confetti.js'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

const identifier = route.params.identifier as string

const loading = ref(true)
const challenge = ref<any>(null)
const quiz = ref<any>(null)
const questions = ref<Question[]>([])
const documents = ref<any[]>([])
const currentQuestionIndex = ref(0)
const userAnswers = ref<Record<string, string>>({})
const showResults = ref(false)
const showSummary = ref(true)
const submitting = ref(false)
const username = ref('')
const leaderboard = ref<any[]>([])
const showLeaderboard = ref(false)
const creatorAttempt = ref<any>(null)
const quizStartTime = ref<number>(0)
const isCreator = ref(false)

// Computed property to check if user has already completed this challenge
const hasCompletedBefore = computed(() => {
  if (!user.value) return false
  return leaderboard.value.some(entry => entry.user_id === user.value.id)
})

// Computed property for button text
const startButtonText = computed(() => {
  if (isCreator.value) return 'Reintentar desafío'
  if (hasCompletedBefore.value) return 'Reintentar'
  return 'Comenzar desafío'
})

onMounted(async () => {
  // Verificar autenticación
  if (!user.value) {
    // Guardar la URL actual para redirigir después del login
    const currentPath = route.fullPath
    router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
    return
  }

  // Cargar perfil del usuario y auto-rellenar username
  await loadUserProfile()

  await loadChallenge()
})

const loadUserProfile = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/profile/${user.value?.id}`)

    if (response.ok) {
      const data = await response.json()
      if (data.profile && data.profile.display_name) {
        username.value = data.profile.display_name
      } else if (user.value?.email) {
        // Fallback al email si no hay display_name
        username.value = user.value.email.split('@')[0]
      }
    } else if (user.value?.email) {
      // Si no hay perfil, usar email
      username.value = user.value.email.split('@')[0]
    }
  } catch (err) {
    console.error('Error loading profile:', err)
    // Fallback al email en caso de error
    if (user.value?.email) {
      username.value = user.value.email.split('@')[0]
    }
  }
}

const loadChallenge = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/challenges/${identifier}`)

    if (!response.ok) {
      throw new Error('Desafío no encontrado')
    }

    const data = await response.json()
    challenge.value = data.challenge
    quiz.value = data.quiz
    questions.value = data.questions
    documents.value = data.documents || []

    // Verificar si el usuario actual es el creador
    if (user.value && challenge.value.creator_id === user.value.id) {
      isCreator.value = true
    }

    // Load leaderboard
    await loadLeaderboard()
  } catch (error) {
    console.error('Error loading challenge:', error)
    alert('No se pudo cargar el desafío')
    router.push('/')
  } finally {
    loading.value = false
  }
}

const viewDocument = async (filePath: string) => {
  try {
    const signedUrl = await documentsService.getSignedUrl(filePath)
    window.open(signedUrl, '_blank')
  } catch (error) {
    console.error('Error opening document:', error)
    alert('No se pudo abrir el documento')
  }
}

const loadLeaderboard = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/challenges/${challenge.value.id}/leaderboard`)

    if (response.ok) {
      const data = await response.json()
      leaderboard.value = data.leaderboard

      // Encontrar el intento del creador
      creatorAttempt.value = leaderboard.value.find((attempt: any) => attempt.is_creator)
    }
  } catch (error) {
    console.error('Error loading leaderboard:', error)
  }
}

const selectAnswer = (questionId: string, answer: string) => {
  userAnswers.value[questionId] = answer
}

const nextQuestion = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
  }
}

const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

const submitQuiz = async () => {
  if (!username.value.trim()) {
    alert('Por favor, ingresa tu nombre para guardar tu puntuación')
    return
  }

  submitting.value = true
  try {
    const correctCount = questions.value.filter(
      q => userAnswers.value[q.id] === q.correct_answer
    ).length

    // Calcular tiempo tomado desde el inicio del quiz
    const timeTaken = quizStartTime.value > 0
      ? Math.floor((Date.now() - quizStartTime.value) / 1000)
      : 0

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    await fetch(`${apiUrl}/api/challenges/${challenge.value.id}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.value?.id || null,
        username: username.value,
        score: correctCount,
        totalQuestions: questions.value.length,
        timeTaken
      })
    })

    await loadLeaderboard()
    showResults.value = true

    // Confeti si el resultado es 100%
    const percentage = Math.round((correctCount / questions.value.length) * 100)
    if (percentage === 100) {
      setTimeout(() => {
        triggerConfetti()
      }, 300)
    }
  } catch (error) {
    console.error('Error submitting quiz:', error)
    alert('Error al enviar el quiz')
  } finally {
    submitting.value = false
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

const restartQuiz = () => {
  userAnswers.value = {}
  currentQuestionIndex.value = 0
  showResults.value = false
  showSummary.value = true
}

const startQuiz = () => {
  showSummary.value = false
  quizStartTime.value = Date.now()
}

const toggleLeaderboard = () => {
  showLeaderboard.value = !showLeaderboard.value
}

const getRankEmoji = (rank: number) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

const triggerConfetti = () => {
  // Crear múltiples explosiones de confeti
  const positions = [
    { x: window.innerWidth * 0.25, y: window.innerHeight * 0.3 },
    { x: window.innerWidth * 0.5, y: window.innerHeight * 0.2 },
    { x: window.innerWidth * 0.75, y: window.innerHeight * 0.3 }
  ]

  positions.forEach((pos, index) => {
    setTimeout(() => {
      // Crear un elemento temporal para el confeti
      const confettiElement = document.createElement('div')
      confettiElement.id = `confetti-trigger-${index}`
      confettiElement.style.position = 'fixed'
      confettiElement.style.left = `${pos.x}px`
      confettiElement.style.top = `${pos.y}px`
      confettiElement.style.width = '1px'
      confettiElement.style.height = '1px'
      confettiElement.style.pointerEvents = 'none'
      document.body.appendChild(confettiElement)

      // Disparar el confeti
      const confetti = new Confetti(`confetti-trigger-${index}`)
      confetti.setCount(75)
      confetti.setSize(1.5)
      confetti.setPower(30)
      confetti.setFade(true)
      confetti.destroyTarget(false)

      // Simular click para disparar el confeti
      const event = new MouseEvent('click', {
        clientX: pos.x,
        clientY: pos.y,
        bubbles: true
      })
      confettiElement.dispatchEvent(event)

      // Limpiar el elemento después de un tiempo
      setTimeout(() => {
        confettiElement.remove()
      }, 5000)
    }, index * 150)
  })
}
</script>

<template>
  <AppLayout>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Cargando desafío...</p>
      </div>

      <!-- Results View -->
      <div v-else-if="showResults" class="space-y-4 sm:space-y-6">
        <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-8">🏆 Resultados</h1>

        <div class="card text-center">
          <div class="text-4xl sm:text-6xl mb-4">
            {{ calculateResults().percentage >= 90 ? '🏆' : calculateResults().percentage >= 70 ? '🎉' : '📚' }}
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold mb-2">
            {{ calculateResults().percentage }}%
          </h2>
          <p class="text-sm sm:text-base text-gray-600 mb-2">
            {{ calculateResults().correct }} de {{ questions.length }} respuestas correctas
          </p>
          <p class="text-xs sm:text-sm text-gray-500 mb-6">
            Participante: <strong>{{ username }}</strong>
          </p>

          <div class="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div class="p-3 sm:p-4 bg-green-50 rounded-lg">
              <div class="text-xl sm:text-2xl font-bold text-green-700">{{ calculateResults().correct }}</div>
              <div class="text-xs sm:text-sm text-green-600">Correctas</div>
            </div>
            <div class="p-3 sm:p-4 bg-red-50 rounded-lg">
              <div class="text-xl sm:text-2xl font-bold text-red-700">{{ calculateResults().incorrect }}</div>
              <div class="text-xs sm:text-sm text-red-600">Incorrectas</div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <button @click="toggleLeaderboard" class="btn btn-primary w-full sm:w-auto">
              {{ showLeaderboard ? 'Ocultar' : 'Ver' }} Ranking
            </button>
            <button @click="restartQuiz" class="btn btn-secondary w-full sm:w-auto">
              Reintentar
            </button>
          </div>
        </div>

        <!-- Leaderboard -->
        <div v-if="showLeaderboard && leaderboard.length > 0" class="card">
          <h3 class="text-xl font-bold mb-4 flex items-center space-x-2">
            <span>🏆</span>
            <span>Ranking</span>
          </h3>
          <div class="space-y-2">
            <div
              v-for="(entry, index) in leaderboard"
              :key="entry.id"
              class="flex items-center justify-between p-3 rounded-lg"
              :class="[
                entry.username === username ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50',
                entry.is_creator ? 'border-2 border-orange-300' : ''
              ]"
            >
              <div class="flex items-center space-x-3">
                <span class="text-lg font-bold min-w-[3rem]">
                  {{ getRankEmoji(index + 1) }}
                </span>
                <div>
                  <div class="flex items-center space-x-2">
                    <p class="font-semibold">{{ entry.username }}</p>
                    <span v-if="entry.is_creator" class="text-lg" title="Creador del desafío">👑</span>
                  </div>
                  <p class="text-xs text-gray-500">{{ entry.time_taken }}s</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-lg font-bold">{{ entry.percentage }}%</p>
                <p class="text-xs text-gray-500">{{ entry.score }}/{{ entry.total_questions }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Revisión de respuestas -->
        <div class="space-y-4">
          <h3 class="text-2xl font-bold">Revisión de respuestas</h3>
          <div v-for="(question, index) in questions" :key="question.id" class="card">
            <div class="flex items-start space-x-3 mb-4">
              <span class="text-2xl">
                {{ userAnswers[question.id] === question.correct_answer ? '✅' : '❌' }}
              </span>
              <div class="flex-1">
                <p class="font-semibold mb-2">{{ index + 1 }}. {{ question.question_text }}</p>
                <p class="text-sm text-gray-600 mb-2">
                  <strong>Tu respuesta:</strong> {{ userAnswers[question.id] || 'Sin responder' }}
                </p>
                <p class="text-sm text-green-700 mb-2">
                  <strong>Respuesta correcta:</strong> {{ question.correct_answer }}
                </p>
                <p v-if="question.explanation" class="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                  {{ question.explanation }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary View -->
      <div v-else-if="showSummary && quiz" class="space-y-4 sm:space-y-6">
        <!-- Creator View Header -->
        <div v-if="isCreator" class="bg-gradient-to-r from-orange-500 to-yellow-600 text-white rounded-lg p-6 sm:p-8 text-center">
          <div class="text-4xl mb-3">👑</div>
          <h1 class="text-2xl sm:text-3xl font-bold mb-2">Tu Desafío</h1>
          <p class="text-orange-100">Esta es la vista de estadísticas de tu desafío</p>
        </div>

        <!-- Participant View Header -->
        <div v-else class="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 sm:p-8 text-center">
          <div class="text-4xl mb-3">🎯</div>
          <h1 class="text-2xl sm:text-3xl font-bold mb-2">Desafío de Quiz</h1>
          <p class="text-blue-100">¡Te han retado a completar este quiz!</p>
        </div>

        <div class="card">
          <div class="flex items-center space-x-3 mb-4">
            <span class="text-2xl">📚</span>
            <h2 class="text-lg sm:text-xl font-bold">{{ quiz.title }}</h2>
          </div>

          <div v-if="quiz.summary" class="mb-6">
            <h3 class="text-sm font-semibold text-gray-900 mb-2">📋 Resumen</h3>
            <p class="text-sm sm:text-base text-gray-700 whitespace-pre-line">{{ quiz.summary }}</p>
          </div>

          <!-- Document Links -->
          <div v-if="documents.length > 0" class="mb-6">
            <h3 class="text-sm font-semibold text-gray-900 mb-2">📄 Documentos de referencia</h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="doc in documents"
                :key="doc.id"
                @click="viewDocument(doc.file_url)"
                class="btn btn-secondary text-xs sm:text-sm flex items-center space-x-1"
              >
                <span>📎</span>
                <span>{{ doc.title }}</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 sm:gap-4 mb-6 p-3 sm:p-6 bg-gray-50 rounded-lg">
            <div class="text-center">
              <div class="text-xl sm:text-2xl font-bold text-gray-900">{{ questions.length }}</div>
              <div class="text-xs sm:text-sm text-gray-600">Preguntas</div>
            </div>
            <div class="text-center">
              <div class="text-base sm:text-xl font-bold text-gray-900">
                {{ quiz.difficulty === 'easy' ? 'Fácil' : quiz.difficulty === 'medium' ? 'Medio' : 'Difícil' }}
              </div>
              <div class="text-xs sm:text-sm text-gray-600">Dificultad</div>
            </div>
            <div class="text-center">
              <div class="text-xl sm:text-2xl font-bold text-gray-900">{{ challenge.participants_count }}</div>
              <div class="text-xs sm:text-sm text-gray-600">Participantes</div>
            </div>
          </div>

          <!-- Start Quiz Button - For everyone -->
          <div>
            <button
              @click="startQuiz"
              :disabled="!username.trim()"
              class="btn btn-primary w-full"
              :class="{ 'opacity-50 cursor-not-allowed': !username.trim() }"
            >
              {{ startButtonText }}
            </button>
            <p v-if="username" class="text-xs text-gray-500 mt-2 text-center">
              Participando como: <strong>{{ username }}</strong>
            </p>
          </div>
        </div>

        <!-- Creator Challenge Banner -->
        <div v-if="creatorAttempt" class="card bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-2 mb-2">
                <span class="text-2xl">👑</span>
                <h3 class="text-lg font-bold text-orange-900">Desafío del Creador</h3>
              </div>
              <p class="text-sm text-gray-700 mb-1">
                <strong>{{ creatorAttempt.username }}</strong> completó este quiz con:
              </p>
              <div class="flex items-center space-x-4 mt-2">
                <div>
                  <span class="text-2xl font-bold text-orange-600">{{ creatorAttempt.percentage }}%</span>
                  <span class="text-xs text-gray-600 ml-1">
                    ({{ creatorAttempt.score }}/{{ creatorAttempt.total_questions }})
                  </span>
                </div>
                <div class="text-sm text-gray-600">
                  ⏱️ {{ Math.floor(creatorAttempt.time_taken / 60) }}:{{ (creatorAttempt.time_taken % 60).toString().padStart(2, '0') }} min
                </div>
              </div>
            </div>
            <div class="text-center ml-4">
              <div class="text-4xl">
                {{ creatorAttempt.percentage >= 90 ? '🏆' : creatorAttempt.percentage >= 70 ? '🎯' : '📚' }}
              </div>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-orange-200">
            <p class="text-sm font-semibold text-orange-800 text-center">
              ¿Puedes superarlo?
            </p>
          </div>
        </div>

        <div class="card">
          <!-- Current Leaderboard Preview -->
          <div v-if="leaderboard.length > 0">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">🏆 Top 3 actual</h3>
            <div class="space-y-2">
              <div
                v-for="(entry, index) in leaderboard.slice(0, 3)"
                :key="entry.id"
                class="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
              >
                <div class="flex items-center space-x-2">
                  <span>{{ getRankEmoji(index + 1) }}</span>
                  <span>{{ entry.username }}</span>
                </div>
                <span class="font-semibold">{{ entry.percentage }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quiz View -->
      <div v-else-if="!showResults && quiz" class="space-y-4 sm:space-y-6">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-xl sm:text-2xl font-bold">{{ quiz.title }}</h1>
          <span class="text-sm text-gray-600">
            {{ currentQuestionIndex + 1 }} / {{ questions.length }}
          </span>
        </div>

        <div class="card">
          <div class="mb-6">
            <h2 class="text-base sm:text-lg font-semibold mb-4">
              {{ questions[currentQuestionIndex].question_text }}
            </h2>

            <div class="space-y-2 sm:space-y-3">
              <button
                v-for="(option, index) in questions[currentQuestionIndex].options"
                :key="index"
                @click="selectAnswer(questions[currentQuestionIndex].id, option)"
                class="w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all text-sm sm:text-base"
                :class="
                  userAnswers[questions[currentQuestionIndex].id] === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                "
              >
                {{ option }}
              </button>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row justify-between gap-3">
            <button
              @click="previousQuestion"
              :disabled="currentQuestionIndex === 0"
              class="btn btn-secondary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>

            <button
              v-if="currentQuestionIndex < questions.length - 1"
              @click="nextQuestion"
              class="btn btn-primary w-full sm:w-auto"
            >
              Siguiente →
            </button>

            <button
              v-else
              @click="submitQuiz"
              :disabled="submitting || Object.keys(userAnswers).length !== questions.length"
              class="btn btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ submitting ? 'Enviando...' : 'Finalizar' }}
            </button>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="bg-gray-200 rounded-full h-2">
          <div
            class="bg-blue-500 h-2 rounded-full transition-all"
            :style="{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }"
          ></div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
