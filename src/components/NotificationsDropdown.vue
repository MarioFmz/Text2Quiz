<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Notification } from '@/types/database.types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const props = defineProps<{
  userId: string | undefined
}>()

const router = useRouter()

const notifications = ref<Notification[]>([])
const loading = ref(false)
const showDropdown = ref(false)

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

const hasNotifications = computed(() => {
  return notifications.value.length > 0
})

// Fetch notifications
async function fetchNotifications() {
  if (!props.userId) return

  loading.value = true
  try {
    const response = await fetch(`${API_URL}/api/notifications/${props.userId}`)
    const data = await response.json()

    if (data.success) {
      notifications.value = data.notifications
    }
  } catch (error) {
    console.error('Error fetching notifications:', error)
  } finally {
    loading.value = false
  }
}

// Mark notification as read
async function markAsRead(notification: Notification) {
  if (notification.read || !props.userId) return

  try {
    await fetch(`${API_URL}/api/notifications/${notification.id}/read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: props.userId })
    })

    // Update local state
    notification.read = true
  } catch (error) {
    console.error('Error marking notification as read:', error)
  }
}

// Mark all as read
async function markAllAsRead() {
  if (!props.userId || unreadCount.value === 0) return

  try {
    await fetch(`${API_URL}/api/notifications/${props.userId}/read-all`, {
      method: 'PUT'
    })

    // Update local state
    notifications.value.forEach(n => n.read = true)
  } catch (error) {
    console.error('Error marking all as read:', error)
  }
}

// Delete notification
async function deleteNotification(notificationId: string) {
  if (!props.userId) return

  try {
    await fetch(`${API_URL}/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: props.userId })
    })

    // Remove from local state
    notifications.value = notifications.value.filter(n => n.id !== notificationId)
  } catch (error) {
    console.error('Error deleting notification:', error)
  }
}

// Handle notification click
function handleNotificationClick(notification: Notification) {
  markAsRead(notification)

  // Navigate to challenge if it has challenge_id
  if (notification.challenge_id && notification.data?.challenge_slug) {
    showDropdown.value = false
    router.push(`/challenge/${notification.data.challenge_slug}`)
  }
}

// Format time ago
function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Ahora'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

// Toggle dropdown
function toggleDropdown() {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value && notifications.value.length === 0) {
    fetchNotifications()
  }
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.notifications-dropdown')) {
    showDropdown.value = false
  }
}

onMounted(() => {
  if (props.userId) {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    setInterval(fetchNotifications, 30000)
  }
  document.addEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="notifications-dropdown relative">
    <!-- Bell Icon Button -->
    <button
      @click.stop="toggleDropdown"
      class="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      :class="{ 'bg-gray-100': showDropdown }"
    >
      <!-- Bell Icon -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      <!-- Unread Badge -->
      <span
        v-if="unreadCount > 0"
        class="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div
        v-if="showDropdown"
        class="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold">Notificaciones</h3>
          <button
            v-if="unreadCount > 0"
            @click="markAllAsRead"
            class="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Marcar todas como leídas
          </button>
        </div>

        <!-- Notifications List -->
        <div class="max-h-96 overflow-y-auto">
          <div v-if="loading" class="p-8 text-center text-gray-500">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p class="mt-2">Cargando...</p>
          </div>

          <div v-else-if="!hasNotifications" class="p-8 text-center text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-12 w-12 mx-auto mb-2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p>No tienes notificaciones</p>
          </div>

          <div v-else>
            <div
              v-for="notification in notifications"
              :key="notification.id"
              class="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer relative"
              :class="{ 'bg-blue-50': !notification.read }"
              @click="handleNotificationClick(notification)"
            >
              <div class="p-4">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-900 mb-1">
                      {{ notification.title }}
                    </p>
                    <p class="text-sm text-gray-600 break-words">
                      {{ notification.message }}
                    </p>
                    <p class="text-xs text-gray-400 mt-2">
                      {{ timeAgo(notification.created_at) }}
                    </p>
                  </div>

                  <!-- Unread indicator -->
                  <div v-if="!notification.read" class="flex-shrink-0">
                    <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                </div>

                <!-- Delete button -->
                <button
                  @click.stop="deleteNotification(notification.id)"
                  class="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Eliminar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
