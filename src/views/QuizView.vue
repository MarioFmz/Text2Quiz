<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import ShareQuizButton from '@/components/ShareQuizButton.vue'
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { quizzesService } from '@/services/quizzesService'
import type { Question } from '@/types'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

const quizId = route.params.id as string

const quiz = ref<any>(null)
const questions = ref<Question[]>([])
const currentQuestionIndex = ref(0)
const userAnswers = ref<Record<string, string>>({})
const showResults = ref(false)
const showSummary = ref(true) // Mostrar resumen al inicio
const loading = ref(true)
const submitting = ref(false)
const previousAttempts = ref<any[]>([])
const quizStartTime = ref<number>(0)
const quizTimeTaken = ref<number>(0)

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value])
const progress = computed(() => ((currentQuestionIndex.value + 1) / questions.value.length) * 100)
const isLastQuestion = computed(() => currentQuestionIndex.value === questions.value.length - 1)

onMounted(async () => {
  try {
    const data = await quizzesService.getQuizWithQuestions(quizId)
    quiz.value = data
    questions.value = data.questions

    // Cargar intentos previos si el usuario está autenticado
    if (user.value) {
      previousAttempts.value = await quizzesService.getQuizAttempts(user.value.id, quizId)
    }
  } catch (error) {
    console.error('Error loading quiz:', error)
  } finally {
    loading.value = false
  }
})

const selectAnswer = (answer: string) => {
  if (!currentQuestion.value) return
  userAnswers.value[currentQuestion.value.id] = answer
}

const nextQuestion = () => {
  if (!isLastQuestion.value) {
    currentQuestionIndex.value++
  }
}

const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

