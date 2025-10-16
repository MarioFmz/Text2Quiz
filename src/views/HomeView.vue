<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

const { isAuthenticated } = useAuth()
const router = useRouter()
const showContent = ref(false)

onMounted(() => {
  setTimeout(() => {
    showContent.value = true
  }, 100)
})

const handleGetStarted = () => {
  if (isAuthenticated.value) {
    router.push('/dashboard')
  } else {
    router.push('/register')
  }
}

const features = [
  {
    icon: '📚',
    title: 'Sube tus documentos',
    description: 'PDFs, imágenes o texto. Nuestra IA procesará cualquier formato.',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: '✨',
    title: 'Generación inteligente',
    description: 'IA avanzada crea preguntas personalizadas basadas en tu contenido.',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: '🎯',
    title: 'Practica y domina',
    description: 'Feedback instantáneo y estadísticas para mejorar tu aprendizaje.',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    icon: '📊',
    title: 'Seguimiento del progreso',
    description: 'Visualiza tu evolución con gráficos y métricas detalladas.',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: '🏆',
    title: 'Retos compartidos',
    description: 'Compite con amigos y comparte tus quizzes favoritos.',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    icon: '📖',
    title: 'Biblioteca de exámenes',
    description: 'Accede a exámenes oficiales de oposiciones verificados.',
    gradient: 'from-indigo-500 to-purple-500'
  }
]

const stats = [
  { value: '10K+', label: 'Quizzes creados' },
  { value: '5K+', label: 'Usuarios activos' },
  { value: '98%', label: 'Satisfacción' }
]
</script>

<template>
  <AppLayout>
    <div class="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen">
      <!-- Hero Section con animación -->
      <div class="relative overflow-hidden">
        <!-- Decorative elements -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div class="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div :class="['text-center py-16 sm:py-24 transition-all duration-1000', showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10']">
            <!-- Logo con efecto hover -->
            <div class="flex justify-center mb-8 group">
              <div class="relative">
                <div class="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-lg opacity-25 group-hover:opacity-40 transition-opacity"></div>
                <img src="/logo.png" alt="Text2Quiz Logo" class="relative h-24 sm:h-32 w-auto transition-transform duration-300 group-hover:scale-110" />
              </div>
            </div>

            <!-- Título con gradiente -->
            <h1 class="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 leading-tight">
              Aprende más rápido<br class="hidden sm:block" />
              <span class="bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-orange-500">
                con inteligencia artificial
              </span>
            </h1>

            <p class="text-lg sm:text-xl md:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto px-4 font-light">
              Transforma cualquier documento en quizzes interactivos.
              <span class="font-semibold text-indigo-600">Aprende jugando</span> y domina cualquier tema en minutos.
            </p>

            <!-- CTA -->
            <div class="flex justify-center px-4">
              <button
                @click="handleGetStarted"
                class="group relative px-10 py-5 text-lg font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <span class="relative z-10 flex items-center gap-2">
                  Comenzar gratis
                  <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div class="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>

            <!-- Stats -->
            <div class="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div v-for="stat in stats" :key="stat.label" class="text-center">
                <div class="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  {{ stat.value }}
                </div>
                <div class="text-sm sm:text-base text-gray-600 mt-1">{{ stat.label }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Features Section -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Todo lo que necesitas para
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              aprender mejor
            </span>
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Herramientas potentes diseñadas para estudiantes y profesionales
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div
            v-for="(feature, index) in features"
            :key="feature.title"
            :class="['group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100', showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10']"
            :style="{ transitionDelay: `${index * 100 + 200}ms` }"
          >
            <!-- Gradient background on hover -->
            <div :class="['absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity', feature.gradient]"></div>

            <div class="relative">
              <!-- Icon -->
              <div :class="['w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-3xl mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300', feature.gradient]">
                {{ feature.icon }}
              </div>

              <!-- Content -->
              <h3 class="text-xl font-bold text-gray-900 mb-3">
                {{ feature.title }}
              </h3>
              <p class="text-gray-600 leading-relaxed">
                {{ feature.description }}
              </p>
            </div>

            <!-- Decorative corner -->
            <div :class="['absolute top-0 right-0 w-20 h-20 bg-gradient-to-br opacity-10 rounded-bl-full', feature.gradient]"></div>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div class="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl overflow-hidden shadow-2xl">
          <!-- Pattern overlay -->
          <div class="absolute inset-0 opacity-10">
            <div class="absolute inset-0" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 40px 40px;"></div>
          </div>

          <div class="relative px-8 py-16 sm:px-16 sm:py-20 text-center">
            <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              ¿Listo para transformar tu aprendizaje?
            </h2>
            <p class="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Únete a miles de estudiantes que ya están aprendiendo de forma más inteligente
            </p>
            <button
              @click="handleGetStarted"
              class="px-10 py-5 text-lg font-bold text-indigo-600 bg-white rounded-xl hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
            >
              Comenzar ahora - Es gratis
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
</style>
