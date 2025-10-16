<script setup lang="ts">
import { computed, ref } from 'vue'
import { useToast } from '@/composables/useToast'

interface Props {
  quizId: string
  quizTitle: string
  score: number
  totalQuestions: number
  percentage: number
  creatorId: string
  creatorUsername: string
  timeTaken?: number
}

const props = defineProps<Props>()
const { success, error: showError } = useToast()

const challengeUrl = ref<string | null>(null)
const generatingChallenge = ref(false)
const isAnonymous = ref(false)
const showAnonymousPrompt = ref(false)

const shareText = computed(() => {
  const emoji = props.percentage >= 90 ? '🏆' : props.percentage >= 70 ? '🎯' : '📚'
  return `${emoji} ¡Acabo de completar "${props.quizTitle}"!\n\nResultado: ${props.score}/${props.totalQuestions} (${props.percentage}%)\n\n¿Puedes superarme?`
})

// Generar URL del desafío
const generateChallengeUrl = async (): Promise<string> => {
  if (challengeUrl.value) return challengeUrl.value
  if (generatingChallenge.value) return window.location.href

  generatingChallenge.value = true
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/challenges/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quizId: props.quizId,
        creatorId: props.creatorId,
        creatorUsername: props.creatorUsername,
        creatorScore: props.score,
        totalQuestions: props.totalQuestions,
        timeTaken: props.timeTaken || 0,
        isAnonymous: isAnonymous.value
      })
    })

    if (!response.ok) {
      throw new Error('Error al crear el desafío')
    }

    const data = await response.json()
    challengeUrl.value = `${window.location.origin}/challenge/${data.share_slug}`

    // Mostrar mensaje diferente si se reutilizó un challenge existente
    if (data.isExisting) {
      success('Compartiendo tu desafío existente')
    }

    return challengeUrl.value
  } catch (err) {
    console.error('Error generating challenge:', err)
    showError('Error al generar enlace de desafío')
    return window.location.href
  } finally {
    generatingChallenge.value = false
  }
}

const promptAnonymous = (callback: () => void) => {
  showAnonymousPrompt.value = true
  // Store callback for later execution
  ;(window as any).__shareCallback = callback
}

const confirmAnonymous = async (anonymous: boolean) => {
  isAnonymous.value = anonymous
  showAnonymousPrompt.value = false
  const callback = (window as any).__shareCallback
  if (callback) {
    callback()
    delete (window as any).__shareCallback
  }
}

const shareOnTwitter = async () => {
  if (!challengeUrl.value && !showAnonymousPrompt.value) {
    promptAnonymous(shareOnTwitter)
    return
  }

  const url = await generateChallengeUrl()
  const text = encodeURIComponent(shareText.value)
  const encodedUrl = encodeURIComponent(url)
  window.open(
    `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}&hashtags=Text2Quiz,Quiz`,
    '_blank',
    'width=550,height=420'
  )
}

const shareOnWhatsApp = async () => {
  if (!challengeUrl.value && !showAnonymousPrompt.value) {
    promptAnonymous(shareOnWhatsApp)
    return
  }

  const url = await generateChallengeUrl()
  const text = encodeURIComponent(`${shareText.value}\n\n${url}`)
  window.open(
    `https://wa.me/?text=${text}`,
    '_blank'
  )
}

const shareOnFacebook = async () => {
  if (!challengeUrl.value && !showAnonymousPrompt.value) {
    promptAnonymous(shareOnFacebook)
    return
  }

  const url = await generateChallengeUrl()
  const encodedUrl = encodeURIComponent(url)
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    '_blank',
    'width=550,height=420'
  )
}

const shareOnLinkedIn = async () => {
  if (!challengeUrl.value && !showAnonymousPrompt.value) {
    promptAnonymous(shareOnLinkedIn)
    return
  }

  const url = await generateChallengeUrl()
  const encodedUrl = encodeURIComponent(url)
  window.open(
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    '_blank',
    'width=550,height=420'
  )
}

const copyLink = async () => {
  if (!challengeUrl.value && !showAnonymousPrompt.value) {
    promptAnonymous(copyLink)
    return
  }

  try {
    const url = await generateChallengeUrl()
    // Copiar texto motivador + URL en lugar de solo la URL
    const fullText = `${shareText.value}\n\n${url}`
    await navigator.clipboard.writeText(fullText)
    success('¡Mensaje y enlace copiados! Listo para compartir')
  } catch (error) {
    console.error('Error copying link:', error)
    showError('Error al copiar enlace')
  }
}
</script>

<template>
  <div class="share-results">
    <!-- Anonymous Mode Prompt Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showAnonymousPrompt"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          @click.self="showAnonymousPrompt = false"
        >
          <div class="bg-white rounded-lg max-w-md w-full p-6">
            <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🔒</span>
              <span>¿Desafío anónimo?</span>
            </h3>
            <p class="text-gray-600 mb-6">
              ¿Quieres que los participantes aparezcan con nombres anónimos en el ranking?
            </p>
            <div class="flex gap-3">
              <button
                @click="confirmAnonymous(false)"
                class="btn btn-secondary flex-1"
              >
                Mostrar nombres
              </button>
              <button
                @click="confirmAnonymous(true)"
                class="btn btn-primary flex-1"
              >
                Anónimo
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <div class="text-center mb-4">
      <p class="text-sm font-medium text-gray-700 mb-3">Comparte tu resultado y reta a tus amigos</p>
      <div class="flex justify-center items-center gap-3 flex-wrap">
        <!-- Twitter/X -->
        <button
          @click="shareOnTwitter"
          class="share-button bg-black hover:bg-gray-800"
          title="Compartir en Twitter/X"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </button>

        <!-- WhatsApp -->
        <button
          @click="shareOnWhatsApp"
          class="share-button bg-green-500 hover:bg-green-600"
          title="Compartir en WhatsApp"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        </button>

        <!-- Facebook -->
        <button
          @click="shareOnFacebook"
          class="share-button bg-blue-600 hover:bg-blue-700"
          title="Compartir en Facebook"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </button>

        <!-- LinkedIn -->
        <button
          @click="shareOnLinkedIn"
          class="share-button bg-blue-700 hover:bg-blue-800"
          title="Compartir en LinkedIn"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </button>
      </div>

      <!-- Separator and Copy Link Button -->
      <div class="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-gray-200">
        <span class="text-xs text-gray-500">o</span>
      </div>

      <div class="flex justify-center mt-3">
        <button
          @click="copyLink"
          class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
          title="Copiar mensaje motivador + enlace"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          <span>Copiar Mensaje para Compartir</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.share-button {
  @apply p-3 rounded-full text-white transition-all transform hover:scale-110 shadow-md hover:shadow-lg;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
