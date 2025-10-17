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
const myRankings = ref<any[]>([])

onMounted(async () => {
  if (!user.value) {
    router.push('/login')
    return
  }
  await loadMyRankings()
})

const loadMyRankings = async () => {
  loading.value = true
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/challenges/my-challenges?userId=${user.value?.id}`)

    if (!response.ok) {
      throw new Error('Error loading rankings')
    }

    const data = await response.json()

    // Combinar quizzes creados y participados en una sola lista de rankings
    const created = (data.challenges || []).map((c: any) => ({
      ...c,
      userScore: c.creator_percentage || 0,
      userRank: c.creator_rank || null,
      userAttempts: c.total_attempts || 0,
      isCreator: true
    }))

    const participated = (data.participated || []).map((c: any) => ({
      ...c,
      userScore: c.user_score || 0,
      userRank: c.user_rank || null,
      userAttempts: c.user_attempts || 0,
      isCreator: false
    }))

    // Combinar y ordenar por fecha más reciente
    myRankings.value = [...created, ...participated].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    console.log('📊 Rankings loaded:', myRankings.value)
    console.log('📝 Sample ranking:', myRankings.value[0])
  } catch (error) {
    console.error('Error loading rankings:', error)
  } finally {
    loading.value = false
  }
}

const copyToClipboard = async (ranking: any) => {
  try {
    const url = getShareUrl(ranking.share_slug)
    const emoji = ranking.userScore >= 90 ? '🏆' : ranking.userScore >= 70 ? '🎯' : '💪'

    let shareTitle = ''
    let shareText = ''

    if (ranking.userRank && ranking.userRank <= 3) {
      // Si está en top 3, presumir la posición
      const positions = ['🥇 primer lugar', '🥈 segundo lugar', '🥉 tercer lugar']
      shareTitle = `${emoji} ¡Estoy en ${positions[ranking.userRank - 1]}!`
      shareText = `Acabo de conseguir ${ranking.userScore}% en el desafío: "${ranking.quiz_title}"\n\n¿Puedes superarme?`
    } else {
      // Si no está en top 3, texto de reto general
      shareTitle = `${emoji} ¿Puedes superarme?`
      shareText = `Acabo de conseguir ${ranking.userScore}% en el desafío: "${ranking.quiz_title}"\n\n¡Demuestra que puedes hacerlo mejor!`
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

const getRankDisplay = (rank: number | null, total: number) => {
  if (!rank) return '—'
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-600'
  if (score >= 70) return 'text-blue-600'
  if (score >= 50) return 'text-orange-600'
  return 'text-red-600'
}

const totalQuizzes = computed(() => myRankings.value.length)
const averageScore = computed(() => {
  if (myRankings.value.length === 0) return 0
  const sum = myRankings.value.reduce((acc, r) => acc + r.userScore, 0)
  return Math.round(sum / myRankings.value.length)
})
const topRankings = computed(() =>
  myRankings.value.filter(r => r.userRank && r.userRank <= 3).length
)
</script>

<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto px-3 py-4 sm:px-6 lg:px-8 sm:py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Mis Rankings y Estadísticas</h1>
        <p class="text-gray-600">
          Revisa tu desempeño y posición en los rankings globales de todos tus quizzes
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="myRankings.length === 0" class="max-w-3xl mx-auto">
        <div class="text-center py-16 px-4">
          <!-- Large animated icon -->
          <div class="mb-8">
            <div class="text-7xl sm:text-8xl mb-4 transform hover:rotate-12 transition-transform duration-300">🏆</div>
          </div>

          <!-- Engaging heading with gradient -->
          <h2 class="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-red-600 to-pink-600">
            ¡Empieza a competir en rankings globales!
          </h2>

          <!-- Descriptive and encouraging text -->
          <p class="text-lg text-gray-600 mb-8 leading-relaxed">
            Aún no has completado ningún quiz.
            <span class="font-semibold text-orange-600">Completa tus primeros quizzes</span> para aparecer en los rankings globales
            y <span class="font-semibold text-red-600">competir con otros usuarios</span>.
          </p>

          <!-- Multiple action buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <router-link
              to="/quizzes"
              class="group relative px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-orange-600 to-red-600 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
            >
              <span class="flex items-center justify-center gap-2">
                <span>📚</span>
                <span>Empezar con mis quizzes</span>
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
                <span>Explorar quizzes públicos</span>
              </span>
            </router-link>
          </div>

          <!-- How it works cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div class="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 text-left transform hover:scale-105 transition-all duration-300 border border-orange-100">
              <div class="flex items-center gap-3 mb-3">
                <div class="text-3xl">1️⃣</div>
                <h3 class="font-bold text-gray-900">Completa quizzes</h3>
              </div>
              <p class="text-sm text-gray-600">Tu puntuación se guarda automáticamente</p>
            </div>

            <div class="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 text-left transform hover:scale-105 transition-all duration-300 border border-red-100">
              <div class="flex items-center gap-3 mb-3">
                <div class="text-3xl">2️⃣</div>
                <h3 class="font-bold text-gray-900">Compite globalmente</h3>
              </div>
              <p class="text-sm text-gray-600">Cada quiz tiene su ranking mundial</p>
            </div>

            <div class="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 text-left transform hover:scale-105 transition-all duration-300 border border-pink-100">
              <div class="flex items-center gap-3 mb-3">
                <div class="text-3xl">3️⃣</div>
                <h3 class="font-bold text-gray-900">Mejora tu posición</h3>
              </div>
              <p class="text-sm text-gray-600">Intenta de nuevo para subir en el ranking</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Rankings and Statistics -->
      <div v-else>
        <!-- Stats Overview -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div class="card bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">Total de Quizzes</p>
                <p class="text-3xl font-bold text-blue-600">{{ totalQuizzes }}</p>
              </div>
              <div class="text-4xl">📊</div>
            </div>
          </div>

          <div class="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">Promedio General</p>
                <p class="text-3xl font-bold text-green-600">{{ averageScore }}%</p>
              </div>
              <div class="text-4xl">📈</div>
            </div>
          </div>

          <div class="card bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">Top 3 Rankings</p>
                <p class="text-3xl font-bold text-orange-600">{{ topRankings }}</p>
              </div>
              <div class="text-4xl">🏆</div>
            </div>
          </div>
        </div>

        <!-- Rankings List -->
        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span class="text-2xl mr-2">🎯</span>
            Mis Rankings ({{ myRankings.length }})
          </h2>

          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="ranking in myRankings"
              :key="ranking.id"
              class="card hover:shadow-lg transition-shadow duration-200"
            >
              <!-- Quiz Header -->
              <div class="mb-3">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <h3 class="font-bold text-base text-gray-900 flex-1 line-clamp-2">
                    {{ ranking.quiz_title }}
                  </h3>
                  <span v-if="ranking.isCreator" class="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full whitespace-nowrap" title="Quiz creado por ti">
                    ✨
                  </span>
                </div>
                <div class="text-xs text-gray-500">
                  📅 {{ formatDate(ranking.created_at) }}
                </div>
              </div>

              <!-- Stats Compact Grid -->
              <div class="grid grid-cols-3 gap-2 mb-3">
                <!-- Your Score -->
                <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-2 text-center">
                  <div class="text-lg font-bold" :class="getScoreColor(ranking.userScore)">
                    {{ ranking.userScore }}%
                  </div>
                  <div class="text-xs text-gray-600">Tu Score</div>
                </div>

                <!-- Your Rank -->
                <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-2 text-center">
                  <div class="text-lg font-bold text-purple-600">
                    {{ getRankDisplay(ranking.userRank, ranking.total_attempts || ranking.userAttempts) }}
                  </div>
                  <div class="text-xs text-gray-600">Posición</div>
                </div>

                <!-- Total Participants -->
                <div class="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-2 text-center">
                  <div class="text-lg font-bold text-gray-700">
                    {{ ranking.total_attempts || ranking.userAttempts || 0 }}
                  </div>
                  <div class="text-xs text-gray-600">Total</div>
                </div>
              </div>

              <!-- Ranking Badge (if Top 3) -->
              <div v-if="ranking.userRank && ranking.userRank <= 3" class="mb-3 p-2 rounded-lg text-center"
                :class="{
                  'bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-300': ranking.userRank === 1,
                  'bg-gradient-to-r from-gray-100 to-slate-100 border-2 border-gray-300': ranking.userRank === 2,
                  'bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300': ranking.userRank === 3
                }"
              >
                <span class="text-sm font-bold"
                  :class="{
                    'text-yellow-700': ranking.userRank === 1,
                    'text-gray-700': ranking.userRank === 2,
                    'text-orange-700': ranking.userRank === 3
                  }"
                >
                  {{ ranking.userRank === 1 ? '🥇 ¡Primer Lugar!' : ranking.userRank === 2 ? '🥈 Segundo Lugar' : '🥉 Tercer Lugar' }}
                </span>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-col space-y-2">
                <button
                  @click="copyToClipboard(ranking)"
                  class="btn btn-primary w-full text-xs sm:text-sm py-2.5 flex items-center justify-center gap-2"
                  title="Copiar mensaje motivador + enlace"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  <span>Compartir</span>
                </button>
                <button
                  @click="router.push(`/challenge/${ranking.share_slug}`)"
                  class="btn btn-secondary w-full text-xs sm:text-sm py-2"
                >
                  Ver Desafío
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
