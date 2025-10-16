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

    // Load streak
    await loadUserStreak()
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
      longest_streak: 0
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

// Computed properties for better UX
const greetingTime = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
})

const greetingEmoji = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '🌙'  // Madrugada
  if (hour < 12) return '☀️'  // Mañana
  if (hour < 18) return '🌤️'  // Tarde
  if (hour < 21) return '🌆'  // Atardecer
  return '✨'  // Noche
})

const motivationalMessage = computed(() => {
  const messages = [
    '¿Qué quieres aprender hoy?',
    'Continuemos donde lo dejaste',
    '¡Es un buen día para aprender algo nuevo!',
    'Tu conocimiento está esperando crecer',
    'Cada pregunta te acerca a tu objetivo'
  ]
  const hour = new Date().getHours()
  const day = new Date().getDay()

  // Mensajes específicos por momento del día
  if (hour < 6) return '¡Vaya! Madrugando para estudiar, eres increíble'
  if (hour < 10) return '¡Genial! La mañana es perfecta para aprender'
  if (day === 0 || day === 6) return '¡Aprovechando el fin de semana! 💪'

  // Mensaje aleatorio basado en el día del mes para variedad
  return messages[new Date().getDate() % messages.length]
})

const userName = computed(() => {
  const email = user.value?.email?.split('@')[0] || 'Usuario'
  // Capitalizar primera letra
  return email.charAt(0).toUpperCase() + email.slice(1)
})
</script>

