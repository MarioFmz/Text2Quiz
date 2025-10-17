<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import NotificationModal from '@/components/NotificationModal.vue'
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { documentsService } from '@/services/documentsService'
import type { Question } from '@/types'
// @ts-ignore
import Confetti from '@/utils/confetti.js'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { success, error: showError } = useToast()

const identifier = route.params.identifier as string
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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
const showFullRanking = ref(false)
const creatorAttempt = ref<any>(null)
const quizStartTime = ref<number>(0)
const isCreator = ref(false)
const showStudyMaterial = ref(false)
const regeneratingQuestions = ref(false)

// Notification modal
const showNotification = ref(false)
const notificationType = ref<'success' | 'error' | 'warning' | 'info'>('info')
const notificationMessage = ref('')
const notificationTitle = ref('')

const showNotif = (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
  notificationType.value = type
  notificationMessage.value = message
  notificationTitle.value = title || ''
  showNotification.value = true
}

// Auto-save progress variables
const sessionId = ref<string>('')
const lastSavedTime = ref<Date | null>(null)
const autoSaveInterval = ref<number | null>(null)
const savingProgress = ref(false)
const showProgressModal = ref(false)
const savedProgressData = ref<any>(null)
const answersCount = ref(0)

// Computed property to check if user has already completed this challenge
const hasCompletedBefore = computed(() => {
  if (!user.value) return false
  return leaderboard.value.some(entry => entry.user_id === user.value?.id)
})

// Computed property for button text
const startButtonText = computed(() => {
  if (isCreator.value) return 'Reintentar desafío'
  if (hasCompletedBefore.value) return 'Reintentar'
  return 'Comenzar desafío'
})

// ============================================
// AUTO-SAVE PROGRESS FUNCTIONS
// ============================================

// Generate unique session ID for anonymous users
const generateSessionId = (): string => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15)
}

// Get or create session ID
const getSessionId = (): string => {
  if (!sessionId.value) {
    // Try to get from localStorage first
    const stored = localStorage.getItem(`challenge_session_${identifier}`)
    if (stored) {
      sessionId.value = stored
    } else {
      sessionId.value = generateSessionId()
      localStorage.setItem(`challenge_session_${identifier}`, sessionId.value)
    }
  }
  return sessionId.value
}

