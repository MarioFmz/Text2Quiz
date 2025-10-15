<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  quizId: string
  quizTitle: string
}

const props = defineProps<Props>()

const showModal = ref(false)
const loading = ref(false)
const shareUrl = ref('')
const shareCode = ref('')
const copied = ref(false)

const generateShareLink = async () => {
  loading.value = true
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/challenges/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId: props.quizId })
    })

    if (!response.ok) {
      throw new Error('Error al crear el desafío')
    }

    const data = await response.json()
    shareCode.value = data.share_code
    shareUrl.value = `${window.location.origin}/challenge/${data.share_slug}`
    showModal.value = true
  } catch (error) {
    console.error('Error generating share link:', error)
    alert('Error al generar el enlace de compartir')
  } finally {
    loading.value = false
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('Error copying to clipboard:', error)
  }
}

const closeModal = () => {
  showModal.value = false
  copied.value = false
}
</script>

<template>
  <div>
    <!-- Share Button -->
    <button
      @click="generateShareLink"
      :disabled="loading"
      class="btn btn-secondary w-full sm:w-auto flex items-center justify-center space-x-2"
    >
      <span v-if="loading">⏳</span>
      <span v-else>🔗</span>
      <span>{{ loading ? 'Generando...' : 'Compartir' }}</span>
    </button>

    <!-- Share Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showModal"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          @click.self="closeModal"
        >
          <div class="bg-white rounded-t-2xl sm:rounded-lg w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <!-- Header -->
            <div class="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
              <h3 class="text-lg sm:text-xl font-bold">🔗 Compartir Quiz</h3>
              <button
                @click="closeModal"
                class="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Content -->
            <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <!-- Quiz Title -->
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p class="text-sm text-blue-600 mb-1">Quiz a compartir:</p>
                <p class="font-semibold text-gray-900">{{ quizTitle }}</p>
              </div>

              <!-- Share Code -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Código de acceso
                </label>
                <div class="flex space-x-2">
                  <input
                    :value="shareCode"
                    readonly
                    class="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg font-mono text-lg text-center"
                  />
                  <button
                    @click="copyToClipboard(shareCode)"
                    class="px-4 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors"
                    :class="{ 'bg-green-100 border-green-300': copied }"
                  >
                    <span v-if="copied">✓</span>
                    <span v-else>📋</span>
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-2">
                  Comparte este código con tus amigos para que puedan acceder al quiz
                </p>
              </div>

              <!-- Share URL -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Enlace directo
                </label>
                <div class="flex space-x-2">
                  <input
                    :value="shareUrl"
                    readonly
                    class="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm truncate"
                  />
                  <button
                    @click="copyToClipboard(shareUrl)"
                    class="px-4 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors"
                    :class="{ 'bg-green-100 border-green-300': copied }"
                  >
                    <span v-if="copied">✓</span>
                    <span v-else">📋</span>
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-2">
                  O envía este enlace directamente
                </p>
              </div>

              <!-- Info Box -->
              <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div class="flex space-x-3">
                  <span class="text-xl">💡</span>
                  <div class="flex-1">
                    <p class="text-sm text-gray-700">
                      <strong>¿Cómo funciona?</strong><br/>
                      Tus amigos podrán realizar el quiz y sus resultados aparecerán en el leaderboard.
                      ¡Compitan por el mejor puntaje!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-4">
              <button
                @click="closeModal"
                class="btn btn-primary w-full"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
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

.fade-enter-active .bg-white,
.fade-leave-active .bg-white {
  transition: transform 0.3s ease;
}

.fade-enter-from .bg-white {
  transform: translateY(100%);
}

.fade-leave-to .bg-white {
  transform: translateY(100%);
}

@media (min-width: 640px) {
  .fade-enter-from .bg-white,
  .fade-leave-to .bg-white {
    transform: translateY(0) scale(0.95);
  }
}
</style>
