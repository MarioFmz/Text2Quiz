<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  badge: {
    type: string
    level: number
    title: string
    description: string
    icon: string
  }
  autoClose?: boolean
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoClose: true,
  duration: 5000
})

const emit = defineEmits<{
  close: []
}>()

const visible = ref(false)

onMounted(() => {
  // Animate in
  setTimeout(() => {
    visible.value = true
  }, 100)

  // Auto close
  if (props.autoClose) {
    setTimeout(() => {
      close()
    }, props.duration)
  }
})

const close = () => {
  visible.value = false
  setTimeout(() => {
    emit('close')
  }, 300)
}
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="visible"
      class="fixed bottom-4 right-4 max-w-sm z-50 pointer-events-auto"
    >
      <div class="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg shadow-2xl p-6 text-white">
        <button
          @click="close"
          class="absolute top-2 right-2 text-white hover:text-gray-200 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div class="flex items-start space-x-4">
          <div class="text-5xl">{{ badge.icon }}</div>
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-1">
              <span class="text-xs font-bold bg-white bg-opacity-30 px-2 py-0.5 rounded-full">
                NUEVO LOGRO
              </span>
            </div>
            <h3 class="text-lg font-bold mb-1">{{ badge.title }}</h3>
            <p class="text-sm text-white text-opacity-90">{{ badge.description }}</p>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-white border-opacity-30">
          <div class="flex items-center justify-between text-xs">
            <span>Nivel {{ badge.level }}</span>
            <span>🎉 ¡Sigue así!</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(100px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
