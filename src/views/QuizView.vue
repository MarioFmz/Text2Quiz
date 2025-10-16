<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import ShareQuizButton from '@/components/ShareQuizButton.vue'
import ShareResultsButtons from '@/components/ShareResultsButtons.vue'
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { quizzesService } from '@/services/quizzesService'
import { updateQuizVisibility, getCategories } from '@/services/publicQuizzesService'
import type { Question, QuizCategory } from '@/types'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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
const expandedAttemptId = ref<string | null>(null)
const attemptAnswers = ref<Record<string, any>>({})
const loadingAttempt = ref<string | null>(null)
const showStudyMaterial = ref(false)

// Global leaderboard
const globalLeaderboard = ref<any[]>([])
const loadingLeaderboard = ref(false)

// Edit visibility modal
const showEditModal = ref(false)
const editingVisibility = ref(false)
const selectedVisibility = ref<'private' | 'public' | 'unlisted'>('private')
const selectedCategory = ref('')
const quizTags = ref<string[]>([])
const quizSource = ref('')
const tagInput = ref('')
const categories = ref<QuizCategory[]>([])

// Delete confirmation
const showDeleteConfirm = ref(false)
const deleting = ref(false)

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

    // Cargar categorías para el selector
    categories.value = await getCategories()

    // Cargar leaderboard global si el quiz tiene global_challenge_id
    if (quiz.value.global_challenge_id) {
      await loadGlobalLeaderboard()
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

    // Guardar automáticamente en el global challenge si existe
    if (quiz.value.global_challenge_id) {
      try {
        await axios.post(
          `${API_URL}/api/challenges/${quiz.value.global_challenge_id}/attempt`,
          {
            userId: user.value.id,
            username: user.value.email?.split('@')[0] || 'Usuario',
            score: correctCount,
            totalQuestions: questions.value.length,
            timeTaken: quizTimeTaken.value
          }
        )
        console.log('Score saved to global leaderboard')

        // Recargar leaderboard
        await loadGlobalLeaderboard()
      } catch (error) {
        console.error('Error saving to global challenge:', error)
        // No mostrar error al usuario - el quiz se completó exitosamente
      }
    }

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

const toggleAttemptDetails = async (attemptId: string, attemptCompletedAt: string) => {
  if (expandedAttemptId.value === attemptId) {
    expandedAttemptId.value = null
    return
  }

  expandedAttemptId.value = attemptId

  // Si ya tenemos las respuestas cargadas, no volver a cargarlas
  if (attemptAnswers.value[attemptId]) return

  // Cargar las respuestas de este intento
  if (!user.value) return

  try {
    loadingAttempt.value = attemptId
    const answers = await quizzesService.getAttemptAnswers(user.value.id, quizId, attemptCompletedAt)

    // Convertir array a mapa question_id -> respuesta
    const answersMap: Record<string, any> = {}
    answers.forEach(answer => {
      answersMap[answer.question_id] = answer
    })

    attemptAnswers.value[attemptId] = answersMap
  } catch (error) {
    console.error('Error loading attempt answers:', error)
  } finally {
    loadingAttempt.value = null
  }
}

const getQuestionForId = (questionId: string) => {
  return questions.value.find(q => q.id === questionId)
}

// Check if current user is the owner
const isOwner = computed(() => {
  return user.value && quiz.value && user.value.id === quiz.value.user_id
})

// Edit visibility functions
const openEditModal = () => {
  if (!quiz.value) return

  // Cargar valores actuales
  selectedVisibility.value = quiz.value.visibility || 'private'
  selectedCategory.value = quiz.value.category_id || ''
  quizTags.value = quiz.value.tags || []
  quizSource.value = quiz.value.source || ''

  showEditModal.value = true
}

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !quizTags.value.includes(tag)) {
    quizTags.value.push(tag)
    tagInput.value = ''
  }
}

const removeTag = (tag: string) => {
  quizTags.value = quizTags.value.filter(t => t !== tag)
}

