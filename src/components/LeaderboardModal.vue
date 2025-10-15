<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  challengeId: string
  currentUsername?: string
}

interface LeaderboardEntry {
  id: string
  username: string
  score: number
  total_questions: number
  percentage: number
  time_taken: number
  is_perfect: boolean
  completed_at: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const loading = ref(true)
const leaderboard = ref<LeaderboardEntry[]>([])
const error = ref('')

onMounted(async () => {
  await loadLeaderboard()
})

const loadLeaderboard = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/challenges/${props.challengeId}/leaderboard`)

    if (!response.ok) {
      throw new Error('Error al cargar el ranking')
    }

    const data = await response.json()
    leaderboard.value = data.leaderboard
  } catch (err) {
    console.error('Error loading leaderboard:', err)
    error.value = 'No se pudo cargar el ranking'
  } finally {
    loading.value = false
  }
}

const getRankEmoji = (rank: number) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
}

const getPerformanceBadge = (percentage: number) => {
  if (percentage === 100) return '🏆'
  if (percentage >= 90) return '🌟'
  if (percentage >= 80) return '⭐'
  if (percentage >= 70) return '✨'
  return '📚'
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        class="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
        @click.self="emit('close')"
      >
        <div class="bg-white rounded-t-2xl sm:rounded-lg w-full sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <!-- Header -->
          <div class="sticky top-0 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 sm:px-6 py-4 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <span class="text-2xl">🏆</span>
              <h3 class="text-lg sm:text-xl font-bold">Ranking</h3>
            </div>
            <button
              @click="emit('close')"
              class="text-white hover:text-gray-200 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-6">
            <div v-if="loading" class="text-center py-12">
              <p class="text-gray-600">Cargando ranking...</p>
            </div>

            <div v-else-if="error" class="text-center py-12">
              <p class="text-red-600">{{ error }}</p>
            </div>

            <div v-else-if="leaderboard.length === 0" class="text-center py-12">
              <div class="text-4xl mb-4">📊</div>
              <p class="text-gray-600">Aún no hay participantes</p>
              <p class="text-sm text-gray-500 mt-2">¡Sé el primero en completar este quiz!</p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="(entry, index) in leaderboard"
                :key="entry.id"
                class="p-4 rounded-lg border-2 transition-all"
                :class="[
                  entry.username === currentUsername
                    ? 'bg-blue-50 border-blue-300 shadow-md'
                    : 'bg-white border-gray-200 hover:border-gray-300',
                  index < 3 ? 'shadow-lg' : ''
                ]"
              >
                <div class="flex items-center justify-between">
                  <!-- Rank and User Info -->
                  <div class="flex items-center space-x-3 flex-1">
                    <div class="text-center min-w-[3rem]">
                      <div class="text-2xl font-bold">
                        {{ getRankEmoji(index + 1) }}
                      </div>
                      <div v-if="index >= 3" class="text-xs text-gray-500">
                        #{{ index + 1 }}
                      </div>
                    </div>

                    <div class="flex-1">
                      <div class="flex items-center space-x-2 mb-1">
                        <p class="font-semibold text-gray-900">
                          {{ entry.username }}
                        </p>
                        <span v-if="entry.username === currentUsername" class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Tú
                        </span>
                        <span v-if="entry.is_perfect" class="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                          Perfecto
                        </span>
                      </div>
                      <div class="flex items-center space-x-3 text-xs text-gray-500">
                        <span>⏱️ {{ formatTime(entry.time_taken) }}</span>
                        <span>📅 {{ formatDate(entry.completed_at) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Score -->
                  <div class="text-right ml-4">
                    <div class="flex items-center space-x-2">
                      <span class="text-xl">{{ getPerformanceBadge(entry.percentage) }}</span>
                      <div>
                        <div class="text-2xl font-bold" :class="{
                          'text-yellow-600': entry.percentage === 100,
                          'text-green-600': entry.percentage >= 80 && entry.percentage < 100,
                          'text-blue-600': entry.percentage >= 60 && entry.percentage < 80,
                          'text-gray-600': entry.percentage < 60
                        }">
                          {{ entry.percentage }}%
                        </div>
                        <div class="text-xs text-gray-500">
                          {{ entry.score }}/{{ entry.total_questions }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Stats -->
          <div v-if="leaderboard.length > 0" class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-4">
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <div class="text-lg font-bold text-gray-900">{{ leaderboard.length }}</div>
                <div class="text-xs text-gray-600">Participantes</div>
              </div>
              <div>
                <div class="text-lg font-bold text-gray-900">
                  {{ Math.round(leaderboard.reduce((acc, e) => acc + e.percentage, 0) / leaderboard.length) }}%
                </div>
                <div class="text-xs text-gray-600">Promedio</div>
              </div>
              <div>
                <div class="text-lg font-bold text-gray-900">
                  {{ leaderboard.filter(e => e.is_perfect).length }}
                </div>
                <div class="text-xs text-gray-600">Perfectos</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active > div,
.fade-leave-active > div {
  transition: transform 0.3s ease;
}

.fade-enter-from > div {
  transform: translateY(100%);
}

.fade-leave-to > div {
  transform: translateY(100%);
}

@media (min-width: 640px) {
  .fade-enter-from > div,
  .fade-leave-to > div {
    transform: translateY(0) scale(0.95);
  }
}
</style>
