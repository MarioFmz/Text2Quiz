<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'

const { user } = useAuth()
const { success, error: showError } = useToast()

const loading = ref(true)
const saving = ref(false)
const changingPassword = ref(false)

// Profile fields
const firstName = ref('')
const lastName = ref('')
const displayName = ref('')
const bio = ref('')

// Password fields
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPasswordForm = ref(false)

onMounted(async () => {
  await loadProfile()
})

const loadProfile = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/profile/${user.value?.id}`)

    if (response.ok) {
      const data = await response.json()
      if (data.profile) {
        firstName.value = data.profile.first_name || ''
        lastName.value = data.profile.last_name || ''
        displayName.value = data.profile.display_name || ''
        bio.value = data.profile.bio || ''
      }
    }
  } catch (err) {
    console.error('Error loading profile:', err)
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  saving.value = true
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/profile/${user.value?.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: firstName.value,
        last_name: lastName.value,
        display_name: displayName.value,
        bio: bio.value
      })
    })

    if (response.ok) {
      success('Perfil actualizado correctamente')
    } else {
      throw new Error('Error al actualizar el perfil')
    }
  } catch (err) {
    console.error('Error saving profile:', err)
    showError('Error al guardar el perfil')
  } finally {
    saving.value = false
  }
}

const changePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    showError('Las contraseñas no coinciden')
    return
  }

  if (newPassword.value.length < 6) {
    showError('La contraseña debe tener al menos 6 caracteres')
    return
  }

  changingPassword.value = true
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.value?.id,
        currentPassword: currentPassword.value,
        newPassword: newPassword.value
      })
    })

    if (response.ok) {
      success('Contraseña cambiada correctamente')
      currentPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
      showPasswordForm.value = false
    } else {
      throw new Error('Error al cambiar la contraseña')
    }
  } catch (err) {
    console.error('Error changing password:', err)
    showError('Error al cambiar la contraseña')
  } finally {
    changingPassword.value = false
  }
}
</script>

<template>
  <AppLayout>
    <div class="max-w-4xl mx-auto px-3 py-4 sm:px-6 lg:px-8 sm:py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p class="text-gray-600 mt-2">Gestiona tu información personal y configuración de cuenta</p>
      </div>

      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Cargando perfil...</p>
      </div>

      <div v-else class="space-y-6">
        <!-- Profile Information Card -->
        <div class="card">
          <h2 class="text-xl font-bold mb-6 flex items-center space-x-2">
            <span>👤</span>
            <span>Información Personal</span>
          </h2>

          <form @submit.prevent="saveProfile" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  v-model="firstName"
                  type="text"
                  placeholder="Tu nombre"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Apellidos
                </label>
                <input
                  v-model="lastName"
                  type="text"
                  placeholder="Tus apellidos"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nombre para mostrar
                <span class="text-xs text-gray-500 ml-2">(Aparece en los rankings)</span>
              </label>
              <input
                v-model="displayName"
                type="text"
                placeholder="Nombre público"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Email
                <span class="text-xs text-gray-500 ml-2">(No se puede cambiar)</span>
              </label>
              <input
                :value="user?.email"
                type="email"
                disabled
                class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Biografía
              </label>
              <textarea
                v-model="bio"
                rows="3"
                placeholder="Cuéntanos algo sobre ti..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              ></textarea>
            </div>

            <div class="flex justify-end">
              <button
                type="submit"
                :disabled="saving"
                class="btn btn-primary"
                :class="{ 'opacity-50 cursor-not-allowed': saving }"
              >
                {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Change Password Card -->
        <div class="card">
          <h2 class="text-xl font-bold mb-6 flex items-center space-x-2">
            <span>🔒</span>
            <span>Seguridad</span>
          </h2>

          <div v-if="!showPasswordForm">
            <p class="text-gray-600 mb-4">Cambia tu contraseña para mantener tu cuenta segura</p>
            <button
              @click="showPasswordForm = true"
              class="btn btn-secondary"
            >
              Cambiar Contraseña
            </button>
          </div>

          <form v-else @submit.prevent="changePassword" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Contraseña Actual
              </label>
              <input
                v-model="currentPassword"
                type="password"
                placeholder="Tu contraseña actual"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <input
                v-model="newPassword"
                type="password"
                placeholder="Nueva contraseña (mínimo 6 caracteres)"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <input
                v-model="confirmPassword"
                type="password"
                placeholder="Confirma la nueva contraseña"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="showPasswordForm = false"
                class="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                :disabled="changingPassword"
                class="btn btn-primary"
                :class="{ 'opacity-50 cursor-not-allowed': changingPassword }"
              >
                {{ changingPassword ? 'Cambiando...' : 'Cambiar Contraseña' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
