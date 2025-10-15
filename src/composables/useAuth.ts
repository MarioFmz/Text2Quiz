import { useAuthStore } from '@/stores/authStore'
import { storeToRefs } from 'pinia'

export function useAuth() {
  const authStore = useAuthStore()
  const { user, loading, isAuthenticated } = storeToRefs(authStore)

  return {
    user,
    loading,
    isAuthenticated,
    signIn: authStore.signIn,
    signUp: authStore.signUp,
    signOut: authStore.signOut,
    initialize: authStore.initialize
  }
}
