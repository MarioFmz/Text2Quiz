<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import { useAuth } from '@/composables/useAuth'
import { ref, onMounted } from 'vue'
import { quizzesService } from '@/services/quizzesService'

const { user } = useAuth()

const stats = ref({
  totalDocuments: 0,
  totalQuizzes: 0,
  averageAccuracy: 0,
  recentProgress: [] as any[]
})
const loading = ref(true)

onMounted(async () => {
  if (user.value) {
    stats.value = await quizzesService.getUserStats(user.value.id)
    loading.value = false
  }
})
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
