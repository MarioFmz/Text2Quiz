<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import QuizOptionsModal from '@/components/QuizOptionsModal.vue'
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
const generatingQuizFor = ref<string | null>(null)
const showDeleteModal = ref(false)
const documentToDelete = ref<string | null>(null)
const showQuizOptionsModal = ref(false)
const documentForQuiz = ref<string | null>(null)

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

const promptGenerateQuiz = (documentId: string) => {
  documentForQuiz.value = documentId
  showQuizOptionsModal.value = true
}

const generateQuiz = async (options: { numQuestions: number; difficulty: 'easy' | 'medium' | 'hard' }) => {
  if (!documentForQuiz.value) return

  try {
    generatingQuizFor.value = documentForQuiz.value
    error.value = ''

    const { quiz } = await documentsService.generateQuizFromDocument(
      documentForQuiz.value,
      options
    )

    // Recargar los quizzes del documento
    const quizzes = await quizzesService.getDocumentQuizzes(documentForQuiz.value)
    documentQuizzes.value[documentForQuiz.value] = quizzes

    // Redirigir al quiz recién creado
    router.push(`/quiz/${quiz.id}`)
  } catch (e: any) {
    error.value = e.message || 'Error al generar quiz'
    console.error('Error generating quiz:', e)
  } finally {
    generatingQuizFor.value = null
    documentForQuiz.value = null
  }
}

const goToQuiz = (quizId: string) => {
  router.push(`/quiz/${quizId}`)
}

const promptDeleteDocument = (documentId: string) => {
  documentToDelete.value = documentId
  showDeleteModal.value = true
}

const confirmDeleteDocument = async () => {
  if (!user.value || !documentToDelete.value) return

  try {
    deletingId.value = documentToDelete.value
    await documentsService.deleteDocument(documentToDelete.value, user.value.id)
    documents.value = documents.value.filter(d => d.id !== documentToDelete.value)
  } catch (e: any) {
    error.value = e.message || 'Error al eliminar documento'
  } finally {
    deletingId.value = null
    documentToDelete.value = null
  }
}

const cancelDelete = () => {
  documentToDelete.value = null
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

const viewDocument = async (filePath: string) => {
  try {
    // Generar URL firmada temporal (válida por 1 hora)
    const signedUrl = await documentsService.getSignedUrl(filePath)
    window.open(signedUrl, '_blank')
  } catch (e: any) {
    error.value = 'Error al generar acceso al documento'
    console.error('Error getting signed URL:', e)
  }
}
</script>

<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto px-3 py-4 sm:px-6 lg:px-8 sm:py-8">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold">Mis documentos</h1>
        <router-link to="/upload" class="btn btn-primary w-full sm:w-auto text-center">
          Subir nuevo
        </router-link>
      </div>

      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Cargando documentos...</p>
      </div>

      <div v-else-if="documents.length === 0" class="max-w-2xl mx-auto">
        <div class="text-center py-16 px-4">
          <!-- Large animated icon -->
          <div class="mb-8">
            <div class="text-7xl sm:text-8xl mb-4 transform hover:scale-110 transition-transform duration-300">📚</div>
          </div>

          <!-- Engaging heading with gradient -->
          <h2 class="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600">
            ¡Transforma tus documentos en conocimiento!
          </h2>

          <!-- Descriptive and encouraging text -->
          <p class="text-lg text-gray-600 mb-8 leading-relaxed">
            Sube cualquier PDF, imagen o documento y nuestra
            <span class="font-semibold text-blue-600">inteligencia artificial</span> lo convertirá en quizzes interactivos.
            <br />
            <span class="text-gray-500">Aprende de forma más eficiente y divertida.</span>
          </p>

          <!-- Primary action button -->
          <div class="mb-12">
            <router-link
              to="/upload"
              class="group relative inline-flex px-10 py-5 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
            >
              <span class="flex items-center gap-3">
                <span class="text-2xl">📤</span>
                <span>Subir tu primer documento</span>
                <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </router-link>
          </div>

          <!-- Features grid -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
            <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 transform hover:scale-105 transition-all duration-300">
              <div class="text-4xl mb-3">📄</div>
              <h3 class="font-bold text-gray-900 mb-2">Múltiples formatos</h3>
              <p class="text-sm text-gray-600">PDFs, imágenes y más</p>
            </div>
            <div class="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl p-6 transform hover:scale-105 transition-all duration-300">
              <div class="text-4xl mb-3">⚡</div>
              <h3 class="font-bold text-gray-900 mb-2">Generación rápida</h3>
              <p class="text-sm text-gray-600">Quizzes en segundos</p>
            </div>
            <div class="bg-gradient-to-br from-teal-50 to-green-50 rounded-xl p-6 transform hover:scale-105 transition-all duration-300">
              <div class="text-4xl mb-3">🎯</div>
              <h3 class="font-bold text-gray-900 mb-2">Personalizable</h3>
              <p class="text-sm text-gray-600">Dificultad y cantidad</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-800">{{ error }}</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                @click="viewDocument(doc.file_url)"
                class="w-full btn btn-secondary text-sm flex items-center justify-center space-x-2"
              >
                <span>👁️</span>
                <span>Ver documento</span>
              </button>

              <button
                @click="promptGenerateQuiz(doc.id)"
                :disabled="generatingQuizFor === doc.id"
                class="w-full btn btn-primary text-sm"
                :class="{ 'opacity-50 cursor-not-allowed': generatingQuizFor === doc.id }"
              >
                {{ generatingQuizFor === doc.id ? 'Generando quiz...' : 'Generar nuevo quiz' }}
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
                @click="promptDeleteDocument(doc.id)"
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

    <!-- Quiz Options Modal -->
    <QuizOptionsModal
      :show="showQuizOptionsModal"
      @generate="generateQuiz"
      @cancel="documentForQuiz = null"
      @close="showQuizOptionsModal = false"
    />

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      :show="showDeleteModal"
      title="Eliminar documento"
      message="¿Estás seguro de que deseas eliminar este documento y todos sus quizzes asociados? Esta acción no se puede deshacer."
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      @confirm="confirmDeleteDocument"
      @cancel="cancelDelete"
      @close="showDeleteModal = false"
    />
  </AppLayout>
</template>
