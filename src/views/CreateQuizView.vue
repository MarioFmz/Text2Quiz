<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import DocumentSelector from '@/components/DocumentSelector.vue'
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { documentsService } from '@/services/documentsService'
import { useToast } from '@/composables/useToast'
import { getCategories, updateQuizVisibility } from '@/services/publicQuizzesService'

const router = useRouter()
const { user } = useAuth()
const { success: showSuccess, error: showError } = useToast()

// Form fields
const quizTitle = ref('')
const selectedDocumentIds = ref<string[]>([])
const newFiles = ref<File[]>([])
const difficulty = ref<'easy' | 'medium' | 'hard'>('medium')
const numQuestions = ref(10)
const questionType = ref<'mixed' | 'multiple_choice' | 'true_false'>('mixed')

// Public quiz fields
const visibility = ref<'private' | 'public' | 'unlisted'>('private')
const selectedCategory = ref<string>('')
const quizTags = ref<string[]>([])
const quizSource = ref('')
const tagInput = ref('')
const categories = ref<any[]>([])

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

// Tag management
const addTag = () => {
  if (tagInput.value.trim() && !quizTags.value.includes(tagInput.value.trim())) {
    quizTags.value.push(tagInput.value.trim())
    tagInput.value = ''
  }
}

const removeTag = (index: number) => {
  quizTags.value.splice(index, 1)
}

