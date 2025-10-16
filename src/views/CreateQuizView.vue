<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import DocumentSelector from '@/components/DocumentSelector.vue'
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { documentsService } from '@/services/documentsService'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { user } = useAuth()
const { success: showSuccess, error: showError } = useToast()

// Form fields
const quizTitle = ref('')
const selectedDocumentIds = ref<string[]>([])
const newFiles = ref<File[]>([])
const difficulty = ref<'easy' | 'medium' | 'hard'>('medium')
const numQuestions = ref(10)

// UI state
const activeTab = ref<'upload' | 'library'>('upload')
const uploading = ref(false)
const generating = ref(false)
const uploadProgress = ref('')

const canGenerate = computed(() => {
  return quizTitle.value.trim().length > 0 &&
         (selectedDocumentIds.value.length > 0 || newFiles.value.length > 0)
})

const handleFilesSelected = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files) {
    const files = Array.from(target.files)

    // Validar archivos
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    const invalidFiles = files.filter(f => !validTypes.includes(f.type))

    if (invalidFiles.length > 0) {
      showError('Algunos archivos no son válidos. Usa PDF, JPG o PNG.')
      return
    }

    // Validar tamaño (10MB por archivo)
    const maxSize = 10 * 1024 * 1024
    const tooLargeFiles = files.filter(f => f.size > maxSize)

    if (tooLargeFiles.length > 0) {
      showError('Algunos archivos son demasiado grandes. Máximo 10MB cada uno.')
      return
    }

    newFiles.value = [...newFiles.value, ...files]
  }
}

const removeFile = (index: number) => {
  newFiles.value.splice(index, 1)
}

const handleSelectedDocuments = (documentIds: string[]) => {
  selectedDocumentIds.value = documentIds
}

const generateQuiz = async () => {
  if (!user.value || !canGenerate.value) return

  try {
    generating.value = true
    uploadProgress.value = 'Preparando...'

    // Paso 1: Subir nuevos archivos si hay
    const uploadedDocumentIds: string[] = []

    if (newFiles.value.length > 0) {
      uploading.value = true
      uploadProgress.value = 'Subiendo archivos...'

      for (let i = 0; i < newFiles.value.length; i++) {
        const file = newFiles.value[i]
        uploadProgress.value = `Procesando ${file.name} (${i + 1}/${newFiles.value.length})...`

        const result = await documentsService.uploadDocument(file, user.value.id)
        uploadedDocumentIds.push(result.document.id)
      }

      uploading.value = false
    }

    // Paso 2: Combinar IDs (documentos seleccionados + recién subidos)
    const allDocumentIds = [
      ...selectedDocumentIds.value,
      ...uploadedDocumentIds
    ]

    // Paso 3: Generar quiz desde múltiples documentos
    uploadProgress.value = 'Generando quiz con IA...'

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/quizzes/create-from-multiple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.value.id,
        title: quizTitle.value,
        documentIds: allDocumentIds,
        numQuestions: numQuestions.value,
        difficulty: difficulty.value
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error generando quiz')
    }

    const result = await response.json()

    showSuccess('¡Quiz creado exitosamente!')
    router.push(`/quiz/${result.quiz.id}`)
  } catch (error: any) {
    console.error('Error creating quiz:', error)
    showError(error.message || 'Error al crear el quiz')
  } finally {
    generating.value = false
    uploading.value = false
    uploadProgress.value = ''
  }
}
</script>

<template>
  <AppLayout>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">Crear Nuevo Quiz</h1>
        <p class="text-gray-600">Sube documentos o selecciona de tu biblioteca</p>
      </div>

      <div class="space-y-6">
        <!-- Quiz Title -->
        <div class="card">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Título del Quiz *
          </label>
          <input
            v-model="quizTitle"
            type="text"
            placeholder="Ej: Quiz de Biología - Fotosíntesis"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Document Sources -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4">Fuentes de Contenido</h2>

          <!-- Tabs -->
          <div class="flex space-x-2 mb-6 border-b border-gray-200">
            <button
              @click="activeTab = 'upload'"
              class="px-4 py-2 font-medium transition-colors border-b-2"
              :class="[
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              ]"
            >
              📤 Subir Nuevos
            </button>
            <button
              @click="activeTab = 'library'"
              class="px-4 py-2 font-medium transition-colors border-b-2"
              :class="[
                activeTab === 'library'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              ]"
            >
              📚 Mi Biblioteca
            </button>
          </div>

          <!-- Upload Tab -->
          <div v-if="activeTab === 'upload'" class="space-y-4">
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                id="fileInput"
                multiple
                accept=".pdf,image/*"
                @change="handleFilesSelected"
                class="hidden"
              />
              <label for="fileInput" class="cursor-pointer">
                <div class="text-4xl mb-3">📁</div>
                <p class="text-gray-700 font-medium mb-1">Haz clic para seleccionar archivos</p>
                <p class="text-sm text-gray-500">PDF, JPG o PNG · Máximo 10MB por archivo</p>
                <p class="text-xs text-gray-400 mt-2">Puedes seleccionar múltiples archivos</p>
              </label>
            </div>

            <!-- Selected Files List -->
            <div v-if="newFiles.length > 0" class="space-y-2">
              <h3 class="font-medium text-gray-700">Archivos seleccionados:</h3>
              <div
                v-for="(file, index) in newFiles"
                :key="index"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex items-center space-x-3">
                  <span class="text-2xl">{{ file.type === 'application/pdf' ? '📄' : '🖼️' }}</span>
                  <div>
                    <p class="text-sm font-medium">{{ file.name }}</p>
                    <p class="text-xs text-gray-500">{{ (file.size / 1024 / 1024).toFixed(2) }} MB</p>
                  </div>
                </div>
                <button
                  @click="removeFile(index)"
                  class="text-red-600 hover:text-red-700 transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Library Tab -->
          <div v-if="activeTab === 'library'">
            <DocumentSelector @update:selected-documents="handleSelectedDocuments" />
          </div>
        </div>

        <!-- Quiz Configuration -->
        <div class="card">
          <h2 class="text-xl font-bold mb-4">Configuración del Quiz</h2>

          <div class="grid sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Dificultad
              </label>
              <select
                v-model="difficulty"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="easy">Fácil</option>
                <option value="medium">Medio</option>
                <option value="hard">Difícil</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Número de Preguntas
              </label>
              <input
                v-model.number="numQuestions"
                type="number"
                min="5"
                max="50"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <!-- Progress -->
        <div v-if="uploading || generating" class="card bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300">
          <div class="flex flex-col items-center space-y-4 py-6">
            <!-- Pac-Man GIF -->
            <img
              src="https://media.giphy.com/media/YpfYPgRo8rJVC/giphy.gif"
              alt="Loading..."
              class="w-32 h-32 object-contain"
            />
            <p class="text-yellow-800 font-bold text-lg">{{ uploadProgress }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-between items-center">
          <button
            @click="router.push('/dashboard')"
            class="btn btn-secondary"
          >
            Cancelar
          </button>

          <button
            @click="generateQuiz"
            :disabled="!canGenerate || generating"
            class="btn btn-primary"
            :class="{ 'opacity-50 cursor-not-allowed': !canGenerate || generating }"
          >
            {{ generating ? 'Generando...' : 'Generar Quiz con IA 🚀' }}
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
