<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

const { user, signOut } = useAuth()
const router = useRouter()

const handleLogout = async () => {
  try {
    await signOut()
    router.push('/login')
  } catch (error) {
    console.error('Error logging out:', error)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header minimalista -->
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <router-link to="/" class="flex items-center space-x-2">
            <span class="text-2xl font-bold text-gray-900">Text2Quiz</span>
          </router-link>

          <nav v-if="user" class="flex items-center space-x-6">
            <router-link
              to="/dashboard"
              class="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Dashboard
            </router-link>
            <router-link
              to="/documents"
              class="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Documentos
            </router-link>
            <router-link
              to="/upload"
              class="btn btn-primary"
            >
              Subir documento
            </router-link>
            <button
              @click="handleLogout"
              class="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Salir
            </button>
          </nav>

          <nav v-else class="flex items-center space-x-4">
            <router-link
              to="/login"
              class="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Iniciar sesión
            </router-link>
            <router-link
              to="/register"
              class="btn btn-primary"
            >
              Registrarse
            </router-link>
          </nav>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main>
      <slot />
    </main>
  </div>
</template>
