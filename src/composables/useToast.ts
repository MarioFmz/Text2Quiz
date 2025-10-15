import { ref } from 'vue'
import type { Toast } from '@/components/ToastNotification.vue'

const toasts = ref<Toast[]>([])

export function useToast() {
  const addToast = (
    message: string,
    type: Toast['type'] = 'info',
    duration: number = 3000
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2)

    const toast: Toast = {
      id,
      message,
      type,
      duration
    }

    toasts.value.push(toast)

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  // Convenience methods
  const success = (message: string, duration?: number) =>
    addToast(message, 'success', duration)

  const error = (message: string, duration?: number) =>
    addToast(message, 'error', duration)

  const warning = (message: string, duration?: number) =>
    addToast(message, 'warning', duration)

  const info = (message: string, duration?: number) =>
    addToast(message, 'info', duration)

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}
