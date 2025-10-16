<template>
  <AppLayout>
    <div class="py-8 px-4">
      <div class="max-w-6xl mx-auto">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p class="mt-4 text-gray-600">Cargando quiz...</p>
      </div>

      <!-- Quiz Content -->
      <template v-else-if="quiz">
        <!-- Back Button -->
        <button
          @click="router.back()"
          class="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main Content (2 columns) -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Quiz Header Card -->
            <div class="bg-white rounded-lg shadow-lg p-8">
              <!-- Category Badge -->
              <div class="flex items-center gap-3 mb-4">
                <span v-if="quiz.category" class="text-sm font-medium px-3 py-1 rounded-full bg-indigo-100 text-indigo-800">
                  {{ quiz.category.icon }} {{ quiz.category.name }}
                </span>
                <span v-if="quiz.is_verified" class="text-sm font-medium px-3 py-1 rounded-full bg-green-100 text-green-800">
                  ✓ Oficial
                </span>
              </div>

              <!-- Quiz Title -->
              <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ quiz.title }}</h1>

              <!-- Quiz Meta -->
              <div class="flex flex-wrap items-center gap-6 text-gray-600 mb-6">
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="font-medium">{{ quiz.total_questions }} preguntas</span>
                </div>

                <div class="flex items-center gap-2" :class="getDifficultyClass(quiz.difficulty)">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span class="font-medium">{{ getDifficultyLabel(quiz.difficulty) }}</span>
                </div>

                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span class="font-medium">{{ quiz.participants_count || 0 }} participantes</span>
                </div>
              </div>

              <!-- Tags -->
              <div v-if="quiz.tags && quiz.tags.length > 0" class="flex flex-wrap gap-2 mb-6">
                <span
                  v-for="tag in quiz.tags"
                  :key="tag"
                  class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {{ tag }}
                </span>
              </div>

              <!-- Source -->
              <p v-if="quiz.source" class="text-sm text-gray-600 mb-6 italic">
                📋 Fuente: {{ quiz.source }}
              </p>

              <!-- Summary -->
              <div v-if="quiz.summary" class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <h3 class="text-lg font-semibold text-blue-900 mb-2">📚 Conceptos Clave</h3>
                <div class="text-blue-800 whitespace-pre-line">{{ quiz.summary }}</div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-4">
                <button
                  v-if="authStore.user"
                  @click="startQuiz"
                  class="flex-1 bg-indigo-600 text-white px-8 py-4 rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
                >
                  🚀 Empezar Quiz
                </button>
                <button
                  v-else
                  @click="router.push('/login')"
                  class="flex-1 bg-indigo-600 text-white px-8 py-4 rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
                >
                  Inicia sesión para participar
                </button>

                <button
                  @click="toggleLike"
                  class="px-6 py-4 border-2 rounded-lg transition-all hover:bg-gray-50"
                  :class="quiz.is_liked ? 'border-red-500 text-red-600' : 'border-gray-300 text-gray-600'"
                >
                  <div class="flex items-center gap-2">
                    <svg class="w-6 h-6" :fill="quiz.is_liked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span class="font-semibold">{{ quiz.likes_count || 0 }}</span>
                  </div>
                </button>
              </div>

              <!-- Creator Info -->
              <div v-if="quiz.creator" class="mt-6 pt-6 border-t border-gray-200">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span class="text-indigo-600 font-semibold">
                      {{ quiz.creator.display_name?.charAt(0).toUpperCase() || '?' }}
                    </span>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">Creado por</p>
                    <p class="font-medium text-gray-900">{{ quiz.creator.display_name || 'Usuario anónimo' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar: Leaderboard (1 column) -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                🏆 Clasificación Global
              </h2>

              <!-- Loading Leaderboard -->
              <div v-if="loadingLeaderboard" class="text-center py-8">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>

              <!-- Empty Leaderboard -->
              <div v-else-if="leaderboard.length === 0" class="text-center py-8 text-gray-500">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p class="text-sm">Sé el primero en participar</p>
              </div>

              <!-- Leaderboard List -->
              <div v-else class="space-y-3">
                <div
                  v-for="(attempt, index) in leaderboard.slice(0, 10)"
                  :key="attempt.id"
                  class="flex items-center gap-3 p-3 rounded-lg transition-colors"
                  :class="attempt.user_id === authStore.user?.id ? 'bg-indigo-50 border-2 border-indigo-200' : 'bg-gray-50'"
                >
                  <!-- Rank -->
                  <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold"
                    :class="getRankClass(index + 1)"
                  >
                    {{ index < 3 ? getMedalEmoji(index + 1) : (index + 1) }}
                  </div>

                  <!-- User Info -->
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-gray-900 truncate">
                      {{ attempt.username }}
                      <span v-if="attempt.user_id === authStore.user?.id" class="text-indigo-600 text-xs ml-1">(Tú)</span>
                    </p>
                    <p class="text-xs text-gray-500">
                      {{ formatTime(attempt.time_taken) }}
                    </p>
                  </div>

                  <!-- Score -->
                  <div class="flex-shrink-0 text-right">
                    <p class="font-bold text-lg" :class="getScoreClass(attempt.score, attempt.total_questions)">
                      {{ Math.round((attempt.score / attempt.total_questions) * 100) }}%
                    </p>
                    <p class="text-xs text-gray-500">
                      {{ attempt.score }}/{{ attempt.total_questions }}
                    </p>
                  </div>
                </div>

                <!-- Show More Button -->
                <button
                  v-if="leaderboard.length > 10"
                  @click="showAllLeaderboard = !showAllLeaderboard"
                  class="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium py-2"
                >
                  {{ showAllLeaderboard ? 'Ver menos' : `Ver todos (${leaderboard.length})` }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Error State -->
      <div v-else class="text-center py-12 bg-white rounded-lg shadow-md">
        <svg class="mx-auto h-16 w-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-xl font-semibold text-gray-700 mb-2">Quiz no encontrado</h3>
        <p class="text-gray-600 mb-4">El quiz que buscas no existe o no está disponible</p>
        <button
          @click="router.push('/public-quizzes')"
          class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Ver todos los quizzes
        </button>
      </div>
    </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { getPublicQuiz, toggleQuizLike } from '../services/publicQuizzesService'
import axios from 'axios'
import type { PublicQuizWithDetails } from '../types'
import AppLayout from '../components/AppLayout.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// State
const loading = ref(true)
const loadingLeaderboard = ref(true)
const quiz = ref<PublicQuizWithDetails | null>(null)
const leaderboard = ref<any[]>([])
const showAllLeaderboard = ref(false)

// Methods
async function loadQuiz() {
  try {
    loading.value = true
    const quizId = route.params.id as string
    const response = await getPublicQuiz(quizId, authStore.user?.id)
    quiz.value = response.quiz

    // Load leaderboard if there's a global challenge
    if (quiz.value.global_challenge_id) {
      await loadLeaderboard(quiz.value.global_challenge_id)
    } else {
      loadingLeaderboard.value = false
    }
  } catch (error) {
    console.error('Error loading quiz:', error)
    quiz.value = null
  } finally {
    loading.value = false
  }
}

async function loadLeaderboard(challengeId: string) {
  try {
    loadingLeaderboard.value = true
    const response = await axios.get(`${API_URL}/api/challenges/${challengeId}/leaderboard`)
    leaderboard.value = response.data.leaderboard || []
  } catch (error) {
    console.error('Error loading leaderboard:', error)
  } finally {
    loadingLeaderboard.value = false
  }
}

async function toggleLike() {
  if (!authStore.user) {
    router.push('/login')
    return
  }

  if (!quiz.value) return

  try {
    const result = await toggleQuizLike(quiz.value.id, authStore.user.id)
    quiz.value.is_liked = result.liked
    quiz.value.likes_count = (quiz.value.likes_count || 0) + (result.liked ? 1 : -1)
  } catch (error) {
    console.error('Error toggling like:', error)
  }
}

function startQuiz() {
  if (!quiz.value?.global_challenge_id) return

  // Redirect to the global challenge view
  router.push(`/challenge/${quiz.value.global_challenge_id}`)
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

function getRankClass(rank: number): string {
  if (rank === 1) return 'bg-yellow-100 text-yellow-800'
  if (rank === 2) return 'bg-gray-100 text-gray-800'
  if (rank === 3) return 'bg-orange-100 text-orange-800'
  return 'bg-gray-100 text-gray-600'
}

function getMedalEmoji(rank: number): string {
  const medals: Record<number, string> = {
    1: '🥇',
    2: '🥈',
    3: '🥉'
  }
  return medals[rank] || ''
}

function getScoreClass(score: number, total: number): string {
  const percentage = (score / total) * 100
  if (percentage === 100) return 'text-green-600'
  if (percentage >= 80) return 'text-blue-600'
  if (percentage >= 60) return 'text-yellow-600'
  return 'text-gray-600'
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Lifecycle
onMounted(() => {
  loadQuiz()
})
</script>
