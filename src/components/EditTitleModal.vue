<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  show: boolean
  currentTitle: string
  title?: string
  confirmText?: string
  cancelText?: string
}>()

const emit = defineEmits<{
  (e: 'confirm', newTitle: string): void
  (e: 'cancel'): void
  (e: 'close'): void
}>()

const newTitle = ref('')

watch(() => props.show, (isShown) => {
  if (isShown) {
    newTitle.value = props.currentTitle
  }
})

const handleConfirm = () => {
  if (newTitle.value.trim()) {
    emit('confirm', newTitle.value.trim())
    emit('close')
  }
}

const handleCancel = () => {
  emit('cancel')
  emit('close')
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="handleCancel">
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="handleCancel"></div>

      <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all">
        <h3 class="text-xl font-bold text-gray-900 mb-4">
          {{ title || 'Editar título' }}
        </h3>

        <div class="mb-6">
          <label for="quiz-title" class="block text-sm font-medium text-gray-700 mb-2">
            Nuevo título
          </label>
          <input
            id="quiz-title"
            v-model="newTitle"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="Escribe el nuevo título..."
            @keyup.enter="handleConfirm"
            @keyup.escape="handleCancel"
            autofocus
          />
        </div>

        <div class="flex gap-3">
          <button
            @click="handleCancel"
            class="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {{ cancelText || 'Cancelar' }}
          </button>
          <button
            @click="handleConfirm"
            :disabled="!newTitle.trim()"
            class="flex-1 px-4 py-2 text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ confirmText || 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>
