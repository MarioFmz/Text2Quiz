<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  show: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  confirmClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirmar acción',
  message: '¿Estás seguro?',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  confirmClass: 'btn btn-primary bg-red-600 hover:bg-red-700'
})

const emit = defineEmits<{
  confirm: []
  cancel: []
  close: []
}>()

const handleConfirm = () => {
  emit('confirm')
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
            class="relative bg-white rounded-t-2xl sm:rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all"
          >
            <!-- Title -->
            <h3 class="text-xl font-semibold mb-4">{{ title }}</h3>

            <!-- Message -->
            <p class="text-gray-600 mb-6">{{ message }}</p>

            <!-- Actions -->
            <div class="flex justify-end space-x-3">
              <button
                @click="handleCancel"
                class="btn btn-secondary"
              >
                {{ cancelText }}
              </button>
              <button
                @click="handleConfirm"
                :class="confirmClass"
              >
                {{ confirmText }}
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
</style>
