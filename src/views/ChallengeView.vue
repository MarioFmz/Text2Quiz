<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import type { Question } from '@/types'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

const identifier = route.params.identifier as string

const loading = ref(true)
const challenge = ref<any>(null)
const quiz = ref<any>(null)
const questions = ref<Question[]>([])
const currentQuestionIndex = ref(0)
const userAnswers = ref<Record<string, string>>({})
const showResults = ref(false)
const showSummary = ref(true)
const submitting = ref(false)
const username = ref('')
const leaderboard = ref<any[]>([])
const showLeaderboard = ref(false)

onMounted(async () => {
  await loadChallenge()
})

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

const loadLeaderboard = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/challenges/${challenge.value.id}/leaderboard`)

    if (response.ok) {
      const data = await response.json()
      leaderboard.value = data.leaderboard
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

    const startTime = Date.now()
    const timeTaken = Math.floor((Date.now() - startTime) / 1000) // Simulated time

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
              :class="entry.username === username ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50'"
            >
              <div class="flex items-center space-x-3">
                <span class="text-lg font-bold min-w-[3rem]">
                  {{ getRankEmoji(index + 1) }}
                </span>
                <div>
                  <p class="font-semibold">{{ entry.username }}</p>
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
        <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 sm:p-8 text-center">
          <div class="text-4xl mb-3">🎯</div>
          <h1 class="text-2xl sm:text-3xl font-bold mb-2">Desafío de Quiz</h1>
          <p class="text-blue-100">¡Te han retado a completar este quiz!</p>
        </div>

        <div class="card">
          <div class="flex items-center space-x-3 mb-4">
            <span class="text-2xl">📚</span>
            <h2 class="text-lg sm:text-xl font-bold">{{ quiz.title }}</h2>
          </div>

          <div v-if="quiz.summary" class="prose max-w-none mb-6">
            <p class="text-sm sm:text-base text-gray-700 whitespace-pre-line">{{ quiz.summary }}</p>
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

          <!-- Username Input -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ¿Cómo te llamas?
            </label>
            <input
              v-model="username"
              type="text"
              placeholder="Tu nombre"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p class="text-xs text-gray-500 mt-2">
              Tu nombre aparecerá en el ranking
            </p>
          </div>

          <button
            @click="startQuiz"
            :disabled="!username.trim()"
            class="btn btn-primary w-full"
            :class="{ 'opacity-50 cursor-not-allowed': !username.trim() }"
          >
            Comenzar desafío
          </button>

          <!-- Current Leaderboard Preview -->
          <div v-if="leaderboard.length > 0" class="mt-6 pt-6 border-t">
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
      <div v-else-if="!showResults" class="space-y-4 sm:space-y-6">
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
                v-for="option in [
                  questions[currentQuestionIndex].option_a,
                  questions[currentQuestionIndex].option_b,
                  questions[currentQuestionIndex].option_c,
                  questions[currentQuestionIndex].option_d
                ]"
                :key="option"
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
