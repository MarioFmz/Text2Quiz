<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'

const router = useRouter()
const { signUp } = useAuth()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)
const success = ref(false)

const handleSubmit = async () => {
  try {
    error.value = ''
    loading.value = true

    if (password.value !== confirmPassword.value) {
      error.value = 'Las contraseñas no coinciden'
      return
    }

    if (password.value.length < 6) {
      error.value = 'La contraseña debe tener al menos 6 caracteres'
      return
    }

    await signUp(email.value, password.value)
    success.value = true

    // Redirigir después de registro exitoso
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (e: any) {
    error.value = e.message || 'Error al registrarse'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppLayout>
    <div class="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        <div class="card">
          <h2 class="text-3xl font-bold text-center mb-8">Crear cuenta</h2>

          <div v-if="success" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p class="text-green-800 text-center">
              ¡Cuenta creada! Revisa tu email para confirmar.
            </p>
          </div>

          <form v-else @submit.prevent="handleSubmit" class="space-y-6">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                class="input"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                v-model="password"
                type="password"
                required
                class="input"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                required
                class="input"
                placeholder="••••••••"
              />
            </div>

            <div v-if="error" class="text-red-600 text-sm">
              {{ error }}
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="w-full btn btn-primary"
            >
              {{ loading ? 'Registrando...' : 'Registrarse' }}
            </button>
          </form>

          <p class="text-center text-gray-600 mt-6">
            ¿Ya tienes cuenta?
            <router-link to="/login" class="text-gray-900 font-medium hover:underline">
              Inicia sesión
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
