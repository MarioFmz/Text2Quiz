<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { quizzesService } from '@/services/quizzesService'

const { user } = useAuth()
const router = useRouter()

const stats = ref({
  totalDocuments: 0,
  totalQuizzes: 0,
  averageAccuracy: 0,
  recentProgress: [] as any[]
})
const loading = ref(true)
const userStreak = ref({ current_streak: 0, longest_streak: 0 })

onMounted(async () => {
  if (user.value) {
    stats.value = await quizzesService.getUserStats(user.value.id)
    // TODO: Load streak from API
    loading.value = false
  }
})

const startPracticeMode = (mode: string) => {
  router.push(`/practice?mode=${mode}`)
}
</script>

<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="text-4xl font-bold mb-2">Dashboard</h1>
      <p class="text-gray-600 mb-12">Bienvenido, {{ user?.email }}</p>

      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Cargando estadísticas...</p>
      </div>

      <div v-else class="grid md:grid-cols-3 gap-6">
        <!-- Estadísticas -->
        <div class="card">
          <div class="text-3xl mb-2">📚</div>
          <div class="text-3xl font-bold mb-1">{{ stats.totalDocuments }}</div>
          <div class="text-gray-600">Documentos subidos</div>
        </div>

        <div class="card">
          <div class="text-3xl mb-2">✅</div>
          <div class="text-3xl font-bold mb-1">{{ stats.totalQuizzes }}</div>
          <div class="text-gray-600">Quizzes completados</div>
        </div>

        <div class="card">
          <div class="text-3xl mb-2">📈</div>
          <div class="text-3xl font-bold mb-1">{{ stats.averageAccuracy }}%</div>
          <div class="text-gray-600">Precisión promedio</div>
        </div>
      </div>

      <!-- Práctica Rápida -->
      <div class="mt-12">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold">⚡ Práctica Rápida</h2>
          <div v-if="userStreak.current_streak > 0" class="flex items-center space-x-2 bg-orange-50 px-4 py-2 rounded-lg">
            <span class="text-2xl">🔥</span>
            <span class="font-bold text-orange-600">{{ userStreak.current_streak }} días</span>
          </div>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <!-- Flash Cards -->
          <button
            @click="startPracticeMode('flashcards')"
            class="card hover:shadow-xl transition-all text-left p-6 border-2 border-transparent hover:border-blue-300"
          >
            <div class="text-4xl sm:text-5xl mb-4">🎴</div>
            <h3 class="text-lg sm:text-xl font-bold mb-2">Flash Cards</h3>
            <p class="text-sm text-gray-600 mb-4">
              Repasa conceptos con tarjetas interactivas
            </p>
            <div class="flex items-center space-x-2 text-xs text-gray-500">
              <span>📊</span>
              <span>20 tarjetas</span>
            </div>
          </button>

          <!-- Quiz Express -->
          <button
            @click="startPracticeMode('express')"
            class="card hover:shadow-xl transition-all text-left p-6 border-2 border-transparent hover:border-green-300"
          >
            <div class="text-4xl sm:text-5xl mb-4">⚡</div>
            <h3 class="text-lg sm:text-xl font-bold mb-2">Quiz Express</h3>
            <p class="text-sm text-gray-600 mb-4">
              Quiz rápido de 5 preguntas
            </p>
            <div class="flex items-center space-x-2 text-xs text-gray-500">
              <span>⏱️</span>
              <span>2-3 minutos</span>
            </div>
          </button>

          <!-- Daily Challenge -->
          <button
            @click="startPracticeMode('daily')"
            class="card hover:shadow-xl transition-all text-left p-6 border-2 border-transparent hover:border-purple-300 relative"
          >
            <div class="absolute top-4 right-4 bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full">
              HOY
            </div>
            <div class="text-4xl sm:text-5xl mb-4">🌟</div>
            <h3 class="text-lg sm:text-xl font-bold mb-2">Desafío Diario</h3>
            <p class="text-sm text-gray-600 mb-4">
              Mantén tu racha activa
            </p>
            <div class="flex items-center space-x-2 text-xs text-gray-500">
              <span>🔥</span>
              <span>10 preguntas</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="mt-12">
        <h2 class="text-2xl font-bold mb-6">Acciones rápidas</h2>
        <div class="grid md:grid-cols-2 gap-6">
          <router-link to="/upload" class="card hover:shadow-md transition-shadow">
            <div class="flex items-center space-x-4">
              <div class="text-4xl">📤</div>
              <div>
                <h3 class="text-xl font-semibold mb-1">Subir documento</h3>
                <p class="text-gray-600">Sube un PDF o imagen para generar un quiz</p>
              </div>
            </div>
          </router-link>

          <router-link to="/documents" class="card hover:shadow-md transition-shadow">
            <div class="flex items-center space-x-4">
              <div class="text-4xl">📁</div>
              <div>
                <h3 class="text-xl font-semibold mb-1">Mis documentos</h3>
                <p class="text-gray-600">Ver todos tus documentos y quizzes</p>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
