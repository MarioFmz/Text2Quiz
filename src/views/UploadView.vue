<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { documentsService } from '@/services/documentsService'

const router = useRouter()
const { user } = useAuth()

const isDragging = ref(false)
const file = ref<File | null>(null)
const uploading = ref(false)
const processing = ref(false)
const error = ref('')
const currentStep = ref<'upload' | 'processing' | 'generating'>('upload')

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    validateAndSetFile(files[0])
  }
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    validateAndSetFile(target.files[0])
  }
}

const validateAndSetFile = (selectedFile: File) => {
  error.value = ''

  // Validar tipo de archivo
  const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  if (!validTypes.includes(selectedFile.type)) {
    error.value = 'Tipo de archivo no soportado. Usa PDF, JPG o PNG.'
    return
  }

  // Validar tamaño (10MB máximo)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (selectedFile.size > maxSize) {
    error.value = 'El archivo es demasiado grande. Máximo 10MB.'
    return
  }

  file.value = selectedFile
}

const handleUpload = async () => {
  if (!file.value || !user.value) return

  try {
    error.value = ''
    uploading.value = true
    currentStep.value = 'upload'

    // 1. Subir y procesar documento
    const result = await documentsService.uploadDocument(file.value, user.value.id)

    // 2. Generar quiz
    currentStep.value = 'generating'
    processing.value = true

    const { quiz } = await documentsService.generateQuizFromDocument(result.document.id)

    // 3. Navegar al quiz generado
    router.push(`/quiz/${quiz.id}`)
  } catch (e: any) {
    error.value = e.message || 'Error al procesar el documento'
    console.error('Upload error:', e)
  } finally {
    uploading.value = false
    processing.value = false
    currentStep.value = 'upload'
  }
}
</script>

<template>
  <AppLayout>
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="text-4xl font-bold mb-2">Subir documento</h1>
      <p class="text-gray-600 mb-12">Sube un PDF o imagen para generar un quiz</p>

      <!-- Error message -->
      <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-800">{{ error }}</p>
      </div>

      <!-- Processing status -->
      <div v-if="uploading || processing" class="mb-6 card">
        <div class="text-center">
          <div class="text-4xl mb-4">⏳</div>
          <h3 class="text-xl font-semibold mb-2">
            {{ currentStep === 'upload' ? 'Subiendo archivo...' :
               currentStep === 'processing' ? 'Procesando documento...' :
               'Generando quiz con IA...' }}
          </h3>
          <p class="text-gray-600">Esto puede tomar un momento</p>
        </div>
      </div>

      <div v-else class="card">
        <!-- Drag and Drop Area -->
        <div
          @drop.prevent="handleDrop"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          :class="[
            'border-2 border-dashed rounded-lg p-12 text-center transition-colors',
            isDragging ? 'border-gray-900 bg-gray-50' : 'border-gray-300'
          ]"
        >
          <div v-if="!file">
            <div class="text-6xl mb-4">📄</div>
            <p class="text-xl mb-2">Arrastra tu archivo aquí</p>
            <p class="text-gray-600 mb-6">o</p>
            <label class="btn btn-secondary cursor-pointer">
              Seleccionar archivo
              <input
                type="file"
                accept=".pdf,image/*"
                @change="handleFileSelect"
                class="hidden"
              />
            </label>
            <p class="text-sm text-gray-500 mt-4">
              Soportado: PDF, JPG, PNG (máx. 10MB)
            </p>
          </div>

          <div v-else>
            <div class="text-6xl mb-4">✅</div>
            <p class="text-xl font-semibold mb-2">{{ file.name }}</p>
            <p class="text-gray-600 mb-6">
              {{ (file.size / 1024 / 1024).toFixed(2) }} MB
            </p>
            <div class="flex justify-center space-x-4">
              <button
                @click="file = null"
                class="btn btn-secondary"
              >
                Cambiar archivo
              </button>
              <button
                @click="handleUpload"
                class="btn btn-primary"
              >
                Generar quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
