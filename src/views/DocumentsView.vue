<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { documentsService } from '@/services/documentsService'
import { quizzesService } from '@/services/quizzesService'
import type { Document, Quiz } from '@/types'

const router = useRouter()
const { user } = useAuth()

const documents = ref<Document[]>([])
const documentQuizzes = ref<Record<string, Quiz[]>>({})
const loading = ref(true)
const error = ref('')
const deletingId = ref<string | null>(null)

onMounted(async () => {
  await loadDocuments()
})

const loadDocuments = async () => {
  if (!user.value) return

  try {
    loading.value = true
    documents.value = await documentsService.getUserDocuments(user.value.id)

    // Cargar quizzes para cada documento
    for (const doc of documents.value) {
      const quizzes = await quizzesService.getDocumentQuizzes(doc.id)
      documentQuizzes.value[doc.id] = quizzes
    }
  } catch (e: any) {
    error.value = e.message || 'Error al cargar documentos'
  } finally {
    loading.value = false
  }
}

const generateQuiz = async (documentId: string) => {
  try {
    const { quiz } = await documentsService.generateQuizFromDocument(documentId)
    router.push(`/quiz/${quiz.id}`)
  } catch (e: any) {
    error.value = e.message || 'Error al generar quiz'
  }
}

const goToQuiz = (quizId: string) => {
  router.push(`/quiz/${quizId}`)
}

const deleteDocument = async (documentId: string) => {
  if (!user.value || !confirm('¿Eliminar este documento y todos sus quizzes?')) return

  try {
    deletingId.value = documentId
    await documentsService.deleteDocument(documentId, user.value.id)
    documents.value = documents.value.filter(d => d.id !== documentId)
  } catch (e: any) {
    error.value = e.message || 'Error al eliminar documento'
  } finally {
    deletingId.value = null
  }
}

const getFileTypeIcon = (fileType: string) => {
  return fileType === 'pdf' ? '📄' : '🖼️'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-4xl font-bold">Mis documentos</h1>
        <router-link to="/upload" class="btn btn-primary">
          Subir nuevo
        </router-link>
      </div>

      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Cargando documentos...</p>
      </div>

      <div v-else-if="documents.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4">📄</div>
        <h2 class="text-2xl font-semibold mb-2">No hay documentos aún</h2>
        <p class="text-gray-600 mb-6">Sube tu primer documento para comenzar</p>
        <router-link to="/upload" class="btn btn-primary">
          Subir documento
        </router-link>
      </div>

      <div v-else>
        <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-800">{{ error }}</p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="doc in documents" :key="doc.id" class="card hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center space-x-3">
                <span class="text-3xl">{{ getFileTypeIcon(doc.file_type) }}</span>
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold truncate">{{ doc.title }}</h3>
                  <p class="text-sm text-gray-500">{{ formatDate(doc.created_at) }}</p>
                </div>
              </div>
            </div>

            <div class="mb-4">
              <p class="text-sm text-gray-600">
                {{ documentQuizzes[doc.id]?.length || 0 }} quiz(zes) generados
              </p>
            </div>

            <div class="space-y-2">
              <button
                @click="generateQuiz(doc.id)"
                class="w-full btn btn-primary text-sm"
              >
                Generar nuevo quiz
              </button>

              <div v-if="documentQuizzes[doc.id]?.length" class="space-y-1">
                <button
                  v-for="quiz in documentQuizzes[doc.id]"
                  :key="quiz.id"
                  @click="goToQuiz(quiz.id)"
                  class="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {{ quiz.title }}
                </button>
              </div>

              <button
                @click="deleteDocument(doc.id)"
                :disabled="deletingId === doc.id"
                class="w-full btn btn-secondary text-sm text-red-600 hover:text-red-700"
              >
                {{ deletingId === doc.id ? 'Eliminando...' : 'Eliminar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
