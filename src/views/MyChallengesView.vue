<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'

const { user } = useAuth()
const router = useRouter()
const { success } = useToast()

const loading = ref(true)
const challenges = ref<any[]>([])
const participatedChallenges = ref<any[]>([])

onMounted(async () => {
  if (!user.value) {
    router.push('/login')
    return
  }
  await loadMyChallenges()
})

const loadMyChallenges = async () => {
  loading.value = true
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/challenges/my-challenges?userId=${user.value?.id}`)

    if (!response.ok) {
      throw new Error('Error loading challenges')
    }

    const data = await response.json()
    challenges.value = data.challenges || []
    participatedChallenges.value = data.participated || []
  } catch (error) {
    console.error('Error loading my challenges:', error)
  } finally {
    loading.value = false
  }
}

const copyToClipboard = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url)
    success('¡Enlace copiado al portapapeles!')
  } catch (error) {
    console.error('Error copying to clipboard:', error)
  }
}

const getShareUrl = (slug: string) => {
  return `${window.location.origin}/challenge/${slug}`
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const activeChallenges = computed(() => {
  return challenges.value.filter(c => c.is_active)
})

const inactiveChallenges = computed(() => {
  return challenges.value.filter(c => !c.is_active)
})
</script>

<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto px-3 py-4 sm:px-6 lg:px-8 sm:py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Mis Desafíos Compartidos</h1>
        <p class="text-gray-600">
          Gestiona todos los quizzes que has compartido y revisa las estadísticas de participación
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="challenges.length === 0 && participatedChallenges.length === 0" class="max-w-3xl mx-auto">
        <div class="text-center py-16 px-4">
          <!-- Large animated icon -->
          <div class="mb-8">
            <div class="text-7xl sm:text-8xl mb-4 transform hover:rotate-12 transition-transform duration-300">🏆</div>
          </div>

          <!-- Engaging heading with gradient -->
          <h2 class="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-red-600 to-pink-600">
            ¡Desafía a tus amigos y compite!
          </h2>

          <!-- Descriptive and encouraging text -->
          <p class="text-lg text-gray-600 mb-8 leading-relaxed">
            Aún no has creado ningún desafío ni participado en uno.
            <span class="font-semibold text-orange-600">Comparte tus quizzes</span> con amigos o únete a desafíos existentes
            para <span class="font-semibold text-red-600">competir y aprender juntos</span>.
          </p>

          <!-- Multiple action buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <router-link
              to="/quizzes"
              class="group relative px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-orange-600 to-red-600 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
            >
              <span class="flex items-center justify-center gap-2">
                <span>📚</span>
                <span>Ver mis quizzes</span>
                <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </router-link>

            <router-link
              to="/public-quizzes"
              class="px-8 py-4 text-lg font-semibold text-orange-600 bg-white border-2 border-orange-600 rounded-xl hover:bg-orange-50 transform hover:scale-105 transition-all duration-300 w-full sm:w-auto"
            >
              <span class="flex items-center justify-center gap-2">
                <span>🌍</span>
                <span>Explorar desafíos públicos</span>
              </span>
            </router-link>
          </div>

          <!-- How it works cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div class="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 text-left transform hover:scale-105 transition-all duration-300 border border-orange-100">
              <div class="flex items-center gap-3 mb-3">
                <div class="text-3xl">1️⃣</div>
                <h3 class="font-bold text-gray-900">Completa un quiz</h3>
              </div>
              <p class="text-sm text-gray-600">Realiza cualquier quiz de tu biblioteca</p>
            </div>

            <div class="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 text-left transform hover:scale-105 transition-all duration-300 border border-red-100">
              <div class="flex items-center gap-3 mb-3">
                <div class="text-3xl">2️⃣</div>
                <h3 class="font-bold text-gray-900">Comparte el enlace</h3>
              </div>
              <p class="text-sm text-gray-600">Genera un link único para compartir</p>
            </div>

            <div class="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 text-left transform hover:scale-105 transition-all duration-300 border border-pink-100">
              <div class="flex items-center gap-3 mb-3">
                <div class="text-3xl">3️⃣</div>
                <h3 class="font-bold text-gray-900">Compite y gana</h3>
              </div>
              <p class="text-sm text-gray-600">Sigue el ranking en tiempo real</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Challenges List -->
      <div v-else>
        <!-- Active Challenges -->
        <div v-if="activeChallenges.length > 0" class="mb-8">
          <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span class="text-2xl mr-2">🏆</span>
            Desafíos Activos ({{ activeChallenges.length }})
          </h2>

          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="challenge in activeChallenges"
              :key="challenge.id"
              class="card hover:shadow-lg transition-shadow duration-200"
            >
              <!-- Challenge Header -->
              <div class="mb-4">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <h3 class="font-bold text-lg text-gray-900 flex-1">
                    {{ challenge.quiz_title }}
                  </h3>
                  <span v-if="challenge.is_anonymous" class="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full whitespace-nowrap" title="Desafío anónimo">
                    <span>🔒</span>
                  </span>
                </div>
                <div class="flex items-center space-x-2 text-sm text-gray-500">
                  <span>📅 {{ formatDate(challenge.created_at) }}</span>
                </div>
              </div>

              <!-- Stats Grid -->
              <div class="grid grid-cols-3 gap-3 mb-4">
                <!-- Participants -->
                <div class="bg-blue-50 rounded-lg p-3 text-center">
                  <div class="text-2xl font-bold text-blue-600">
                    {{ challenge.total_attempts || 0 }}
                  </div>
                  <div class="text-xs text-gray-600">Participantes</div>
                </div>

                <!-- Best Score -->
                <div class="bg-green-50 rounded-lg p-3 text-center">
                  <div class="text-2xl font-bold text-green-600">
                    {{ challenge.best_score || 0 }}%
                  </div>
                  <div class="text-xs text-gray-600">Mejor</div>
                </div>

                <!-- Your Score -->
                <div class="bg-orange-50 rounded-lg p-3 text-center">
                  <div class="text-2xl font-bold text-orange-600">
                    {{ challenge.creator_percentage || 0 }}%
                  </div>
                  <div class="text-xs text-gray-600">Tu Score</div>
                </div>
              </div>

              <!-- Your Position -->
              <div v-if="challenge.creator_rank" class="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold text-gray-700">Tu posición:</span>
                  <span class="text-lg font-bold text-purple-600">
                    {{ challenge.creator_rank === 1 ? '🥇' : challenge.creator_rank === 2 ? '🥈' : challenge.creator_rank === 3 ? '🥉' : `#${challenge.creator_rank}` }}
                    de {{ challenge.total_attempts }}
                  </span>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex space-x-2">
                <button
                  @click="copyToClipboard(getShareUrl(challenge.share_slug))"
                  class="btn btn-secondary flex-1 text-sm"
                >
                  📋 Copiar Link
                </button>
                <button
                  @click="router.push(`/challenge/${challenge.share_slug}`)"
                  class="btn btn-primary flex-1 text-sm"
                >
                  👁️ Ver
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Inactive Challenges -->
        <div v-if="inactiveChallenges.length > 0">
          <h2 class="text-xl font-bold text-gray-700 mb-4 flex items-center">
            <span class="text-2xl mr-2">📦</span>
            Desafíos Inactivos ({{ inactiveChallenges.length }})
          </h2>

          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="challenge in inactiveChallenges"
              :key="challenge.id"
              class="card opacity-60"
            >
              <div class="flex items-start justify-between gap-2 mb-2">
                <h3 class="font-bold text-gray-900 flex-1">
                  {{ challenge.quiz_title }}
                </h3>
                <span v-if="challenge.is_anonymous" class="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full whitespace-nowrap" title="Desafío anónimo">
                  <span>🔒</span>
                </span>
              </div>
              <p class="text-sm text-gray-500 mb-3">
                📅 {{ formatDate(challenge.created_at) }}
              </p>
              <div class="text-sm text-gray-600">
                {{ challenge.total_attempts || 0 }} participantes
              </div>
            </div>
          </div>
        </div>

        <!-- Participated Challenges -->
        <div v-if="participatedChallenges.length > 0" class="mt-8">
          <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span class="text-2xl mr-2">🎯</span>
            Desafíos en los que Participaste ({{ participatedChallenges.length }})
          </h2>

          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="challenge in participatedChallenges"
              :key="challenge.id"
              class="card hover:shadow-lg transition-shadow duration-200 border-2 border-blue-100"
            >
              <div class="mb-4">
                <h3 class="font-bold text-lg text-gray-900 mb-2">
                  {{ challenge.quiz_title }}
                </h3>
                <div class="flex items-center space-x-2 text-sm text-gray-500">
                  <span>📅 {{ formatDate(challenge.created_at) }}</span>
                </div>
              </div>

              <!-- User Stats -->
              <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="bg-blue-50 rounded-lg p-3 text-center">
                  <div class="text-2xl font-bold text-blue-600">
                    {{ challenge.user_score }}%
                  </div>
                  <div class="text-xs text-gray-600">Tu Mejor Score</div>
                </div>
                <div class="bg-purple-50 rounded-lg p-3 text-center">
                  <div class="text-2xl font-bold text-purple-600">
                    {{ challenge.user_attempts }}
                  </div>
                  <div class="text-xs text-gray-600">Intentos</div>
                </div>
              </div>

              <!-- Action Button -->
              <button
                @click="router.push(`/challenge/${challenge.share_slug}`)"
                class="btn btn-primary w-full text-sm"
              >
                👁️ Ver Desafío
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
