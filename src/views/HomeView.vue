<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

const { isAuthenticated } = useAuth()
const router = useRouter()

const handleGetStarted = () => {
  if (isAuthenticated.value) {
    router.push('/dashboard')
  } else {
    router.push('/register')
  }
}
</script>

<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Hero Section - Minimalista -->
      <div class="text-center py-20">
        <h1 class="text-5xl font-bold text-gray-900 mb-6">
          Aprende más rápido con IA
        </h1>
        <p class="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Sube tus documentos PDF o imágenes y genera quizzes personalizados
          para practicar y dominar cualquier tema.
        </p>
        <button @click="handleGetStarted" class="btn btn-primary text-lg px-8 py-3">
          Comenzar ahora
        </button>
      </div>

      <!-- Features -->
      <div class="grid md:grid-cols-3 gap-8 py-20">
        <div class="text-center">
          <div class="text-4xl mb-4">📄</div>
          <h3 class="text-xl font-semibold mb-2">Sube documentos</h3>
          <p class="text-gray-600">
            PDFs e imágenes procesados automáticamente
          </p>
        </div>

        <div class="text-center">
          <div class="text-4xl mb-4">🤖</div>
          <h3 class="text-xl font-semibold mb-2">IA inteligente</h3>
          <p class="text-gray-600">
            Genera preguntas relevantes con OpenAI
          </p>
        </div>

        <div class="text-center">
          <div class="text-4xl mb-4">📊</div>
          <h3 class="text-xl font-semibold mb-2">Sigue tu progreso</h3>
          <p class="text-gray-600">
            Estadísticas y feedback personalizado
          </p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
