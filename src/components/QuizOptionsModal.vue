<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  show: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  generate: [options: { numQuestions: number; difficulty: 'easy' | 'medium' | 'hard'; name: string }]
  cancel: []
  close: []
}>()

// Generar nombre por defecto con fecha y hora actual
const getDefaultName = () => {
  const now = new Date()
  const day = now.getDate().toString().padStart(2, '0')
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const year = now.getFullYear()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  return `Quiz ${day}/${month}/${year} ${hours}:${minutes}`
}

const quizName = ref(getDefaultName())
const numQuestions = ref(10)
const difficulty = ref<'easy' | 'medium' | 'hard'>('medium')

const handleGenerate = () => {
  if (!quizName.value.trim()) {
    alert('Por favor, ingresa un nombre para el quiz')
    return
  }

  emit('generate', {
    numQuestions: numQuestions.value,
    difficulty: difficulty.value,
    name: quizName.value
  })
  emit('close')
}

const handleCancel = () => {
  emit('cancel')
  emit('close')
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    handleCancel()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

        <!-- Modal -->
        <div class="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            class="relative bg-white rounded-t-2xl sm:rounded-lg shadow-xl max-w-md w-full p-6 sm:p-6 transform transition-all"
          >
            <!-- Title -->
            <h3 class="text-xl font-semibold mb-6">Opciones del Quiz</h3>

            <!-- Quiz Name -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nombre del quiz
              </label>
              <input
                v-model="quizName"
                type="text"
                placeholder="Ej: Quiz de Matemáticas"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p class="text-xs text-gray-500 mt-1">
                Por defecto: fecha y hora actual
              </p>
            </div>

            <!-- Number of questions -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Número de preguntas
              </label>
              <input
                v-model.number="numQuestions"
                type="range"
                min="5"
                max="20"
                step="1"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div class="flex justify-between text-xs text-gray-500 mt-1">
                <span>5</span>
                <span class="text-lg font-bold text-gray-900">{{ numQuestions }}</span>
                <span>20</span>
              </div>
            </div>

            <!-- Difficulty -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-3">
                Dificultad
              </label>
              <div class="grid grid-cols-3 gap-3">
                <button
                  @click="difficulty = 'easy'"
                  :class="[
                    'px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium',
                    difficulty === 'easy'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  ]"
                >
                  😊 Fácil
                </button>
                <button
                  @click="difficulty = 'medium'"
                  :class="[
                    'px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium',
                    difficulty === 'medium'
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-gray-200 hover:border-gray-300'
                  ]"
                >
                  🤔 Medio
                </button>
                <button
                  @click="difficulty = 'hard'"
                  :class="[
                    'px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium',
                    difficulty === 'hard'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  ]"
                >
                  🔥 Difícil
                </button>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3">
              <button
                @click="handleCancel"
                class="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                @click="handleGenerate"
                class="btn btn-primary"
              >
                Generar Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}

/* Custom range slider styling */
input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #111827;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #111827;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
</style>
