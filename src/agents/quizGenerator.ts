import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Solo para desarrollo, en producción usar Edge Functions
})

export interface GeneratedQuestion {
  question_text: string
  question_type: 'multiple_choice' | 'true_false'
  correct_answer: string
  options: string[]
  explanation: string
}

export interface GeneratedQuiz {
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  questions: GeneratedQuestion[]
}

/**
 * Agente 2: Quiz Generator
 * Genera preguntas de quiz inteligentes desde contenido procesado
 */
export class QuizGenerator {
  /**
   * Genera un quiz completo a partir de texto
   */
  async generateQuiz(
    text: string,
    options: {
      numQuestions?: number
      difficulty?: 'easy' | 'medium' | 'hard'
      language?: string
    } = {}
  ): Promise<GeneratedQuiz> {
    const {
      numQuestions = 10,
      difficulty = 'medium',
      language = 'español'
    } = options

    try {
      const prompt = this.buildPrompt(text, numQuestions, difficulty, language)

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en educación que crea quizzes educativos de alta calidad.
            Debes generar preguntas que ayuden a evaluar la comprensión profunda del material.
            Siempre responde con JSON válido.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })

      const content = completion.choices[0].message.content
      if (!content) {
        throw new Error('No se recibió respuesta de OpenAI')
      }

      const quiz = JSON.parse(content) as GeneratedQuiz

      // Validar estructura del quiz
      this.validateQuiz(quiz)

      return quiz
    } catch (error) {
      console.error('Error generating quiz:', error)
      throw new Error('Error al generar el quiz con IA')
    }
  }

  /**
   * Construye el prompt para OpenAI
   */
  private buildPrompt(
    text: string,
    numQuestions: number,
    difficulty: string,
    language: string
  ): string {
    return `
Analiza el siguiente texto y genera un quiz educativo de alta calidad en ${language}.

TEXTO:
${text.substring(0, 6000)} ${text.length > 6000 ? '...' : ''}

INSTRUCCIONES:
1. Genera exactamente ${numQuestions} preguntas de nivel ${difficulty}
2. Mezcla preguntas de múltiple opción (4 opciones) y verdadero/falso
3. Las preguntas deben evaluar conceptos clave, no detalles triviales
4. Proporciona explicaciones claras para cada respuesta correcta
5. Para múltiple opción, las opciones incorrectas deben ser plausibles pero claramente incorrectas
6. Genera un título descriptivo para el quiz basado en el contenido

FORMATO DE RESPUESTA (JSON):
{
  "title": "Título del Quiz",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "question_text": "Pregunta aquí",
      "question_type": "multiple_choice" | "true_false",
      "correct_answer": "Respuesta correcta",
      "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
      "explanation": "Explicación de por qué es correcta"
    }
  ]
}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.
    `.trim()
  }

  /**
   * Valida la estructura de un quiz generado
   */
  private validateQuiz(quiz: any): void {
    if (!quiz.title || !quiz.questions || !Array.isArray(quiz.questions)) {
      throw new Error('Estructura de quiz inválida')
    }

    for (const question of quiz.questions) {
      if (
        !question.question_text ||
        !question.question_type ||
        !question.correct_answer ||
        !Array.isArray(question.options)
      ) {
        throw new Error('Estructura de pregunta inválida')
      }

      if (question.question_type === 'multiple_choice' && question.options.length !== 4) {
        throw new Error('Las preguntas de múltiple opción deben tener 4 opciones')
      }

      if (question.question_type === 'true_false' && question.options.length !== 2) {
        throw new Error('Las preguntas de verdadero/falso deben tener 2 opciones')
      }
    }
  }

  /**
   * Genera una pregunta individual (útil para agregar más preguntas después)
   */
  async generateSingleQuestion(
    text: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<GeneratedQuestion> {
    const quiz = await this.generateQuiz(text, { numQuestions: 1, difficulty })
    return quiz.questions[0]
  }
}

// Exportar instancia singleton
export const quizGenerator = new QuizGenerator()
