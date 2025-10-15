<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

const { user } = useAuth()
const router = useRouter()

const loading = ref(true)
const challenges = ref<any[]>([])

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
  } catch (error) {
    console.error('Error loading my challenges:', error)
  } finally {
    loading.value = false
  }
}

const copyToClipboard = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url)
    alert('¡Enlace copiado al portapapeles!')
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
    <div class="container mx-auto px-4 py-8">
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
      <div v-else-if="challenges.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4">📝</div>
        <h3 class="text-xl font-semibold text-gray-700 mb-2">
          No has compartido ningún desafío aún
        </h3>
        <p class="text-gray-500 mb-6">
          Completa un quiz y compártelo para crear tu primer desafío
        </p>
        <button
          @click="router.push('/documents')"
          class="btn btn-primary"
        >
          Ver Mis Documentos
        </button>
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
                <h3 class="font-bold text-lg text-gray-900 mb-2">
                  {{ challenge.quiz_title }}
                </h3>
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

              <!-- Share Code -->
              <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                <div class="text-xs text-gray-500 mb-1">Código de acceso:</div>
                <div class="font-mono font-bold text-lg text-gray-900">
                  {{ challenge.share_code }}
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
              <h3 class="font-bold text-gray-900 mb-2">
                {{ challenge.quiz_title }}
              </h3>
              <p class="text-sm text-gray-500 mb-3">
                📅 {{ formatDate(challenge.created_at) }}
              </p>
              <div class="text-sm text-gray-600">
                {{ challenge.total_attempts || 0 }} participantes
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