const saveVisibilityChanges = async () => {
  if (!user.value || !quiz.value) return

  editingVisibility.value = true
  try {
    const updateData: any = {
      visibility: selectedVisibility.value
    }

    // Si es público, incluir campos adicionales
    if (selectedVisibility.value === 'public') {
      updateData.category_id = selectedCategory.value
      updateData.tags = quizTags.value
      updateData.source = quizSource.value
    }

    await updateQuizVisibility(quiz.value.id, user.value.id, updateData)

    // Actualizar el quiz local
    quiz.value.visibility = selectedVisibility.value
    if (selectedVisibility.value === 'public') {
      quiz.value.category_id = selectedCategory.value
      quiz.value.tags = quizTags.value
      quiz.value.source = quizSource.value
    }

    showEditModal.value = false
    alert('Quiz actualizado correctamente')
  } catch (error) {
    console.error('Error updating quiz:', error)
    alert('Error al actualizar el quiz')
  } finally {
    editingVisibility.value = false
  }
}

// Delete quiz functions
const confirmDelete = () => {
  showDeleteConfirm.value = true
}

const deleteQuiz = async () => {
  if (!user.value || !quiz.value) return

  deleting.value = true
  try {
    await axios.delete(`${API_URL}/api/quizzes/${quiz.value.id}`, {
      headers: {
        'user-id': user.value.id
      }
    })

    alert('Quiz eliminado correctamente')
    router.push('/quizzes')
  } catch (error) {
    console.error('Error deleting quiz:', error)
    alert('Error al eliminar el quiz')
  } finally {
    deleting.value = false
    showDeleteConfirm.value = false
  }
}

// Load global leaderboard
const loadGlobalLeaderboard = async () => {
  if (!quiz.value?.global_challenge_id) return

  loadingLeaderboard.value = true
  try {
    const response = await axios.get(
      `${API_URL}/api/challenges/${quiz.value.global_challenge_id}/leaderboard`
    )
    globalLeaderboard.value = response.data.leaderboard || []
  } catch (error) {
    console.error('Error loading global leaderboard:', error)
    globalLeaderboard.value = []
  } finally {
    loadingLeaderboard.value = false
  }
}
</script>

