<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

const { user, signOut } = useAuth()
const router = useRouter()
const mobileMenuOpen = ref(false)

const handleLogout = async () => {
  try {
    await signOut()
    router.push('/login')
    mobileMenuOpen.value = false
  } catch (error) {
    console.error('Error logging out:', error)
  }
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header responsive -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <router-link :to="user ? '/dashboard' : '/'" class="flex items-center space-x-2">
            <img src="/logo.png" alt="Text2Quiz" class="h-8 sm:h-10 w-auto" />
            <span class="text-xl sm:text-2xl font-bold text-gray-900">Text2Quiz</span>
          </router-link>

          <!-- Desktop Navigation -->
          <nav v-if="user" class="hidden md:flex items-center space-x-6">
            <router-link
              to="/dashboard"
              class="text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              Dashboard
            </router-link>
            <router-link
              to="/documents"
              class="text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              Documentos
            </router-link>
            <router-link
              to="/my-challenges"
              class="text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              🏆 Mis Desafíos
            </router-link>
            <router-link
              to="/upload"
              class="btn btn-primary text-sm"
            >
              Subir
            </router-link>
            <button
              @click="handleLogout"
              class="text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              Salir
            </button>
          </nav>

          <nav v-else class="hidden md:flex items-center space-x-4">
            <router-link
              to="/login"
              class="text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              Iniciar sesión
            </router-link>
            <router-link
              to="/register"
              class="btn btn-primary text-sm"
            >
              Registrarse
            </router-link>
          </nav>

          <!-- Mobile menu button -->
          <button
            v-if="user"
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <nav v-else class="md:hidden flex items-center space-x-2">
            <router-link
              to="/login"
              class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Entrar
            </router-link>
            <router-link
              to="/register"
              class="btn btn-primary text-sm px-3 py-1.5"
            >
              Registro
            </router-link>
          </nav>
        </div>
      </div>

      <!-- Mobile menu -->
      <Transition name="slide">
        <div v-if="user && mobileMenuOpen" class="md:hidden border-t border-gray-200 bg-white">
          <div class="px-4 py-3 space-y-1">
            <router-link
              to="/dashboard"
              @click="closeMobileMenu"
              class="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Dashboard
            </router-link>
            <router-link
              to="/documents"
              @click="closeMobileMenu"
              class="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Documentos
            </router-link>
            <router-link
              to="/my-challenges"
              @click="closeMobileMenu"
              class="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              🏆 Mis Desafíos
            </router-link>
            <router-link
              to="/upload"
              @click="closeMobileMenu"
              class="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Subir documento
            </router-link>
            <button
              @click="handleLogout"
              class="w-full text-left px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </Transition>
    </header>

    <!-- Content -->
    <main>
      <slot />
    </main>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  transform-origin: top;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: scaleY(0.95);
}
</style>