// Save progress to localStorage (instant backup)
const saveProgressToLocalStorage = () => {
  try {
    const progress = {
      answers: userAnswers.value,
      currentQuestionIndex: currentQuestionIndex.value,
      startTime: quizStartTime.value,
      lastSaved: Date.now()
    }
    localStorage.setItem(`challenge_progress_${challenge.value.id}`, JSON.stringify(progress))
    console.log('Progress saved to localStorage')
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

// Save progress to database
const saveProgressToDatabase = async () => {
  if (!challenge.value?.id || savingProgress.value) return

  savingProgress.value = true
  try {
    const response = await fetch(`${apiUrl}/api/challenges/${challenge.value.id}/save-progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.value?.id || null,
        sessionId: user.value ? null : getSessionId(),
        answers: userAnswers.value,
        currentQuestionIndex: currentQuestionIndex.value
      })
    })

    if (response.ok) {
      lastSavedTime.value = new Date()
      console.log('Progress saved to database')
    }
  } catch (error) {
    console.error('Error saving progress to database:', error)
  } finally {
    savingProgress.value = false
  }
}

// Load saved progress
const loadSavedProgress = async () => {
  if (!challenge.value?.id) return

  // If user has already completed this challenge, clear any saved progress and don't show modal
  if (hasCompletedBefore.value) {
    console.log('User has already completed this challenge, clearing any saved progress')
    await clearSavedProgress()
    return
  }

  try {
    // Try loading from database first
    const params = new URLSearchParams({
      userId: user.value?.id || '',
      sessionId: user.value ? '' : getSessionId()
    })

    const response = await fetch(`${apiUrl}/api/challenges/${challenge.value.id}/get-progress?${params}`)

    if (response.ok) {
      const data = await response.json()
      if (data.progress && Object.keys(data.progress.answers || {}).length > 0) {
        savedProgressData.value = data.progress
        showProgressModal.value = true
        return
      }
    }

    // Fallback to localStorage
    const localProgress = localStorage.getItem(`challenge_progress_${challenge.value.id}`)
    if (localProgress) {
      const progress = JSON.parse(localProgress)
      if (Object.keys(progress.answers || {}).length > 0) {
        savedProgressData.value = {
          answers: progress.answers,
          current_question_index: progress.currentQuestionIndex,
          last_updated: new Date(progress.lastSaved).toISOString()
        }
        showProgressModal.value = true
      }
    }
  } catch (error) {
    console.error('Error loading saved progress:', error)
  }
}

// Restore progress from saved data
const restoreProgress = () => {
  if (!savedProgressData.value) return

  userAnswers.value = savedProgressData.value.answers || {}
  currentQuestionIndex.value = savedProgressData.value.current_question_index || 0
  answersCount.value = Object.keys(userAnswers.value).length

  showProgressModal.value = false
  showSummary.value = false
  quizStartTime.value = Date.now()

  // Start auto-save
  startAutoSave()

  console.log(`Progress restored: ${answersCount.value} answers, question ${currentQuestionIndex.value + 1}`)
}

// Start from scratch (clear saved progress)
const startFresh = async () => {
  await clearSavedProgress()
  showProgressModal.value = false
}

// Clear saved progress
const clearSavedProgress = async () => {
  try {
    // Clear from database
    if (challenge.value?.id) {
      await fetch(`${apiUrl}/api/challenges/${challenge.value.id}/delete-progress`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.value?.id || null,
          sessionId: user.value ? null : getSessionId()
        })
      })
    }

    // Clear from localStorage
    localStorage.removeItem(`challenge_progress_${challenge.value?.id}`)
    savedProgressData.value = null

    console.log('Progress cleared')
  } catch (error) {
    console.error('Error clearing progress:', error)
  }
}

// Start auto-save interval
const startAutoSave = () => {
  stopAutoSave() // Clear any existing interval

  // Save every 2 minutes
  autoSaveInterval.value = window.setInterval(() => {
    if (!showSummary.value && !showResults.value && Object.keys(userAnswers.value).length > 0) {
      saveProgressToDatabase()
    }
  }, 120000) // 2 minutes
}

// Stop auto-save interval
const stopAutoSave = () => {
  if (autoSaveInterval.value) {
    clearInterval(autoSaveInterval.value)
    autoSaveInterval.value = null
  }
}

// Save and exit
const saveAndExit = async () => {
  await saveProgressToDatabase()
  router.push('/dashboard')
}

// Watch for answer changes to save to localStorage and count
watch(userAnswers, () => {
  answersCount.value = Object.keys(userAnswers.value).length
  saveProgressToLocalStorage()

  // Save to database every 5 questions
  if (answersCount.value % 5 === 0 && answersCount.value > 0) {
    saveProgressToDatabase()
  }
}, { deep: true })

// Save before leaving page
onBeforeUnmount(() => {
  stopAutoSave()
  if (!showResults.value && Object.keys(userAnswers.value).length > 0) {
    saveProgressToDatabase()
  }
})

// Save before closing browser
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', (e) => {
    if (!showResults.value && Object.keys(userAnswers.value).length > 0) {
      saveProgressToLocalStorage()
      // Note: saveProgressToDatabase might not complete before page unloads
    }
  })
}

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
    const response = await fetch(`${apiUrl}/api/challenges/${identifier}`)

    if (!response.ok) {
      throw new Error('Desafío no encontrado')
    }

    const data = await response.json()
    challenge.value = data.challenge
    quiz.value = data.quiz
    questions.value = data.questions
    documents.value = data.documents || []

    // Update page meta tags for social sharing
    updateMetaTags()

    // Verificar si el usuario actual es el creador
    if (user.value && challenge.value.creator_id === user.value.id) {
      isCreator.value = true
    }

    // Load leaderboard
    await loadLeaderboard()

    // Check for saved progress AFTER challenge is loaded
    await loadSavedProgress()
  } catch (error) {
    console.error('Error loading challenge:', error)
    showNotif('error', 'No se pudo cargar el desafío')
    router.push('/')
  } finally {
    loading.value = false
  }
}

// Update meta tags for social sharing
const updateMetaTags = () => {
  if (!quiz.value) return

  const title = `${quiz.value.title} - Desafío en Text2Quiz`
  const description = quiz.value.summary || `¿Puedes superar este desafío? ${questions.value.length} preguntas esperan por ti.`
  const url = `${window.location.origin}/challenge/${identifier}`

  // Update document title
  document.title = title

  // Update or create meta tags
  const updateOrCreateMeta = (property: string, content: string, isProperty = true) => {
    const attr = isProperty ? 'property' : 'name'
    let meta = document.querySelector(`meta[${attr}="${property}"]`)
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute(attr, property)
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', content)
  }

  // Open Graph
  updateOrCreateMeta('og:title', title)
  updateOrCreateMeta('og:description', description)
  updateOrCreateMeta('og:url', url)
  updateOrCreateMeta('og:type', 'website')

  // Twitter
  updateOrCreateMeta('twitter:title', title, false)
  updateOrCreateMeta('twitter:description', description, false)

  // Regular meta
  updateOrCreateMeta('description', description, false)
}

const viewDocument = async (filePath: string) => {
  try {
    const signedUrl = await documentsService.getSignedUrl(filePath)
    window.open(signedUrl, '_blank')
  } catch (error) {
    console.error('Error opening document:', error)
    showNotif('error', 'No se pudo abrir el documento')
  }
}

const loadLeaderboard = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/challenges/${challenge.value.id}/leaderboard`)

    if (response.ok) {
      const data = await response.json()
      leaderboard.value = data.leaderboard

      // Guardar si el challenge es anónimo
      if (challenge.value) {
        challenge.value.is_anonymous = data.is_anonymous || false
      }

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
    showNotif('warning', 'Por favor, ingresa tu nombre para guardar tu puntuación')
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

    // Clear saved progress after successful submission
    await clearSavedProgress()
    stopAutoSave()

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
    showNotif('error', 'Error al enviar el quiz. Por favor, intenta de nuevo.')
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

const restartQuiz = async () => {
  // Regenerate questions for all participants
  regeneratingQuestions.value = true

  try {
    const response = await fetch(`${apiUrl}/api/quizzes/${quiz.value.id}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.value?.id
      })
    })

    if (!response.ok) {
      throw new Error('Error al regenerar preguntas')
    }

    // Reload challenge data to get new questions
    await loadChallenge()
  } catch (error) {
    console.error('Error regenerating questions:', error)
    showNotif('error', 'No se pudieron regenerar las preguntas. Se usarán las preguntas actuales.')
  } finally {
    regeneratingQuestions.value = false
  }

  // Reset quiz state and start immediately
  await clearSavedProgress()
  userAnswers.value = {}
  currentQuestionIndex.value = 0
  showResults.value = false
  showSummary.value = false // Start quiz immediately
  quizStartTime.value = Date.now()
  startAutoSave()
}

const startQuiz = () => {
  showSummary.value = false
  quizStartTime.value = Date.now()
  startAutoSave() // Start auto-save when quiz begins
}

const toggleLeaderboard = () => {
  showLeaderboard.value = !showLeaderboard.value
}

const toggleFullRanking = () => {
  showFullRanking.value = !showFullRanking.value
}

const getRankEmoji = (rank: number) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

// Función para obtener el nombre a mostrar (anónimo o real)
const getDisplayName = (entry: any, index: number) => {
  if (challenge.value?.is_anonymous) {
    return `Participante #${index + 1}`
  }
  return entry.username
}

const triggerConfetti = () => {
  // Crear 3 explosiones de confeti
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      // Crear elemento para el confeti
      const confettiElement = document.createElement('div')
      confettiElement.id = `confetti-trigger-${i}-${Date.now()}`
      confettiElement.style.position = 'fixed'
      confettiElement.style.left = '50%'
      confettiElement.style.top = '50%'
      confettiElement.style.width = '10px'
      confettiElement.style.height = '10px'
      confettiElement.style.pointerEvents = 'none'
      document.body.appendChild(confettiElement)

      // Configurar y lanzar confeti
      const confetti = new Confetti(confettiElement.id)
      confetti.setCount(75)
      confetti.setSize(1)
      confetti.setPower(25)
      confetti.setFade(false)
      confetti.destroyTarget(true)

      // Simular click en el centro de la pantalla para disparar el confeti
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: window.innerWidth / 2,
        clientY: window.innerHeight / 2
      })
      confettiElement.dispatchEvent(clickEvent)

      // Limpiar después de 5 segundos
      setTimeout(() => {
        if (confettiElement.parentNode) {
          confettiElement.remove()
        }
      }, 5000)
    }, i * 200)
  }
}

// Share challenge function
const shareChallenge = async (includeScore = false) => {
  try {
    const url = `${window.location.origin}/challenge/${identifier}`
    let shareText = ''
    let shareTitle = ''

    if (includeScore && showResults.value) {
      // Compartir después de completar (con puntuación)
      const results = calculateResults()
      const emoji = results.percentage >= 90 ? '🏆' : results.percentage >= 70 ? '🎯' : '💪'

      // Encontrar el rank del usuario actual
      const userAttempt = leaderboard.value.find((entry: any) => entry.user_id === user.value?.id)
      const userRank = userAttempt ? leaderboard.value.indexOf(userAttempt) + 1 : null

      if (userRank && userRank <= 3) {
        // Si está en top 3, presumir la posición
        const positions = ['🥇 primer lugar', '🥈 segundo lugar', '🥉 tercer lugar']
        shareTitle = `${emoji} ¡Estoy en ${positions[userRank - 1]}!`
        shareText = `Acabo de conseguir ${results.percentage}% en el desafío: "${quiz.value.title}"\n\n¿Puedes superarme?`
      } else {
        // Si no está en top 3, texto de reto general
        shareTitle = `${emoji} ¿Puedes superarme?`
        shareText = `Acabo de conseguir ${results.percentage}% en el desafío: "${quiz.value.title}"\n\n¡Demuestra que puedes hacerlo mejor!`
      }
    } else {
      // Compartir antes de completar (invitación general)
      shareTitle = `🎯 ¡Acepta el desafío!`
      shareText = `"${quiz.value.title}"\n\n📊 ${questions.value.length} preguntas | 👥 ${challenge.value.participants_count} participantes\n\n¿Tienes lo necesario para superarlo?`
    }

    // Si estamos en móvil y el navegador soporta la API nativa, usarla
    if (navigator.share && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: url
        })
        // No mostrar nada si el share fue exitoso (el usuario ya vio el menú nativo)
      } catch (shareError: any) {
        // Si el usuario canceló, no hacer nada
        if (shareError.name === 'AbortError') {
          return
        }
        // Si falló por otra razón, intentar con clipboard
        throw shareError
      }
    } else {
      // Desktop: copiar al clipboard
      const fullText = `${shareTitle}\n\n${shareText}\n\n👇\n${url}`
      await navigator.clipboard.writeText(fullText)
      success('Enlace copiado al portapapeles')
    }
  } catch (error) {
    console.error('Error sharing:', error)
    showError('No se pudo compartir el enlace')
  }
}
</script>

