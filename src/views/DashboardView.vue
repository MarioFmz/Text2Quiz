<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { quizzesService } from '@/services/quizzesService'
import { useToast } from '@/composables/useToast'

const { user } = useAuth()
const router = useRouter()
const { success } = useToast()

const stats = ref({
  totalDocuments: 0,
  totalQuizzes: 0,
  averageAccuracy: 0,
  recentProgress: [] as any[]
})
const loading = ref(true)
const myChallenges = ref<any[]>([])
const loadingChallenges = ref(true)

onMounted(async () => {
  if (user.value) {
    // Load stats
    stats.value = await quizzesService.getUserStats(user.value.id)
    loading.value = false

    // Load user challenges
    await loadMyChallenges()
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
</script>

<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <!-- Header -->
      <div class="mb-8 sm:mb-12">
        <h1 class="text-3xl sm:text-4xl font-bold mb-2">Dashboard</h1>
        <p class="text-gray-600">Bienvenido, {{ user?.email?.split('@')[0] || 'Usuario' }}</p>
      </div>

      <!-- BIENVENIDA - Cuando NO hay quizzes -->
      <div v-if="!loading && stats.totalQuizzes === 0" class="mb-10 sm:mb-12">
        <div class="card bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 p-8 sm:p-12 text-center">
          <div class="text-6xl sm:text-8xl mb-6 animate-bounce">✨</div>
          <h2 class="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">
            ¡Bienvenido a Text2Quiz!
          </h2>
          <p class="text-lg text-gray-700 mb-6 max-w-2xl mx-auto">
            Transforma tus documentos en quizzes interactivos con IA.
            Empieza creando tu primer quiz ahora.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <router-link
              to="/create-quiz"
              class="btn btn-primary text-lg px-8 py-4 transform hover:scale-105 transition-all"
            >
              ✨ Crear Mi Primer Quiz
            </router-link>
          </div>

          <div class="grid sm:grid-cols-3 gap-6 mt-8 text-left max-w-3xl mx-auto">
            <div class="bg-white rounded-lg p-4 shadow-sm">
              <div class="text-3xl mb-2">🤖</div>
              <h3 class="font-bold mb-1">1. IA Genera Quiz</h3>
              <p class="text-sm text-gray-600">Crea quizzes automáticamente desde tus documentos</p>
            </div>
            <div class="bg-white rounded-lg p-4 shadow-sm">
              <div class="text-3xl mb-2">🎯</div>
              <h3 class="font-bold mb-1">2. Practica y Mejora</h3>
              <p class="text-sm text-gray-600">Aprende con retroalimentación al instante</p>
            </div>
            <div class="bg-white rounded-lg p-4 shadow-sm">
              <div class="text-3xl mb-2">🏆</div>
              <h3 class="font-bold mb-1">3. Compite con Amigos</h3>
              <p class="text-sm text-gray-600">Comparte desafíos y compara resultados</p>
            </div>
          </div>
        </div>
      </div>

      <!-- MIS DESAFÍOS - SOLO SI TIENE DESAFÍOS -->
      <div v-if="!loadingChallenges && myChallenges.length > 0" class="mb-10 sm:mb-12">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold flex items-center space-x-2">
            <span class="text-3xl">🏆</span>
            <span>Mis Desafíos</span>
          </h2>
          <router-link
            to="/my-challenges"
            class="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Ver todos →
          </router-link>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div
            v-for="challenge in myChallenges"
            :key="challenge.id"
            class="card hover:shadow-lg transition-shadow"
          >
            <div class="mb-4">
              <h3 class="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                {{ challenge.quiz_title }}
              </h3>
              <div class="text-xs text-gray-500">
                Compartido hace {{ Math.floor((Date.now() - new Date(challenge.created_at).getTime()) / (1000 * 60 * 60 * 24)) }} días
              </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-3 gap-2 mb-4">
              <div class="bg-blue-50 rounded-lg p-2 text-center">
                <div class="text-lg font-bold text-blue-600">{{ challenge.total_attempts }}</div>
                <div class="text-xs text-gray-600">Intentos</div>
              </div>
              <div class="bg-green-50 rounded-lg p-2 text-center">
                <div class="text-lg font-bold text-green-600">{{ challenge.best_score }}%</div>
                <div class="text-xs text-gray-600">Mejor</div>
              </div>
              <div class="bg-orange-50 rounded-lg p-2 text-center">
                <div class="text-lg font-bold text-orange-600">
                  {{ challenge.creator_rank ? `#${challenge.creator_rank}` : '-' }}
                </div>
                <div class="text-xs text-gray-600">Tu Pos</div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex space-x-2">
              <button
                @click="copyToClipboard(getShareUrl(challenge.share_slug))"
                class="btn btn-secondary flex-1 text-xs sm:text-sm py-2"
              >
                📋 Copiar
              </button>
              <button
                @click="router.push(`/challenge/${challenge.share_slug}`)"
                class="btn btn-primary flex-1 text-xs sm:text-sm py-2"
              >
                Ver
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. ESTADÍSTICAS - Solo cuando hay quizzes -->
      <div v-if="!loading && stats.totalQuizzes > 0">
        <h2 class="text-xl font-bold mb-4 text-gray-700">Tus estadísticas</h2>
        <div class="grid grid-cols-3 gap-3 sm:gap-4">
          <div class="card bg-gray-50 text-center py-4">
            <div class="text-2xl mb-1">📚</div>
            <div class="text-2xl font-bold mb-1">{{ stats.totalDocuments }}</div>
            <div class="text-xs text-gray-600">Documentos</div>
          </div>

          <div class="card bg-gray-50 text-center py-4">
            <div class="text-2xl mb-1">✅</div>
            <div class="text-2xl font-bold mb-1">{{ stats.totalQuizzes }}</div>
            <div class="text-xs text-gray-600">Quizzes</div>
          </div>

          <div class="card bg-gray-50 text-center py-4">
            <div class="text-2xl mb-1">📈</div>
            <div class="text-2xl font-bold mb-1">{{ stats.averageAccuracy }}%</div>
            <div class="text-xs text-gray-600">Precisión</div>
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
