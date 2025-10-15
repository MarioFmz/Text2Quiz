export interface ContentAnalysis {
  mainTopics: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  suggestedQuestionCount: number
  keyConceptsCount: number
  readingLevel: string
  summary: string
}

/**
 * Agente 3: Content Analyzer
 * Analiza el contenido del documento y sugiere parámetros óptimos para el quiz
 */
export class ContentAnalyzer {
  /**
   * Analiza el contenido de un texto y devuelve insights
   */
  async analyzeContent(text: string): Promise<ContentAnalysis> {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

      // Usar el backend API para análisis
      const response = await fetch(`${apiUrl}/api/analyze-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        throw new Error('Error al analizar contenido')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error('Error al analizar contenido')
      }

      // El backend devuelve un análisis básico, agregamos más detalles
      const analysis = result.analysis
      return {
        mainTopics: ['Análisis pendiente'],
        difficulty: analysis.difficulty,
        suggestedQuestionCount: analysis.suggestedQuestionCount,
        keyConceptsCount: analysis.keyConceptsCount,
        readingLevel: this.estimateReadingLevel(analysis.wordCount, analysis.sentenceCount),
        summary: `Documento de ${analysis.wordCount} palabras, nivel ${analysis.difficulty}`
      }
    } catch (error) {
      console.error('Error analyzing content:', error)
      // Retornar análisis básico en caso de error
      return this.basicAnalysis(text)
    }
  }

  /**
   * Construye el prompt para análisis
   */
  private buildAnalysisPrompt(text: string): string {
    return `
Analiza el siguiente texto educativo y proporciona un análisis detallado.

TEXTO:
${text.substring(0, 4000)} ${text.length > 4000 ? '...' : ''}

ANÁLISIS REQUERIDO:
1. Identifica los 3-5 temas principales
2. Determina el nivel de dificultad (easy, medium, hard)
3. Sugiere cuántas preguntas serían apropiadas (5-20)
4. Cuenta los conceptos clave que deben evaluarse
5. Determina el nivel de lectura
6. Proporciona un resumen breve (2-3 oraciones)

FORMATO DE RESPUESTA (JSON):
{
  "mainTopics": ["Tema 1", "Tema 2", ...],
  "difficulty": "easy" | "medium" | "hard",
  "suggestedQuestionCount": número,
  "keyConceptsCount": número,
  "readingLevel": "Descripción del nivel",
  "summary": "Resumen del contenido"
}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.
    `.trim()
  }

  /**
   * Análisis básico sin IA (fallback)
   */
  private basicAnalysis(text: string): ContentAnalysis {
    const wordCount = text.split(/\s+/).length
    const sentenceCount = text.split(/[.!?]+/).length

    let difficulty: 'easy' | 'medium' | 'hard' = 'medium'
    if (wordCount < 500) difficulty = 'easy'
    if (wordCount > 2000) difficulty = 'hard'

    const suggestedQuestionCount = Math.min(Math.max(Math.floor(wordCount / 200), 5), 20)

    return {
      mainTopics: ['Análisis automático no disponible'],
      difficulty,
      suggestedQuestionCount,
      keyConceptsCount: Math.floor(sentenceCount / 3),
      readingLevel: this.estimateReadingLevel(wordCount, sentenceCount),
      summary: 'Análisis detallado no disponible. Procesamiento básico completado.'
    }
  }

  /**
   * Estima el nivel de lectura basado en métricas simples
   */
  private estimateReadingLevel(wordCount: number, sentenceCount: number): string {
    const avgWordsPerSentence = wordCount / sentenceCount

    if (avgWordsPerSentence < 15) return 'Básico'
    if (avgWordsPerSentence < 20) return 'Intermedio'
    return 'Avanzado'
  }

  /**
   * Extrae palabras clave del texto (análisis básico sin IA)
   */
  extractKeywords(text: string, limit: number = 10): string[] {
    // Palabras comunes a ignorar (stop words en español)
    const stopWords = new Set([
      'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber',
      'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo',
      'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro', 'ese',
      'si', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy', 'sin',
      'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno', 'mismo', 'yo',
      'también', 'hasta', 'año', 'dos', 'querer', 'entre', 'así', 'primero'
    ])

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4 && !stopWords.has(word))

    // Contar frecuencia
    const frequency: Record<string, number> = {}
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1
    })

    // Ordenar por frecuencia y retornar top palabras
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([word]) => word)
  }
}

// Exportar instancia singleton
export const contentAnalyzer = new ContentAnalyzer()