<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto px-3 py-4 sm:px-6 lg:px-8 sm:py-8">

      <!-- ============================================ -->
      <!-- DASHBOARD VIEW (No práctica activa) -->
      <!-- ============================================ -->
      <div v-if="practiceMode === 'dashboard'">

        <!-- SALUDO PERSONALIZADO - Super Prominente -->
        <div class="mb-6 sm:mb-10">
          <div class="flex items-center gap-2 sm:gap-3 mb-2">
            <span class="text-3xl sm:text-4xl md:text-5xl">{{ greetingEmoji }}</span>
            <div>
              <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {{ greetingTime }}, {{ userName }}
              </h1>
              <p class="text-gray-600 text-sm sm:text-base md:text-lg mt-1">
                {{ motivationalMessage }}
              </p>
            </div>
          </div>
        </div>

        <!-- ============================================ -->
        <!-- ESTADO: NUEVO USUARIO (Sin quizzes) -->
        <!-- ============================================ -->
        <div v-if="!loading && stats.totalQuizzes === 0">

          <!-- HERO SECTION - Mobile First -->
          <div class="card bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-0.5 sm:p-1 mb-6 sm:mb-8">
            <div class="bg-white rounded-lg p-4 sm:p-8 md:p-12">
              <div class="text-center mb-6 sm:mb-8">
                <div class="text-5xl sm:text-6xl md:text-7xl mb-3 sm:mb-4 animate-bounce">🚀</div>
                <h2 class="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 text-gray-900 px-2">
                  ¡Bienvenido a Text2Quiz!
                </h2>
                <p class="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
                  Transforma tus apuntes en quizzes interactivos en segundos.
                  La IA hará el trabajo pesado por ti.
                </p>
              </div>

              <!-- CTA Principal - Mobile Optimized -->
              <div class="flex justify-center mb-6 sm:mb-10 px-4">
                <router-link
                  to="/create-quiz"
                  class="btn btn-primary w-full sm:w-auto text-base sm:text-lg px-6 py-4 sm:px-10 sm:py-5 transform hover:scale-105 transition-all shadow-xl hover:shadow-2xl"
                >
                  <span class="text-xl sm:text-2xl mr-2">✨</span>
                  Crear Mi Primer Quiz
                </router-link>
              </div>

              <!-- Pasos visuales - Mobile First -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
                <div class="text-center p-3 sm:p-0">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <span class="text-lg sm:text-xl font-bold text-blue-600">1</span>
                  </div>
                  <div class="text-2xl sm:text-3xl mb-1 sm:mb-2">📄</div>
                  <h3 class="font-bold mb-1 text-sm sm:text-base text-gray-900">Sube tu material</h3>
                  <p class="text-xs sm:text-sm text-gray-600">PDFs, imágenes o documentos</p>
                </div>

                <div class="text-center p-3 sm:p-0">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <span class="text-lg sm:text-xl font-bold text-purple-600">2</span>
                  </div>
                  <div class="text-2xl sm:text-3xl mb-1 sm:mb-2">🤖</div>
                  <h3 class="font-bold mb-1 text-sm sm:text-base text-gray-900">La IA trabaja</h3>
                  <p class="text-xs sm:text-sm text-gray-600">Genera preguntas automáticamente</p>
                </div>

                <div class="text-center p-3 sm:p-0">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <span class="text-lg sm:text-xl font-bold text-pink-600">3</span>
                  </div>
                  <div class="text-2xl sm:text-3xl mb-1 sm:mb-2">🎯</div>
                  <h3 class="font-bold mb-1 text-sm sm:text-base text-gray-900">Practica y domina</h3>
                  <p class="text-xs sm:text-sm text-gray-600">Aprende con feedback instantáneo</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Features Preview - Mobile First -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div class="card hover:shadow-lg transition-shadow p-4 sm:p-6">
              <div class="text-3xl sm:text-4xl mb-2 sm:mb-3">⚡</div>
              <h3 class="font-bold text-base sm:text-lg mb-1 sm:mb-2">Práctica Rápida</h3>
              <p class="text-xs sm:text-sm text-gray-600">
                Sesiones de 2-5 minutos para repasar cuando quieras
              </p>
            </div>

            <div class="card hover:shadow-lg transition-shadow p-4 sm:p-6">
              <div class="text-3xl sm:text-4xl mb-2 sm:mb-3">🔥</div>
              <h3 class="font-bold text-base sm:text-lg mb-1 sm:mb-2">Desafío Diario</h3>
              <p class="text-xs sm:text-sm text-gray-600">
                Mantén tu racha y aprende algo nuevo cada día
              </p>
            </div>

            <div class="card hover:shadow-lg transition-shadow p-4 sm:p-6">
              <div class="text-3xl sm:text-4xl mb-2 sm:mb-3">🏆</div>
              <h3 class="font-bold text-base sm:text-lg mb-1 sm:mb-2">Compite</h3>
              <p class="text-xs sm:text-sm text-gray-600">
                Comparte desafíos y reta a tus amigos
              </p>
            </div>
          </div>
        </div>

        <!-- ============================================ -->
        <!-- ESTADO: USUARIO ACTIVO (Con quizzes) -->
        <!-- ============================================ -->
        <div v-else-if="!loading && stats.totalQuizzes > 0">

          <!-- FILA PRINCIPAL: Desafío Diario + Quick Actions (2 columnas en desktop) -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-10">

            <!-- COLUMNA IZQUIERDA: Desafío Diario - Streak Focused -->
            <div class="card hover:shadow-2xl transition-all p-4 sm:p-6 bg-gradient-to-br from-orange-50 via-white to-purple-50">

              <!-- Streak como protagonista -->
              <div class="text-center mb-4">
                <div v-if="userStreak.current_streak > 0" class="inline-block">
                  <div class="text-6xl sm:text-7xl mb-2 animate-pulse">🔥</div>
                  <div class="text-4xl sm:text-5xl font-black text-orange-600 mb-1">{{ userStreak.current_streak }}</div>
                  <div class="text-sm font-bold text-orange-700 uppercase tracking-wider">Día{{ userStreak.current_streak > 1 ? 's' : '' }} de racha</div>
                  <div class="text-xs text-gray-500 mt-2">Récord personal: {{ userStreak.longest_streak }} días</div>
                </div>
                <div v-else class="inline-block">
                  <div class="text-6xl sm:text-7xl mb-2">🌟</div>
                  <div class="text-2xl sm:text-3xl font-bold text-gray-800">¡Empieza tu racha!</div>
                </div>
              </div>

              <!-- Desafío info (secundario) -->
              <div class="bg-white/60 backdrop-blur-sm rounded-lg p-3 sm:p-4 mb-4">
                <h3 class="text-base sm:text-lg font-bold text-gray-900 mb-1 flex items-center justify-center gap-2">
                  <span class="text-xl">🎯</span>
                  <span>Desafío Diario</span>
                </h3>
                <p class="text-xs sm:text-sm text-gray-600 text-center">
                  10 preguntas · ~5 minutos
                </p>
              </div>

              <!-- CTA Button -->
              <button
                @click="startDailyChallenge"
                class="btn btn-primary w-full text-sm sm:text-base px-6 py-3 sm:py-4 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl font-bold"
              >
                {{ userStreak.current_streak > 0 ? '¡Mantén tu racha!' : '¡Empezar ahora!' }}
              </button>
            </div>

            <!-- COLUMNA DERECHA: Quick Actions -->
            <div>
              <h2 class="text-base sm:text-lg font-bold mb-3 text-gray-700 px-1">Acciones rápidas</h2>
              <div class="grid grid-cols-2 gap-2 sm:gap-3">

                <!-- Crear Quiz - Mobile First -->
                <router-link
                  to="/create-quiz"
                  class="card hover:shadow-xl transition-all text-center p-3 sm:p-4 border-2 border-transparent hover:border-blue-300 group"
                >
                  <div class="text-3xl sm:text-4xl mb-2 group-hover:scale-110 transition-transform">✨</div>
                  <h3 class="font-bold text-xs sm:text-sm mb-0.5">Crear Quiz</h3>
                  <p class="text-xs text-gray-600 hidden sm:block">Nuevo</p>
                </router-link>

                <!-- Mis Quizzes - Mobile First -->
                <router-link
                  to="/quizzes"
                  class="card hover:shadow-xl transition-all text-center p-3 sm:p-4 border-2 border-transparent hover:border-green-300 group"
                >
                  <div class="text-3xl sm:text-4xl mb-2 group-hover:scale-110 transition-transform">📚</div>
                  <h3 class="font-bold text-xs sm:text-sm mb-0.5">Mis Quizzes</h3>
                  <p class="text-xs text-gray-600">{{ stats.totalQuizzes }}</p>
                </router-link>

                <!-- Quiz Express - Mobile First -->
                <button
                  @click="startQuizExpress"
                  class="card hover:shadow-xl transition-all text-center p-3 sm:p-4 border-2 border-transparent hover:border-yellow-300 group"
                >
                  <div class="text-3xl sm:text-4xl mb-2 group-hover:scale-110 transition-transform">⚡</div>
                  <h3 class="font-bold text-xs sm:text-sm mb-0.5">Quiz Express</h3>
                  <p class="text-xs text-gray-600 hidden sm:block">5 preguntas</p>
                </button>

                <!-- Flash Cards - Mobile First -->
                <button
                  @click="startFlashCards"
                  class="card hover:shadow-xl transition-all text-center p-3 sm:p-4 border-2 border-transparent hover:border-purple-300 group"
                >
                  <div class="text-3xl sm:text-4xl mb-2 group-hover:scale-110 transition-transform">🎴</div>
                  <h3 class="font-bold text-xs sm:text-sm mb-0.5">Flash Cards</h3>
                  <p class="text-xs text-gray-600 hidden sm:block">Repaso</p>
                </button>
              </div>
            </div>
          </div>

          <!-- FILA 3: MIS DESAFÍOS - Full Width -->
          <div class="mb-6 sm:mb-10">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg sm:text-xl font-bold flex items-center gap-2 text-gray-700 px-1">
                <span class="text-2xl">🏆</span>
                <span>Mis Desafíos</span>
              </h2>
              <router-link
                v-if="myChallenges.length > 0"
                to="/my-challenges"
                class="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver todos →
              </router-link>
            </div>

            <!-- Si tiene desafíos -->
            <div v-if="!loadingChallenges && myChallenges.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div
                v-for="challenge in myChallenges"
                :key="challenge.id"
                class="card hover:shadow-lg transition-shadow p-4 sm:p-5"
              >
                <div class="mb-3">
                  <h3 class="font-bold text-base sm:text-lg text-gray-900 mb-1 line-clamp-2">
                    {{ challenge.quiz_title }}
                  </h3>
                  <div class="text-xs text-gray-500">
                    Hace {{ Math.floor((Date.now() - new Date(challenge.created_at).getTime()) / (1000 * 60 * 60 * 24)) }} días
                  </div>
                </div>

                <!-- Stats -->
                <div class="grid grid-cols-3 gap-2 mb-3">
                  <div class="bg-blue-50 rounded-lg p-2 text-center">
                    <div class="text-base sm:text-lg font-bold text-blue-600">{{ challenge.total_attempts }}</div>
                    <div class="text-xs text-gray-600">Intentos</div>
                  </div>
                  <div class="bg-green-50 rounded-lg p-2 text-center">
                    <div class="text-base sm:text-lg font-bold text-green-600">{{ challenge.best_score }}%</div>
                    <div class="text-xs text-gray-600">Mejor</div>
                  </div>
                  <div class="bg-orange-50 rounded-lg p-2 text-center">
                    <div class="text-base sm:text-lg font-bold text-orange-600">
                      {{ challenge.creator_rank ? `#${challenge.creator_rank}` : '-' }}
                    </div>
                    <div class="text-xs text-gray-600">Pos</div>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-2">
                  <button
                    @click="copyToClipboard(getShareUrl(challenge.share_slug))"
                    class="btn btn-secondary flex-1 text-xs py-2"
                  >
                    📋
                  </button>
                  <button
                    @click="router.push(`/challenge/${challenge.share_slug}`)"
                    class="btn btn-primary flex-1 text-xs py-2"
                  >
                    Ver
                  </button>
                </div>
              </div>
            </div>

            <!-- Si NO tiene desafíos - CTA para crear -->
            <div v-else-if="!loadingChallenges" class="card p-6 sm:p-8 text-center bg-gradient-to-br from-blue-50 to-purple-50">
              <div class="text-5xl sm:text-6xl mb-4">🏆</div>
              <h3 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">¿Listo para competir?</h3>
              <p class="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
                Completa un quiz y comparte el desafío con tus amigos para ver quién obtiene la mejor puntuación
              </p>
              <router-link
                to="/quizzes"
                class="btn btn-primary inline-flex items-center gap-2 px-6 py-3"
              >
                <span>🎯</span>
                <span>Ir a mis quizzes</span>
              </router-link>
            </div>

            <!-- Loading state -->
            <div v-else class="text-center py-8">
              <p class="text-sm text-gray-500">Cargando desafíos...</p>
            </div>
          </div>
        </div>

        <!-- Loading state -->
        <div v-else-if="loading" class="flex items-center justify-center py-20">
          <div class="text-center">
            <div class="text-6xl mb-4 animate-bounce">📚</div>
            <p class="text-gray-600">Cargando tu dashboard...</p>
          </div>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- PRACTICE MODES (Igual que antes) -->
      <!-- ============================================ -->

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