<template>
  <AppLayout>
    <div class="max-w-4xl mx-auto px-3 py-4 sm:px-6 lg:px-8 sm:py-8">
      <!-- Modal: Restore Progress (outside conditional chain) -->
      <Transition name="fade">
        <div
          v-if="showProgressModal && savedProgressData"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          @click.self="startFresh"
        >
          <div class="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div class="text-center mb-6">
              <div class="text-5xl mb-4">💾</div>
              <h2 class="text-2xl font-bold mb-2">Progreso Guardado</h2>
              <p class="text-gray-600">
                Encontramos un intento en progreso con <strong>{{ Object.keys(savedProgressData.answers || {}).length }}</strong> respuestas guardadas.
              </p>
              <p class="text-sm text-gray-500 mt-2">
                Última actualización: {{ new Date(savedProgressData.last_updated).toLocaleString('es-ES') }}
              </p>
            </div>

            <div class="space-y-3">
              <button
                @click="restoreProgress"
                class="w-full px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                Continuar donde lo dejé
              </button>
              <button
                @click="startFresh"
                class="w-full px-6 py-3 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                Empezar de nuevo
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Loading State -->
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
          <p v-if="!challenge.is_anonymous" class="text-xs sm:text-sm text-gray-500 mb-6">
            Participante: <strong>{{ username }}</strong>
          </p>
          <p v-else class="text-xs sm:text-sm text-gray-500 mb-6 flex items-center justify-center gap-1">
            <span>🔒</span>
            <span>Desafío anónimo</span>
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
            <button @click="showResults = false; showSummary = true" class="btn btn-secondary w-full sm:w-auto">
              Ver Desafío
            </button>
            <button @click="toggleLeaderboard" class="btn btn-primary w-full sm:w-auto">
              {{ showLeaderboard ? 'Ocultar' : 'Ver' }} Ranking
            </button>
            <button
              @click="shareChallenge(true)"
              class="btn btn-secondary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <span>📤</span>
              <span>Compartir</span>
            </button>
            <button
              @click="restartQuiz"
              :disabled="regeneratingQuestions"
              class="btn btn-secondary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="regeneratingQuestions" class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Regenerando...</span>
              </span>
              <span v-else>Reintentar</span>
            </button>
          </div>
        </div>

        <!-- Info: Ver historial completo -->
        <div v-if="isCreator" class="card bg-blue-50 border-2 border-blue-200">
          <div class="flex items-start gap-3">
            <span class="text-2xl">💡</span>
            <div class="flex-1">
              <h4 class="font-bold text-blue-900 mb-1">Historial completo de intentos</h4>
              <p class="text-sm text-blue-800 mb-3">
                Puedes ver todos tus intentos anteriores y el detalle de cada uno en tu quiz guardado.
              </p>
              <router-link
                :to="`/quiz/${quiz.id}`"
                class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <span>📊</span>
                <span>Ver historial en Mis Quizzes</span>
              </router-link>
            </div>
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
                    <p class="font-semibold">{{ getDisplayName(entry, index) }}</p>
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
        <!-- Hero Section - Más impactante y dramático -->
        <div class="relative overflow-hidden rounded-xl sm:rounded-2xl">
          <!-- Background con gradiente -->
          <div class="absolute inset-0 bg-gradient-to-br from-orange-500 via-purple-600 to-blue-600"></div>
          <div class="absolute inset-0 bg-black/10"></div>

          <!-- Contenido -->
          <div class="relative p-6 sm:p-10 text-white text-center">
            <!-- Badge de "Desafío" -->
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold mb-4 border border-white/30">
              <span class="text-xl">⚔️</span>
              <span>DESAFÍO ACTIVO</span>
            </div>

            <!-- Título del Quiz -->
            <h1 class="text-2xl sm:text-3xl md:text-4xl font-black mb-3 drop-shadow-lg">
              {{ quiz.title }}
            </h1>

            <!-- Mensaje motivacional -->
            <p v-if="isCreator" class="text-base sm:text-lg text-white/90 mb-6 max-w-2xl mx-auto">
              👑 Este es tu desafío. <strong>{{ challenge.participants_count }}</strong> personas han aceptado el reto
            </p>
            <p v-else class="text-base sm:text-lg text-white/90 mb-6 max-w-2xl mx-auto">
              ¿Tienes lo necesario para superar este desafío?
            </p>

            <!-- Stats principales - Mobile First -->
            <div class="grid grid-cols-3 gap-3 sm:gap-6 max-w-3xl mx-auto">
              <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
                <div class="text-2xl sm:text-3xl md:text-4xl font-black mb-1">{{ questions.length }}</div>
                <div class="text-xs sm:text-sm text-white/80 font-medium">Preguntas</div>
              </div>
              <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
                <div class="text-2xl sm:text-3xl md:text-4xl font-black mb-1">{{ challenge.participants_count }}</div>
                <div class="text-xs sm:text-sm text-white/80 font-medium">Retadores</div>
              </div>
              <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
                <div class="text-base sm:text-xl md:text-2xl font-black mb-1">
                  {{ quiz.difficulty === 'easy' ? '🟢' : quiz.difficulty === 'medium' ? '🟡' : '🔴' }}
                </div>
                <div class="text-xs sm:text-sm text-white/80 font-medium">
                  {{ quiz.difficulty === 'easy' ? 'Fácil' : quiz.difficulty === 'medium' ? 'Medio' : 'Difícil' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumen y Documentos (si hay) -->
        <div v-if="quiz.summary || quiz.combined_content || documents.length > 0" class="card">
          <div v-if="quiz.summary" class="mb-6">
            <h3 class="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span class="text-lg">📋</span>
              <span>Sobre este desafío</span>
            </h3>
            <p class="text-sm sm:text-base text-gray-600 leading-relaxed">{{ quiz.summary }}</p>
          </div>

          <!-- Study Material Section (if formatted_content exists) -->
          <div v-if="quiz.formatted_content || quiz.combined_content" class="mb-6">
            <button
              @click="showStudyMaterial = !showStudyMaterial"
              class="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg transition-all duration-200 border-2 border-blue-200"
            >
              <div class="flex items-center space-x-3">
                <span class="text-2xl">📖</span>
                <div class="text-left">
                  <h3 class="font-bold text-gray-900">Material de Estudio</h3>
                  <p class="text-xs sm:text-sm text-gray-600">Contenido formateado para tu repaso</p>
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
              <div v-if="showStudyMaterial" class="mt-4 p-4 sm:p-6 bg-white border-2 border-blue-200 rounded-lg shadow-sm">
                <div class="prose prose-sm sm:prose max-w-none">
                  <div class="text-sm sm:text-base text-gray-800 whitespace-pre-line leading-relaxed">
                    {{ quiz.formatted_content || quiz.combined_content }}
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Document Links -->
          <div v-if="documents.length > 0">
            <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span class="text-lg">📎</span>
              <span>Material de referencia</span>
            </h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="doc in documents"
                :key="doc.id"
                @click="viewDocument(doc.file_url)"
                class="btn btn-secondary text-xs sm:text-sm flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <span>📄</span>
                <span>{{ doc.title }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Score del Creador - Tipo "Boss Battle" -->
        <div v-if="creatorAttempt" class="relative overflow-hidden rounded-xl sm:rounded-2xl">
          <!-- Background gradient -->
          <div class="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500"></div>
          <div class="absolute inset-0 bg-black/5"></div>

          <div class="relative p-5 sm:p-6">
            <!-- Badge -->
            <div class="flex justify-center mb-4">
              <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-orange-900 border border-orange-300">
                <span>👑</span>
                <span>OBJETIVO A SUPERAR</span>
              </div>
            </div>

            <!-- Versus Layout -->
            <div class="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 border-white/50">
              <div class="text-center mb-4">
                <p class="text-sm text-gray-600 mb-2 flex items-center justify-center gap-1">
                  <span v-if="challenge.is_anonymous">🔒</span>
                  <span>Creado por</span>
                </p>
                <h3 class="text-xl sm:text-2xl font-black text-gray-900">
                  {{ challenge.is_anonymous ? 'Participante #1' : creatorAttempt.username }}
                </h3>
              </div>

              <!-- Score prominente -->
              <div class="flex items-center justify-center gap-4 sm:gap-6 mb-4">
                <div class="text-center">
                  <div class="text-5xl sm:text-6xl font-black bg-gradient-to-br from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
                    {{ creatorAttempt.percentage }}%
                  </div>
                  <div class="text-xs sm:text-sm text-gray-600">
                    {{ creatorAttempt.score }}/{{ creatorAttempt.total_questions }} correctas
                  </div>
                </div>
              </div>

              <!-- Tiempo -->
              <div class="flex justify-center gap-2 items-center py-2 px-4 bg-gray-50 rounded-lg inline-flex mx-auto">
                <span class="text-xl">⏱️</span>
                <span class="text-sm font-bold text-gray-700">
                  {{ Math.floor(creatorAttempt.time_taken / 60) }}:{{ (creatorAttempt.time_taken % 60).toString().padStart(2, '0') }} min
                </span>
              </div>

              <!-- Call to action -->
              <div class="mt-6 pt-4 border-t-2 border-dashed border-gray-300">
                <p class="text-center text-base sm:text-lg font-bold text-gray-900">
                  ¿Puedes conseguir un mejor resultado? 🔥
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Leaderboard Preview - Tipo Podio -->
        <div v-if="leaderboard.length > 0" class="card bg-gradient-to-br from-slate-50 to-gray-100">
          <h3 class="text-base sm:text-lg font-bold mb-4 flex items-center gap-2">
            <span class="text-2xl">🏆</span>
            <span>Top 3 Mejores Puntuaciones</span>
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <!-- 1st Place -->
            <div v-if="leaderboard[0]"
                 class="order-1 sm:order-2 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl p-4 text-center transform sm:scale-110 border-4 border-yellow-300 shadow-xl">
              <div class="text-4xl mb-2">🥇</div>
              <div class="font-black text-white text-lg mb-1 truncate">{{ getDisplayName(leaderboard[0], 0) }}</div>
              <div class="text-3xl font-black text-white mb-1">{{ leaderboard[0].percentage }}%</div>
              <div class="text-xs text-yellow-100">{{ leaderboard[0].score }}/{{ leaderboard[0].total_questions }}</div>
            </div>

            <!-- 2nd Place -->
            <div v-if="leaderboard[1]"
                 class="order-2 sm:order-1 bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl p-4 text-center border-2 border-gray-400 shadow-lg">
              <div class="text-3xl mb-2">🥈</div>
              <div class="font-bold text-gray-800 mb-1 truncate">{{ getDisplayName(leaderboard[1], 1) }}</div>
              <div class="text-2xl font-bold text-gray-800 mb-1">{{ leaderboard[1].percentage }}%</div>
              <div class="text-xs text-gray-600">{{ leaderboard[1].score }}/{{ leaderboard[1].total_questions }}</div>
            </div>

            <!-- 3rd Place -->
            <div v-if="leaderboard[2]"
                 class="order-3 bg-gradient-to-br from-orange-400 to-amber-600 rounded-xl p-4 text-center border-2 border-orange-400 shadow-lg">
              <div class="text-3xl mb-2">🥉</div>
              <div class="font-bold text-white mb-1 truncate">{{ getDisplayName(leaderboard[2], 2) }}</div>
              <div class="text-2xl font-bold text-white mb-1">{{ leaderboard[2].percentage }}%</div>
              <div class="text-xs text-orange-100">{{ leaderboard[2].score }}/{{ leaderboard[2].total_questions }}</div>
            </div>
          </div>

          <!-- Ver ranking completo -->
          <div v-if="leaderboard.length > 3" class="mt-4 pt-4 border-t-2 border-gray-300">
            <button
              @click="toggleFullRanking"
              class="w-full px-4 py-2 text-sm font-bold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-lg transition-all flex items-center justify-center gap-2 border-2 border-gray-300"
            >
              <span>{{ showFullRanking ? '👆' : '👇' }}</span>
              <span>{{ showFullRanking ? 'Ocultar ranking completo' : `Ver ranking completo (${leaderboard.length} participantes)` }}</span>
            </button>
          </div>

          <!-- Ranking completo expandible -->
          <Transition name="expand">
            <div v-if="showFullRanking && leaderboard.length > 3" class="mt-4 space-y-2">
              <div
                v-for="(entry, index) in leaderboard"
                :key="entry.id"
                class="flex items-center justify-between p-3 rounded-lg"
                :class="[
                  entry.user_id === user?.id ? 'bg-blue-100 border-2 border-blue-400' : 'bg-white border border-gray-300',
                  entry.is_creator ? 'border-2 border-orange-300' : ''
                ]"
              >
                <div class="flex items-center space-x-3">
                  <span class="text-base font-bold min-w-[3rem]">
                    {{ getRankEmoji(index + 1) }}
                  </span>
                  <div>
                    <div class="flex items-center space-x-2">
                      <p class="font-semibold text-gray-900">{{ getDisplayName(entry, index) }}</p>
                      <span v-if="entry.is_creator" class="text-lg" title="Creador del desafío">👑</span>
                      <span v-if="entry.user_id === user?.id" class="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">TÚ</span>
                    </div>
                    <p class="text-xs text-gray-500">⏱️ {{ Math.floor(entry.time_taken / 60) }}:{{ (entry.time_taken % 60).toString().padStart(2, '0') }} min</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-lg font-bold text-gray-900">{{ entry.percentage }}%</p>
                  <p class="text-xs text-gray-500">{{ entry.score }}/{{ entry.total_questions }}</p>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- CTA Principal - Super Prominente -->
        <div class="card bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 p-6 sm:p-8">
          <div class="text-center mb-6">
            <h3 class="text-xl sm:text-2xl font-black text-gray-900 mb-2">
              {{ hasCompletedBefore ? '¿Listo para mejorar tu puntuación?' : '¿Aceptas el desafío?' }}
            </h3>
            <p class="text-sm sm:text-base text-gray-600">
              {{ hasCompletedBefore ? 'Intenta superar tu récord anterior' : 'Demuestra lo que sabes y sube al ranking' }}
            </p>
          </div>

          <div class="space-y-3">
            <button
              @click="hasCompletedBefore ? restartQuiz() : startQuiz()"
              :disabled="!username.trim() || regeneratingQuestions"
              class="btn btn-primary w-full text-base sm:text-lg py-4 sm:py-5 font-bold transform hover:scale-105 transition-all shadow-xl hover:shadow-2xl disabled:transform-none disabled:hover:scale-100"
              :class="{ 'opacity-50 cursor-not-allowed': !username.trim() || regeneratingQuestions }"
            >
              <span v-if="regeneratingQuestions" class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Regenerando...</span>
              </span>
              <span v-else>
                <span class="text-xl mr-2">🚀</span>
                {{ startButtonText }}
              </span>
            </button>

            <!-- Botón de compartir -->
            <button
              @click="shareChallenge(false)"
              class="btn btn-secondary w-full text-sm sm:text-base py-3 flex items-center justify-center gap-2 hover:scale-105 transition-transform"
            >
              <span>📤</span>
              <span>Compartir desafío</span>
            </button>
          </div>

          <p v-if="username && !challenge.is_anonymous" class="text-xs sm:text-sm text-gray-500 mt-3 text-center">
            Participando como: <strong class="text-blue-600">{{ username }}</strong>
          </p>
          <p v-if="challenge.is_anonymous" class="text-xs text-gray-500 mt-3 text-center flex items-center justify-center gap-1">
            <span>🔒</span>
            <span>Tu nombre aparecerá de forma anónima</span>
          </p>
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

        <!-- Auto-save indicator -->
        <div class="flex items-center justify-center gap-2 text-xs text-gray-500">
          <span v-if="savingProgress" class="flex items-center gap-1">
            <svg class="animate-spin h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Guardando...</span>
          </span>
          <span v-else-if="lastSavedTime" class="flex items-center gap-1">
            <span class="text-green-600">✓</span>
            <span>Guardado automáticamente a las {{ lastSavedTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) }}</span>
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

          <!-- Save & Exit button -->
          <div class="mt-4 pt-4 border-t border-gray-200">
            <button
              @click="saveAndExit"
              class="w-full sm:w-auto px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>💾</span>
              <span>Guardar y salir</span>
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

      <!-- Notification Modal -->
      <NotificationModal
        :show="showNotification"
        :type="notificationType"
        :title="notificationTitle"
        :message="notificationMessage"
        @close="showNotification = false"
      />
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
