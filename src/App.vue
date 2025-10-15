<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

// Inicializar la autenticación al cargar la app
onMounted(() => {
  authStore.initialize()
})
</script>

<template>
  <div id="app" class="min-h-screen">
    <RouterView />
  </div>
</template>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