// Load categories on mount
onMounted(async () => {
  try {
    categories.value = await getCategories()
  } catch (error) {
    console.error('Error loading categories:', error)
  }
})

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
        difficulty: difficulty.value,
        questionType: questionType.value
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error generando quiz')
    }

    const result = await response.json()
    const createdQuizId = result.quiz.id

    // If quiz is public, update visibility and metadata
    if (visibility.value === 'public' && user.value) {
      try {
        await updateQuizVisibility(createdQuizId, user.value.id, {
          visibility: visibility.value,
          category_id: selectedCategory.value || undefined,
          tags: quizTags.value.length > 0 ? quizTags.value : undefined,
          source: quizSource.value || undefined
        })
        showSuccess('¡Quiz creado y publicado exitosamente!')
      } catch (error) {
        console.error('Error updating visibility:', error)
        showSuccess('Quiz creado, pero hubo un error al publicarlo')
      }
    } else {
      showSuccess('¡Quiz creado exitosamente!')
    }

    router.push(`/quiz/${createdQuizId}`)
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
    <div class="max-w-5xl mx-auto px-3 py-4 sm:px-6 lg:px-8 sm:py-8">
      <!-- Header con progreso - Mobile First -->
      <div class="mb-6 sm:mb-8">
        <router-link to="/dashboard" class="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium mb-3 sm:mb-4 inline-flex items-center">
          ← Volver
        </router-link>
        <h1 class="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 mt-3 sm:mt-4">Crear Nuevo Quiz</h1>
        <p class="text-gray-600 text-xs sm:text-sm md:text-base">Sigue los pasos para generar tu quiz</p>

        <!-- Progress Steps - Mobile First -->
        <div class="flex items-center justify-center mt-4 sm:mt-6 gap-1.5 sm:gap-2 md:gap-4">
          <div class="flex items-center">
            <div :class="quizTitle.trim().length > 0 ? 'bg-green-500' : 'bg-blue-500'" class="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-white flex items-center justify-center font-bold text-xs sm:text-sm">
              {{ quizTitle.trim().length > 0 ? '✓' : '1' }}
            </div>
            <span class="ml-1 sm:ml-2 text-xs font-medium hidden sm:inline">Título</span>
          </div>
          <div class="w-6 sm:w-8 md:w-16 h-0.5 bg-gray-300"></div>
          <div class="flex items-center">
            <div :class="(selectedDocumentIds.length > 0 || newFiles.length > 0) ? 'bg-green-500' : 'bg-gray-300'" class="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-white flex items-center justify-center font-bold text-xs sm:text-sm">
              {{ (selectedDocumentIds.length > 0 || newFiles.length > 0) ? '✓' : '2' }}
            </div>
            <span class="ml-1 sm:ml-2 text-xs font-medium hidden sm:inline">Docs</span>
          </div>
          <div class="w-6 sm:w-8 md:w-16 h-0.5 bg-gray-300"></div>
          <div class="flex items-center">
            <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold text-xs sm:text-sm">
              3
            </div>
            <span class="ml-1 sm:ml-2 text-xs font-medium hidden sm:inline">Generar</span>
          </div>
        </div>
      </div>

      <div class="space-y-4 sm:space-y-6">
        <!-- PASO 1: Quiz Title - Mobile First -->
        <div class="card border-2 p-3 sm:p-6" :class="quizTitle.trim().length > 0 ? 'border-green-300 bg-green-50' : 'border-blue-300 bg-blue-50'">
          <div class="flex items-start gap-2 sm:gap-3">
            <div class="flex-shrink-0">
              <div :class="quizTitle.trim().length > 0 ? 'bg-green-500' : 'bg-blue-500'" class="w-8 h-8 sm:w-10 sm:h-10 rounded-full text-white flex items-center justify-center font-bold text-sm sm:text-base">
                {{ quizTitle.trim().length > 0 ? '✓' : '1' }}
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-base sm:text-xl font-bold mb-1 sm:mb-2">Ponle un nombre a tu quiz</h2>
              <p class="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                Usa un nombre descriptivo
              </p>
              <input
                v-model="quizTitle"
                type="text"
                placeholder="Ej: Quiz de Biología"
                class="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base md:text-lg"
              />
              <p v-if="quizTitle.trim().length > 0" class="text-xs sm:text-sm text-green-600 mt-2 font-medium">
                ✓ ¡Perfecto! Ahora agrega documentos
              </p>
            </div>
          </div>
        </div>

        <!-- PASO 2: Document Sources - Mobile First -->
        <div class="card border-2 p-3 sm:p-6" :class="(selectedDocumentIds.length > 0 || newFiles.length > 0) ? 'border-green-300 bg-green-50' : 'border-gray-300'">
          <div class="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div class="flex-shrink-0">
              <div :class="(selectedDocumentIds.length > 0 || newFiles.length > 0) ? 'bg-green-500' : 'bg-gray-400'" class="w-8 h-8 sm:w-10 sm:h-10 rounded-full text-white flex items-center justify-center font-bold text-sm sm:text-base">
                {{ (selectedDocumentIds.length > 0 || newFiles.length > 0) ? '✓' : '2' }}
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-base sm:text-xl font-bold mb-1 sm:mb-2">Selecciona documentos</h2>
              <p class="text-xs sm:text-sm text-gray-600">
                Sube archivos o elige de tu biblioteca
              </p>
            </div>
          </div>

          <!-- Tabs - Mobile First -->
          <div class="flex space-x-1 sm:space-x-2 mb-4 sm:mb-6 border-b border-gray-200">
            <button
              @click="activeTab = 'upload'"
              class="px-2 py-2 sm:px-4 font-medium transition-colors border-b-2 relative text-xs sm:text-sm flex-1 sm:flex-none"
              :class="[
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              ]"
            >
              <span class="hidden sm:inline">📤 </span>Subir
              <span v-if="newFiles.length > 0" class="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                {{ newFiles.length }}
              </span>
            </button>
            <button
              @click="activeTab = 'library'"
              class="px-2 py-2 sm:px-4 font-medium transition-colors border-b-2 relative text-xs sm:text-sm flex-1 sm:flex-none"
              :class="[
                activeTab === 'library'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              ]"
            >
              <span class="hidden sm:inline">📚 </span>Biblioteca
              <span v-if="selectedDocumentIds.length > 0" class="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                {{ selectedDocumentIds.length }}
              </span>
            </button>
          </div>

          <!-- Upload Tab - Mobile First -->
          <div v-if="activeTab === 'upload'" class="space-y-3 sm:space-y-4">
            <div class="border-2 border-dashed border-blue-300 rounded-lg p-6 sm:p-8 md:p-12 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group">
              <input
                type="file"
                id="fileInput"
                multiple
                accept=".pdf,image/*"
                @change="handleFilesSelected"
                class="hidden"
              />
              <label for="fileInput" class="cursor-pointer">
                <div class="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">📁</div>
                <p class="text-gray-900 font-bold mb-1 sm:mb-2 text-base sm:text-lg">Arrastra archivos aquí</p>
                <p class="text-gray-700 font-medium mb-1 sm:mb-2 text-sm sm:text-base">o toca para seleccionar</p>
                <p class="text-xs sm:text-sm text-gray-500">PDF, JPG o PNG · Max 10MB</p>
                <p class="text-xs text-blue-600 mt-2 sm:mt-3 font-medium">✓ Múltiples archivos a la vez</p>
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

        <!-- Quiz Configuration - Mobile First -->
        <div class="card border-2 border-gray-300 p-3 sm:p-6">
          <div class="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm sm:text-base">
                ⚙️
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-base sm:text-xl font-bold mb-1 sm:mb-2">Configuración</h2>
              <p class="text-xs sm:text-sm text-gray-600">
                Personaliza tu quiz
              </p>
            </div>
          </div>

          <div class="space-y-4 sm:space-y-6">
            <!-- Primera fila -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Dificultad
                </label>
                <select
                  v-model="difficulty"
                  class="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                >
                  <option value="easy">😊 Fácil</option>
                  <option value="medium">🎯 Medio</option>
                  <option value="hard">🔥 Difícil</option>
                </select>
              </div>

              <div>
                <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Preguntas ({{ numQuestions }})
                </label>
                <input
                  v-model.number="numQuestions"
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5</span>
                  <span>50</span>
                </div>
              </div>
            </div>

            <!-- Segunda fila - Tipo de preguntas -->
            <div>
              <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Tipo de preguntas
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  @click="questionType = 'mixed'"
                  class="p-3 sm:p-4 rounded-lg border-2 transition-all text-left"
                  :class="questionType === 'mixed'
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-300 hover:border-purple-300 hover:bg-gray-50'"
                >
                  <div class="flex items-center space-x-2 mb-1">
                    <span class="text-lg">🎲</span>
                    <span class="font-semibold text-sm">Mixto</span>
                  </div>
                  <p class="text-xs text-gray-600">4 opciones + V/F</p>
                </button>

                <button
                  type="button"
                  @click="questionType = 'multiple_choice'"
                  class="p-3 sm:p-4 rounded-lg border-2 transition-all text-left"
                  :class="questionType === 'multiple_choice'
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-300 hover:border-purple-300 hover:bg-gray-50'"
                >
                  <div class="flex items-center space-x-2 mb-1">
                    <span class="text-lg">🔤</span>
                    <span class="font-semibold text-sm">Múltiple</span>
                  </div>
                  <p class="text-xs text-gray-600">Solo 4 opciones</p>
                </button>

                <button
                  type="button"
                  @click="questionType = 'true_false'"
                  class="p-3 sm:p-4 rounded-lg border-2 transition-all text-left"
                  :class="questionType === 'true_false'
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-300 hover:border-purple-300 hover:bg-gray-50'"
                >
                  <div class="flex items-center space-x-2 mb-1">
                    <span class="text-lg">✓✗</span>
                    <span class="font-semibold text-sm">V/F</span>
                  </div>
                  <p class="text-xs text-gray-600">Solo verdadero/falso</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Visibilidad y Metadatos -->
        <div class="card border-2 border-gray-300 p-3 sm:p-6">
          <div class="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm sm:text-base">
                🌐
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-base sm:text-xl font-bold mb-1 sm:mb-2">Visibilidad</h2>
              <p class="text-xs sm:text-sm text-gray-600">
                Decide quién puede ver tu quiz
              </p>
            </div>
          </div>

          <div class="space-y-4 sm:space-y-6">
            <!-- Visibility Selector -->
            <div>
              <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                ¿Quién puede ver este quiz?
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  @click="visibility = 'private'"
                  class="p-3 sm:p-4 rounded-lg border-2 transition-all text-left"
                  :class="visibility === 'private'
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'"
                >
                  <div class="flex items-center space-x-2 mb-1">
                    <span class="text-lg">🔒</span>
                    <span class="font-semibold text-sm">Privado</span>
                  </div>
                  <p class="text-xs text-gray-600">Solo tú</p>
                </button>

                <button
                  type="button"
                  @click="visibility = 'unlisted'"
                  class="p-3 sm:p-4 rounded-lg border-2 transition-all text-left"
                  :class="visibility === 'unlisted'
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'"
                >
                  <div class="flex items-center space-x-2 mb-1">
                    <span class="text-lg">🔗</span>
                    <span class="font-semibold text-sm">No listado</span>
                  </div>
                  <p class="text-xs text-gray-600">Solo con link</p>
                </button>

                <button
                  type="button"
                  @click="visibility = 'public'"
                  class="p-3 sm:p-4 rounded-lg border-2 transition-all text-left"
                  :class="visibility === 'public'
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'"
                >
                  <div class="flex items-center space-x-2 mb-1">
                    <span class="text-lg">🌍</span>
                    <span class="font-semibold text-sm">Público</span>
                  </div>
                  <p class="text-xs text-gray-600">Todos pueden verlo</p>
                </button>
              </div>
            </div>

            <!-- Public Quiz Metadata (only shown if public) -->
            <div v-if="visibility === 'public'" class="space-y-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <p class="text-sm text-indigo-800 font-medium mb-3">
                ℹ️ Completa estos datos para que tu quiz sea más fácil de encontrar
              </p>

              <!-- Category -->
              <div>
                <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Categoría de oposición
                </label>
                <select
                  v-model="selectedCategory"
                  class="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                >
                  <option value="">-- Selecciona una categoría --</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                    {{ cat.icon }} {{ cat.name }}
                  </option>
                </select>
              </div>

              <!-- Tags -->
              <div>
                <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Etiquetas (palabras clave)
                </label>
                <div class="flex gap-2 mb-2">
                  <input
                    v-model="tagInput"
                    @keyup.enter="addTag"
                    type="text"
                    placeholder="Añade una etiqueta..."
                    class="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                  <button
                    type="button"
                    @click="addTag"
                    class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                  >
                    Añadir
                  </button>
                </div>
                <div v-if="quizTags.length > 0" class="flex flex-wrap gap-2">
                  <span
                    v-for="(tag, index) in quizTags"
                    :key="index"
                    class="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                  >
                    {{ tag }}
                    <button
                      type="button"
                      @click="removeTag(index)"
                      class="hover:text-indigo-900"
                    >
                      ✕
                    </button>
                  </span>
                </div>
              </div>

              <!-- Source -->
              <div>
                <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Fuente del examen (opcional)
                </label>
                <input
                  v-model="quizSource"
                  type="text"
                  placeholder="Ej: Examen oficial 2023, Simulacro PrepareYa..."
                  class="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                />
              </div>
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

        <!-- PASO 3: Generate - Mobile First -->
        <div v-if="canGenerate" class="card border-2 border-green-300 bg-gradient-to-br from-green-50 to-blue-50 p-4 sm:p-6">
          <div class="text-center py-2 sm:py-4">
            <div class="text-4xl sm:text-5xl mb-3 sm:mb-4">🚀</div>
            <h2 class="text-xl sm:text-2xl font-bold mb-2">¡Todo listo!</h2>
            <p class="text-gray-600 mb-4 sm:mb-6 text-xs sm:text-sm md:text-base px-2">
              La IA creará {{ numQuestions }} preguntas {{ difficulty === 'easy' ? 'fáciles' : difficulty === 'medium' ? 'medias' : 'difíciles' }}
            </p>
            <button
              @click="generateQuiz"
              :disabled="generating"
              class="btn btn-primary w-full sm:w-auto text-base sm:text-lg px-6 py-3 sm:px-10 sm:py-4 transform hover:scale-105 transition-all shadow-lg"
              :class="{ 'opacity-50 cursor-not-allowed': generating }"
            >
              {{ generating ? 'Generando...' : '✨ Generar Quiz' }}
            </button>
          </div>
        </div>

        <!-- Help/Cancel - Mobile First -->
        <div v-else class="text-center py-2">
          <button
            @click="router.push('/dashboard')"
            class="text-gray-600 hover:text-gray-900 font-medium text-sm"
          >
            ← Volver
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
