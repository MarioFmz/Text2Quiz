<script setup lang="ts">
import { ref, watch } from 'vue'
import NotificationModal from './NotificationModal.vue'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface Props {
  show: boolean
  userId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const category = ref<'feature' | 'bug' | 'improvement' | 'other'>('feature')
const title = ref('')
const description = ref('')
const email = ref('')
const submitting = ref(false)

// Notification modal
const showNotification = ref(false)
const notificationType = ref<'success' | 'error' | 'warning' | 'info'>('info')
const notificationMessage = ref('')
const notificationTitle = ref('')

const showNotif = (type: 'success' | 'error' | 'warning' | 'info', message: string, titleText?: string) => {
  notificationType.value = type
  notificationMessage.value = message
  notificationTitle.value = titleText || ''
  showNotification.value = true
}

// Reset form when modal opens
watch(() => props.show, (newValue) => {
  if (newValue) {
    category.value = 'feature'
    title.value = ''
    description.value = ''
    email.value = ''
  }
})

async function handleSubmit() {
  // Validation
  if (!title.value.trim()) {
    showNotif('warning', 'Por favor, ingresa un título para tu sugerencia')
    return
  }

  if (!description.value.trim()) {
    showNotif('warning', 'Por favor, describe tu sugerencia')
    return
  }

  if (description.value.trim().length < 10) {
    showNotif('warning', 'Por favor, proporciona más detalles (mínimo 10 caracteres)')
    return
  }

  submitting.value = true

  try {
    const response = await fetch(`${API_URL}/api/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: props.userId,
        email: email.value.trim() || null,
        category: category.value,
        title: title.value.trim(),
        description: description.value.trim()
      })
    })

    const data = await response.json()

    if (data.success) {
      showNotif('success', '¡Gracias por tu sugerencia! La revisaremos pronto.')
      setTimeout(() => {
        emit('close')
      }, 2000)
    } else {
      showNotif('error', data.error || 'Error al enviar la sugerencia')
    }
  } catch (error) {
    console.error('Error submitting suggestion:', error)
    showNotif('error', 'Error al enviar la sugerencia. Por favor, intenta de nuevo.')
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  emit('close')
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    handleCancel()
  }
}

const categoryOptions = [
  { value: 'feature', label: '✨ Nueva funcionalidad', icon: '✨' },
  { value: 'bug', label: '🐛 Reporte de error', icon: '🐛' },
  { value: 'improvement', label: '💡 Mejora', icon: '💡' },
  { value: 'other', label: '💬 Otro', icon: '💬' }
]
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
            class="relative bg-white rounded-t-2xl sm:rounded-lg shadow-xl max-w-2xl w-full p-6 sm:p-8 transform transition-all"
          >
            <!-- Close button -->
            <button
              @click="handleCancel"
              class="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <!-- Title -->
            <div class="mb-6">
              <h3 class="text-2xl font-bold text-gray-900 mb-2">Buzón de Sugerencias</h3>
              <p class="text-gray-600">
                Comparte tus ideas para mejorar Text2Quiz. Tu feedback es muy valioso.
              </p>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="space-y-6">
              <!-- Category -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Categoría
                </label>
                <div class="grid grid-cols-2 gap-3">
                  <button
                    v-for="option in categoryOptions"
                    :key="option.value"
                    type="button"
                    @click="category = option.value as any"
                    :class="[
                      'flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium text-left',
                      category === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    ]"
                  >
                    <span class="text-xl">{{ option.icon }}</span>
                    <span>{{ option.label }}</span>
                  </button>
                </div>
              </div>

              <!-- Title -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Título <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="title"
                  type="text"
                  placeholder="Resume tu sugerencia en una frase"
                  maxlength="255"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Descripción <span class="text-red-500">*</span>
                </label>
                <textarea
                  v-model="description"
                  rows="5"
                  placeholder="Describe tu sugerencia con detalle. Mientras más información proporciones, mejor podremos entenderte."
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                ></textarea>
                <p class="text-xs text-gray-500 mt-1">
                  {{ description.length }} caracteres (mínimo 10)
                </p>
              </div>

              <!-- Email (optional for anonymous users) -->
              <div v-if="!userId">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Email (opcional)
                </label>
                <input
                  v-model="email"
                  type="email"
                  placeholder="tu@email.com"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p class="text-xs text-gray-500 mt-1">
                  Si deseas que te contactemos sobre tu sugerencia
                </p>
              </div>

              <!-- Actions -->
              <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  @click="handleCancel"
                  class="btn btn-secondary"
                  :disabled="submitting"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="submitting"
                >
                  <span v-if="submitting" class="flex items-center gap-2">
                    <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </span>
                  <span v-else>Enviar Sugerencia</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Notification Modal -->
  <NotificationModal
    :show="showNotification"
    :type="notificationType"
    :title="notificationTitle"
    :message="notificationMessage"
    @close="showNotification = false"
  />
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
</style>