<template>
  <AppLayout>
    <div class="max-w-4xl mx-auto px-3 py-4 sm:px-6 lg:px-8 sm:py-8">
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

        <!-- Share Results on Social Media -->
        <ShareResultsButtons
          v-if="quiz && user"
          :quiz-id="quiz.id"
          :quiz-title="quiz.title"
          :score="calculateResults().correct"
          :total-questions="questions.length"
          :percentage="calculateResults().percentage"
          :creator-id="user.id"
          :creator-username="user.email?.split('@')[0] || 'Usuario'"
          :time-taken="quizTimeTaken"
        />

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

          <!-- Study Material Section (if combined_content exists) -->
          <div v-if="quiz.combined_content" class="mb-6 sm:mb-8">
            <button
              @click="showStudyMaterial = !showStudyMaterial"
              class="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg transition-all duration-200 border-2 border-blue-200"
            >
              <div class="flex items-center space-x-3">
                <span class="text-2xl">📖</span>
                <div class="text-left">
                  <h3 class="font-bold text-gray-900">Material de Estudio Completo</h3>
                  <p class="text-xs sm:text-sm text-gray-600">Contenido del documento original</p>
                </div>
              </div>
              <svg
                class="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 transition-transform duration-200"
                :class="{ 'rotate-180': showStudyMaterial }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Collapsible Content -->
            <Transition name="expand">
              <div v-if="showStudyMaterial" class="mt-4 p-4 sm:p-6 bg-white border-2 border-blue-200 rounded-lg">
                <div class="prose prose-sm sm:prose max-w-none">
                  <div class="text-sm sm:text-base text-gray-800 whitespace-pre-line leading-relaxed">
                    {{ quiz.combined_content }}
                  </div>
                </div>
              </div>
            </Transition>
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

          <!-- Edit/Delete buttons for quiz owner -->
          <div v-if="isOwner" class="flex justify-center gap-3 mb-6">
            <button
              @click="openEditModal"
              class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <span>⚙️</span>
              <span>Editar privacidad</span>
            </button>
            <button
              @click="confirmDelete"
              class="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <span>🗑️</span>
              <span>Eliminar quiz</span>
            </button>
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

          <div class="space-y-4">
            <div
              v-for="(attempt, index) in previousAttempts"
              :key="attempt.id"
              class="bg-gray-50 rounded-lg overflow-hidden"
            >
              <!-- Attempt Header -->
              <div class="p-4">
                <div class="flex items-center justify-between mb-3">
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

                <!-- Action Buttons -->
                <div class="flex flex-wrap gap-2">
                  <button
                    @click="toggleAttemptDetails(attempt.id, attempt.completed_at)"
                    class="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    <span>{{ expandedAttemptId === attempt.id ? '👁️ Ocultar' : '🔍 Ver' }} detalles</span>
                  </button>
                </div>
              </div>

              <!-- Share Buttons (shown when expanded) -->
              <div v-if="expandedAttemptId === attempt.id" class="px-4 pb-2">
                <ShareResultsButtons
                  v-if="quiz && user"
                  :quiz-id="quiz.id"
                  :quiz-title="quiz.title"
                  :score="attempt.score"
                  :total-questions="attempt.total_questions"
                  :percentage="Math.round((attempt.score / attempt.total_questions) * 100)"
                  :creator-id="user.id"
                  :creator-username="user.email?.split('@')[0] || 'Usuario'"
                  :time-taken="attempt.time_taken || 0"
                />
              </div>

              <!-- Attempt Details (expandable) -->
              <Transition name="expand">
                <div v-if="expandedAttemptId === attempt.id" class="border-t border-gray-200">
                  <div v-if="loadingAttempt === attempt.id" class="p-4 text-center text-gray-600">
                    Cargando respuestas...
                  </div>
                  <div v-else-if="attemptAnswers[attempt.id]" class="p-4 space-y-3">
                    <h4 class="font-semibold text-sm mb-3">Revisión de respuestas:</h4>
                    <div
                      v-for="(question, qIndex) in questions"
                      :key="question.id"
                      class="text-sm bg-white p-3 rounded-lg"
                    >
                      <div class="flex items-start gap-2">
                        <span class="text-lg flex-shrink-0">
                          {{ attemptAnswers[attempt.id][question.id]?.is_correct ? '✅' : '❌' }}
                        </span>
                        <div class="flex-1 min-w-0">
                          <p class="font-medium mb-1">{{ qIndex + 1 }}. {{ question.question_text }}</p>
                          <p class="text-xs text-gray-600 mb-1">
                            <strong>Tu respuesta:</strong> {{ attemptAnswers[attempt.id][question.id]?.selected_answer || 'Sin responder' }}
                          </p>
                          <p class="text-xs text-green-700">
                            <strong>Respuesta correcta:</strong> {{ question.correct_answer }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <!-- Global Leaderboard -->
        <div v-if="quiz.global_challenge_id && globalLeaderboard.length > 0" class="card">
          <div class="flex items-center space-x-3 mb-4">
            <span class="text-xl sm:text-2xl">🏆</span>
            <h2 class="text-base sm:text-lg md:text-xl font-bold">Ranking Global</h2>
          </div>

          <div v-if="loadingLeaderboard" class="text-center py-4 text-gray-600">
            Cargando ranking...
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(entry, index) in globalLeaderboard.slice(0, 10)"
              :key="entry.id"
              class="flex items-center justify-between p-3 rounded-lg"
              :class="entry.user_id === user?.id ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'"
            >
              <div class="flex items-center space-x-3">
                <div class="text-center min-w-[2rem]">
                  <span class="text-lg font-bold" :class="{
                    'text-yellow-500': index === 0,
                    'text-gray-400': index === 1,
                    'text-orange-600': index === 2,
                    'text-gray-700': index > 2
                  }">
                    {{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}` }}
                  </span>
                </div>
                <div>
                  <div class="font-medium text-gray-900 flex items-center gap-2">
                    {{ entry.username }}
                    <span v-if="entry.user_id === user?.id" class="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                      Tú
                    </span>
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ Math.round((entry.score / entry.total_questions) * 100) }}% · {{ entry.score }}/{{ entry.total_questions }}
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-semibold" :class="{
                  'text-green-600': entry.score / entry.total_questions >= 0.9,
                  'text-blue-600': entry.score / entry.total_questions >= 0.7 && entry.score / entry.total_questions < 0.9,
                  'text-gray-600': entry.score / entry.total_questions < 0.7
                }">
                  {{ entry.score }} pts
                </div>
              </div>
            </div>

            <div v-if="globalLeaderboard.length > 10" class="text-center pt-2">
              <p class="text-sm text-gray-500">
                y {{ globalLeaderboard.length - 10 }} participantes más
              </p>
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

      <!-- Edit Visibility Modal -->
      <Transition name="fade">
        <div
          v-if="showEditModal"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          @click.self="showEditModal = false"
        >
          <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold">Editar configuración del quiz</h2>
              <button
                @click="showEditModal = false"
                class="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            <div class="space-y-6">
              <!-- Visibility Selector -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Visibilidad del Quiz
                </label>
                <div class="space-y-3">
                  <label class="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    :class="selectedVisibility === 'private' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'">
                    <input
                      type="radio"
                      value="private"
                      v-model="selectedVisibility"
                      class="mt-1 mr-3"
                    />
                    <div>
                      <div class="font-medium">🔒 Privado</div>
                      <div class="text-sm text-gray-600">Solo tú puedes ver y hacer este quiz</div>
                    </div>
                  </label>

                  <label class="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    :class="selectedVisibility === 'unlisted' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'">
                    <input
                      type="radio"
                      value="unlisted"
                      v-model="selectedVisibility"
                      class="mt-1 mr-3"
                    />
                    <div>
                      <div class="font-medium">🔗 No listado</div>
                      <div class="text-sm text-gray-600">Solo quienes tengan el enlace pueden acceder</div>
                    </div>
                  </label>

                  <label class="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    :class="selectedVisibility === 'public' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'">
                    <input
                      type="radio"
                      value="public"
                      v-model="selectedVisibility"
                      class="mt-1 mr-3"
                    />
                    <div>
                      <div class="font-medium">🌍 Público</div>
                      <div class="text-sm text-gray-600">Cualquiera puede encontrar y hacer este quiz</div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Public Quiz Options -->
              <div v-if="selectedVisibility === 'public'" class="space-y-4 p-4 bg-blue-50 rounded-lg">
                <h3 class="font-semibold text-blue-900">Información pública del quiz</h3>

                <!-- Category -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    v-model="selectedCategory"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    <option v-for="category in categories" :key="category.id" :value="category.id">
                      {{ category.name }}
                    </option>
                  </select>
                </div>

                <!-- Tags -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Etiquetas (para facilitar búsqueda)
                  </label>
                  <div class="flex gap-2 mb-2">
                    <input
                      v-model="tagInput"
                      @keypress.enter.prevent="addTag"
                      type="text"
                      placeholder="Ej: oposiciones, tema1, civil"
                      class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      @click="addTag"
                      type="button"
                      class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Añadir
                    </button>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="tag in quizTags"
                      :key="tag"
                      class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {{ tag }}
                      <button
                        @click="removeTag(tag)"
                        class="hover:text-blue-900"
                      >
                        &times;
                      </button>
                    </span>
                  </div>
                </div>

                <!-- Source -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Fuente (opcional)
                  </label>
                  <input
                    v-model="quizSource"
                    type="text"
                    placeholder="Ej: Examen oficial 2023, BOE Tema 15"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex justify-end gap-3 pt-4 border-t">
                <button
                  @click="showEditModal = false"
                  class="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                  :disabled="editingVisibility"
                >
                  Cancelar
                </button>
                <button
                  @click="saveVisibilityChanges"
                  class="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors font-medium"
                  :disabled="editingVisibility || (selectedVisibility === 'public' && !selectedCategory)"
                >
                  {{ editingVisibility ? 'Guardando...' : 'Guardar cambios' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Delete Confirmation Modal -->
      <Transition name="fade">
        <div
          v-if="showDeleteConfirm"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          @click.self="showDeleteConfirm = false"
        >
          <div class="bg-white rounded-lg max-w-md w-full p-6">
            <div class="text-center mb-6">
              <div class="text-5xl mb-4">⚠️</div>
              <h2 class="text-2xl font-bold mb-2">¿Eliminar quiz?</h2>
              <p class="text-gray-600">
                Esta acción no se puede deshacer. Se eliminarán todas las preguntas, respuestas y estadísticas asociadas.
              </p>
            </div>

            <div class="flex justify-end gap-3">
              <button
                @click="showDeleteConfirm = false"
                class="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                :disabled="deleting"
              >
                Cancelar
              </button>
              <button
                @click="deleteQuiz"
                class="px-6 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
                :disabled="deleting"
              >
                {{ deleting ? 'Eliminando...' : 'Eliminar definitivamente' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </AppLayout>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 1000px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
