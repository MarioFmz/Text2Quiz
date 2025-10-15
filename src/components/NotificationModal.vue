<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  show: boolean
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  title: ''
})

const emit = defineEmits<{
  close: []
}>()

const iconConfig = computed(() => {
  switch (props.type) {
    case 'success':
      return { icon: '✅', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-800' }
    case 'error':
      return { icon: '❌', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-800' }
    case 'warning':
      return { icon: '⚠️', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-800' }
    default:
      return { icon: 'ℹ️', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-800' }
  }
})

const defaultTitle = computed(() => {
  if (props.title) return props.title
  switch (props.type) {
    case 'success': return 'Éxito'
    case 'error': return 'Error'
    case 'warning': return 'Advertencia'
    default: return 'Información'
  }
})
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full animate-scale-in" @click.stop>
        <!-- Header -->
        <div :class="['p-4 border-b flex items-center justify-between', iconConfig.bgColor, iconConfig.borderColor]">
          <div class="flex items-center space-x-3">
            <span class="text-2xl">{{ iconConfig.icon }}</span>
            <h3 :class="['font-bold text-lg', iconConfig.textColor]">
              {{ defaultTitle }}
            </h3>
          </div>
          <button
            @click="emit('close')"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6">
          <p class="text-gray-700 leading-relaxed">{{ message }}</p>
        </div>

        <!-- Footer -->
        <div class="p-4 bg-gray-50 rounded-b-lg flex justify-end">
          <button
            @click="emit('close')"
            class="btn btn-primary"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out;
}
</style>
