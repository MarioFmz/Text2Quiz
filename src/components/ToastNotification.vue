<script setup lang="ts">
import { computed } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface Props {
  toast: Toast
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: [id: string]
}>()

const iconConfig = computed(() => {
  switch (props.toast.type) {
    case 'success':
      return { icon: '✅', bgColor: 'bg-green-500', textColor: 'text-white' }
    case 'error':
      return { icon: '❌', bgColor: 'bg-red-500', textColor: 'text-white' }
    case 'warning':
      return { icon: '⚠️', bgColor: 'bg-yellow-500', textColor: 'text-white' }
    default:
      return { icon: 'ℹ️', bgColor: 'bg-blue-500', textColor: 'text-white' }
  }
})
</script>

<template>
  <div
    :class="[
      'toast-notification',
      'flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg',
      'min-w-[300px] max-w-md',
      iconConfig.bgColor,
      iconConfig.textColor
    ]"
  >
    <span class="text-2xl flex-shrink-0">{{ iconConfig.icon }}</span>
    <p class="flex-1 font-medium">{{ toast.message }}</p>
    <button
      @click="emit('close', toast.id)"
      class="flex-shrink-0 hover:opacity-75 transition-opacity"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.toast-notification {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