const submitQuiz = async () => {
  if (!user.value) return

  submitting.value = true
  try {
    // Calcular tiempo tomado
    if (quizStartTime.value > 0) {
      quizTimeTaken.value = Math.floor((Date.now() - quizStartTime.value) / 1000)
    }

    // Guardar respuestas
    for (const question of questions.value) {
      const selectedAnswer = userAnswers.value[question.id]
      if (selectedAnswer) {
        await quizzesService.saveUserAnswer(
          user.value.id,
          quizId,
          question.id,
          selectedAnswer,
          question.correct_answer
        )
      }
    }

    // Calcular puntuación
    const correctCount = questions.value.filter(
      q => userAnswers.value[q.id] === q.correct_answer
    ).length

    // Guardar progreso
    await quizzesService.saveProgress(
      user.value.id,
      quiz.value.document_id,
      quizId,
      correctCount,
      questions.value.length
    )

    showResults.value = true
  } catch (error) {
    console.error('Error submitting quiz:', error)
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
  showSummary.value = true // Volver a mostrar el resumen
}

const goToDocuments = () => {
  router.push('/documents')
}

const startQuiz = () => {
  showSummary.value = false
  quizStartTime.value = Date.now()
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
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Cargando quiz...</p>
      </div>

      <!-- Results View -->
      <div v-else-if="showResults" class="space-y-4 sm:space-y-6">
        <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-8">Resultados</h1>

        <div class="card text-center">
          <div class="text-4xl sm:text-6xl mb-4">
            {{ calculateResults().percentage >= 70 ? '🎉' : '📚' }}
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold mb-2">
            {{ calculateResults().percentage }}%
          </h2>
          <p class="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
            {{ calculateResults().correct }} de {{ questions.length }} respuestas correctas
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
            <button @click="restartQuiz" class="btn btn-secondary w-full sm:w-auto">
              Reintentar
            </button>
            <ShareQuizButton
              v-if="quiz && user"
              :quiz-id="quiz.id"
              :quiz-title="quiz.title"
              :creator-id="user.id"
              :creator-username="user.email?.split('@')[0] || 'Usuario'"
              :creator-score="calculateResults().correct"
              :total-questions="questions.length"
              :time-taken="quizTimeTaken"
            />
            <button @click="goToDocuments" class="btn btn-primary w-full sm:w-auto">
              Ver documentos
            </button>
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
        <div class="text-center mb-6 sm:mb-8">
          <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 px-2">{{ quiz.title }}</h1>
          <p class="text-sm sm:text-base text-gray-600">Preparación para el quiz</p>
        </div>

        <div class="card">
          <div class="flex items-center space-x-3 mb-4 sm:mb-6">
            <span class="text-2xl sm:text-3xl">📚</span>
            <h2 class="text-lg sm:text-xl md:text-2xl font-bold">Conceptos clave</h2>
          </div>

          <div class="prose max-w-none mb-6 sm:mb-8">
            <p class="text-sm sm:text-base text-gray-700 whitespace-pre-line">{{ quiz.summary || 'Repasa los conceptos principales antes de comenzar el quiz.' }}</p>
          </div>

          <div class="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8 p-3 sm:p-6 bg-gray-50 rounded-lg">
            <div class="text-center">
              <div class="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{{ questions.length }}</div>
              <div class="text-xs sm:text-sm text-gray-600">Preguntas</div>
            </div>
            <div class="text-center">
              <div class="text-base sm:text-xl md:text-3xl font-bold text-gray-900">{{ quiz.difficulty === 'easy' ? 'Fácil' : quiz.difficulty === 'medium' ? 'Medio' : 'Difícil' }}</div>
              <div class="text-xs sm:text-sm text-gray-600">Dificultad</div>
            </div>
            <div class="text-center">
              <div class="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">~{{ Math.ceil(questions.length * 1.5) }} min</div>
              <div class="text-xs sm:text-sm text-gray-600">Tiempo</div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <button @click="goToDocuments" class="btn btn-secondary w-full sm:w-auto order-3 sm:order-1">
              Volver
            </button>
            <ShareQuizButton
              v-if="quiz && user && previousAttempts.length > 0"
              :quiz-id="quiz.id"
              :quiz-title="quiz.title"
              :creator-id="user.id"
              :creator-username="user.email?.split('@')[0] || 'Usuario'"
              :creator-score="previousAttempts[0]?.score"
              :total-questions="questions.length"
              :time-taken="previousAttempts[0]?.time_taken"
              class="order-2 sm:order-2"
            />
            <button @click="startQuiz" class="btn btn-primary w-full sm:w-auto order-1 sm:order-3">
              Comenzar quiz
            </button>
          </div>
        </div>

        <!-- Previous Attempts -->
        <div v-if="previousAttempts.length > 0" class="card">
          <div class="flex items-center space-x-3 mb-4">
            <span class="text-xl sm:text-2xl">📊</span>
            <h2 class="text-base sm:text-lg md:text-xl font-bold">Intentos anteriores</h2>
          </div>

          <div class="space-y-3">
            <div
              v-for="(attempt, index) in previousAttempts"
              :key="attempt.id"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center space-x-4">
                <div class="text-center">
                  <div class="text-2xl font-bold" :class="attempt.score / attempt.total_questions >= 0.7 ? 'text-green-600' : 'text-orange-600'">
                    {{ Math.round((attempt.score / attempt.total_questions) * 100) }}%
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ attempt.score }}/{{ attempt.total_questions }}
                  </div>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-900">
                    Intento #{{ previousAttempts.length - index }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ formatDate(attempt.completed_at) }}
                  </div>
                </div>
              </div>
              <div class="text-2xl">
                {{ attempt.score / attempt.total_questions >= 0.9 ? '🏆' : attempt.score / attempt.total_questions >= 0.7 ? '✅' : '📝' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quiz View -->
      <div v-else>
        <div class="mb-8">
          <h1 class="text-3xl font-bold mb-2">{{ quiz?.title }}</h1>
          <p class="text-gray-600">
            Pregunta {{ currentQuestionIndex + 1 }} de {{ questions.length }}
          </p>
        </div>

        <!-- Progress bar -->
        <div class="mb-8 bg-gray-200 rounded-full h-2">
          <div
            class="bg-gray-900 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>

        <!-- Question -->
        <div v-if="currentQuestion" class="card mb-6">
          <h2 class="text-xl font-semibold mb-6">
            {{ currentQuestion.question_text }}
          </h2>

          <div class="space-y-3">
            <button
              v-for="option in currentQuestion.options"
              :key="option"
              @click="selectAnswer(option)"
              :class="[
                'w-full text-left p-4 rounded-lg border-2 transition-all',
                userAnswers[currentQuestion.id] === option
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              ]"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <!-- Navigation -->
        <div class="flex justify-between">
          <button
            @click="previousQuestion"
            :disabled="currentQuestionIndex === 0"
            class="btn btn-secondary"
            :class="{ 'opacity-50 cursor-not-allowed': currentQuestionIndex === 0 }"
          >
            Anterior
          </button>

          <button
            v-if="!isLastQuestion"
            @click="nextQuestion"
            :disabled="!userAnswers[currentQuestion?.id]"
            class="btn btn-primary"
            :class="{ 'opacity-50 cursor-not-allowed': !userAnswers[currentQuestion?.id] }"
          >
            Siguiente
          </button>

          <button
            v-else
            @click="submitQuiz"
            :disabled="!userAnswers[currentQuestion?.id] || submitting"
            class="btn btn-primary"
            :class="{ 'opacity-50 cursor-not-allowed': !userAnswers[currentQuestion?.id] || submitting }"
          >
            {{ submitting ? 'Enviando...' : 'Finalizar' }}
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
