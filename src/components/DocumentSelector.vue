<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { documentsService } from '@/services/documentsService'
import type { Document } from '@/types'

const { user } = useAuth()

const documents = ref<Document[]>([])
const selectedDocumentIds = ref<Set<string>>(new Set())
const loading = ref(true)
const searchQuery = ref('')

const emit = defineEmits<{
  'update:selectedDocuments': [documentIds: string[]]
}>()

onMounted(async () => {
  await loadDocuments()
})

const loadDocuments = async () => {
  if (!user.value) return

  try {
    loading.value = true
    documents.value = await documentsService.getUserDocuments(user.value.id)
  } catch (error) {
    console.error('Error loading documents:', error)
  } finally {
    loading.value = false
  }
}

const filteredDocuments = computed(() => {
  if (!searchQuery.value) return documents.value

  const query = searchQuery.value.toLowerCase()
  return documents.value.filter(doc =>
    doc.title.toLowerCase().includes(query)
  )
})

const toggleDocument = (documentId: string) => {
  if (selectedDocumentIds.value.has(documentId)) {
    selectedDocumentIds.value.delete(documentId)
  } else {
    selectedDocumentIds.value.add(documentId)
  }
  emit('update:selectedDocuments', Array.from(selectedDocumentIds.value))
}

const isSelected = (documentId: string) => {
  return selectedDocumentIds.value.has(documentId)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const getFileIcon = (fileType: string) => {
  return fileType === 'pdf' ? '📄' : '🖼️'
}
</script>

<template>
  <div class="document-selector">
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-600">Cargando documentos...</p>
    </div>

    <div v-else-if="documents.length === 0" class="text-center py-8">
      <div class="text-4xl mb-3">📚</div>
      <p class="text-gray-600 mb-2">No tienes documentos aún</p>
      <p class="text-sm text-gray-500">Sube documentos primero para poder seleccionarlos</p>
    </div>

    <div v-else>
      <!-- Search Bar -->
      <div class="mb-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar documentos..."
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- Selected Count -->
      <div v-if="selectedDocumentIds.size > 0" class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p class="text-sm text-blue-700 font-medium">
          {{ selectedDocumentIds.size }} documento(s) seleccionado(s)
        </p>
      </div>

      <!-- Document List -->
      <div class="space-y-2 max-h-96 overflow-y-auto">
        <button
          v-for="doc in filteredDocuments"
          :key="doc.id"
          @click="toggleDocument(doc.id)"
          class="w-full text-left p-4 rounded-lg border-2 transition-all"
          :class="[
            isSelected(doc.id)
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          ]"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3 flex-1">
              <!-- Checkbox -->
              <div class="flex-shrink-0">
                <div
                  class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                  :class="[
                    isSelected(doc.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300'
                  ]"
                >
                  <svg
                    v-if="isSelected(doc.id)"
                    class="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              <!-- Document Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2">
                  <span class="text-xl">{{ getFileIcon(doc.file_type) }}</span>
                  <p class="font-medium text-gray-900 truncate">{{ doc.title }}</p>
                </div>
                <p class="text-xs text-gray-500 mt-1">
                  Subido el {{ formatDate(doc.created_at) }}
                </p>
              </div>
            </div>
          </div>
        </button>
      </div>

      <!-- No results -->
      <div v-if="filteredDocuments.length === 0" class="text-center py-8">
        <p class="text-gray-500">No se encontraron documentos con "{{ searchQuery }}"</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.document-selector {
  /* Estilos adicionales si es necesario */
}
</style>
