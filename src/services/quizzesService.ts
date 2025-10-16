import { supabase } from './supabase'
import type { Quiz, Question, UserAnswer, LearningProgress } from '@/types'

/**
 * Servicio para gestionar quizzes y respuestas
 */
export class QuizzesService {
  /**
   * Obtiene un quiz con sus preguntas
   */
  async getQuizWithQuestions(quizId: string) {
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single()

    if (quizError) throw quizError

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order', { ascending: true })

    if (questionsError) throw questionsError

    return {
      ...quiz,
      questions
    }
  }

  /**
   * Obtiene todos los quizzes de un documento
   * Incluye tanto quizzes legacy (con document_id) como multi-documento (quiz_documents)
   */
  async getDocumentQuizzes(documentId: string): Promise<Quiz[]> {
    // 1. Obtener quizzes legacy con document_id directo
    const { data: legacyQuizzes, error: legacyError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('document_id', documentId)
      .order('generated_at', { ascending: false })

    if (legacyError) throw legacyError

    // 2. Obtener quiz IDs desde la tabla quiz_documents
    const { data: quizDocuments, error: quizDocsError } = await supabase
      .from('quiz_documents')
      .select('quiz_id')
      .eq('document_id', documentId)

    if (quizDocsError) throw quizDocsError

    // 3. Si hay quiz_documents, obtener los quizzes completos
    let multiDocQuizzes: Quiz[] = []
    if (quizDocuments && quizDocuments.length > 0) {
      const quizIds = quizDocuments.map(qd => qd.quiz_id)
      const { data: quizzes, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .in('id', quizIds)
        .order('generated_at', { ascending: false })

      if (quizzesError) throw quizzesError
      multiDocQuizzes = quizzes || []
    }

    // 4. Combinar ambos resultados y eliminar duplicados
    const allQuizzes = [...(legacyQuizzes || []), ...multiDocQuizzes]
    const uniqueQuizzes = Array.from(
      new Map(allQuizzes.map(quiz => [quiz.id, quiz])).values()
    )

    // 5. Ordenar por fecha
    return uniqueQuizzes.sort((a, b) =>
      new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
    )
  }

  /**
   * Obtiene todos los quizzes de un usuario
   */
  async getUserQuizzes(userId: string): Promise<Quiz[]> {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Guarda la respuesta de un usuario
   */
  async saveUserAnswer(
    userId: string,
    quizId: string,
    questionId: string,
    selectedAnswer: string,
    correctAnswer: string
  ): Promise<UserAnswer> {
    const isCorrect = selectedAnswer === correctAnswer

    const { data, error } = await supabase
      .from('user_answers')
      .insert({
        user_id: userId,
        quiz_id: quizId,
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Obtiene las respuestas de un usuario para un quiz
   */
  async getUserAnswers(userId: string, quizId: string): Promise<UserAnswer[]> {
    const { data, error } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)

    if (error) throw error
    return data || []
  }

  /**
   * Obtiene las respuestas de un intento específico basado en el timestamp del learning_progress
   * Las respuestas se filtran por un rango de tiempo alrededor del completed_at
   */
  async getAttemptAnswers(userId: string, quizId: string, attemptCompletedAt: string): Promise<UserAnswer[]> {
    // Convertir el timestamp a Date y crear un rango de ±5 minutos
    const completedDate = new Date(attemptCompletedAt)
    const startTime = new Date(completedDate.getTime() - 5 * 60 * 1000).toISOString()
    const endTime = new Date(completedDate.getTime() + 5 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .gte('answered_at', startTime)
      .lte('answered_at', endTime)
      .order('answered_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Obtiene el historial de intentos de un quiz (todos los learning_progress para ese quiz)
   */
  async getQuizAttempts(userId: string, quizId: string) {
    const { data, error } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .order('completed_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Verifica si el usuario ya completó un quiz
   */
  async hasCompletedQuiz(userId: string, quizId: string): Promise<boolean> {
    const attempts = await this.getQuizAttempts(userId, quizId)
    return attempts.length > 0
  }

  /**
   * Guarda el progreso de aprendizaje al completar un quiz
   */
  async saveProgress(
    userId: string,
    documentId: string,
    quizId: string,
    score: number,
    totalQuestions: number
  ): Promise<LearningProgress> {
    const { data, error } = await supabase
      .from('learning_progress')
      .insert({
        user_id: userId,
        document_id: documentId,
        quiz_id: quizId,
        score,
        total_questions: totalQuestions
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Obtiene el progreso de un usuario
   */
  async getUserProgress(userId: string): Promise<LearningProgress[]> {
    const { data, error } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Calcula estadísticas del usuario
   */
  async getUserStats(userId: string) {
    const progress = await this.getUserProgress(userId)
    const documents = await supabase
      .from('documents')
      .select('id')
      .eq('user_id', userId)

    const totalDocuments = documents.data?.length || 0
    const totalQuizzes = progress.length

    const totalScore = progress.reduce((sum, p) => sum + p.score, 0)
    const totalQuestions = progress.reduce((sum, p) => sum + p.total_questions, 0)
    const averageAccuracy = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0

    return {
      totalDocuments,
      totalQuizzes,
      averageAccuracy: Math.round(averageAccuracy),
      recentProgress: progress.slice(0, 5)
    }
  }

  /**
   * Actualiza el título de un quiz
   */
  async updateQuizTitle(quizId: string, userId: string, newTitle: string): Promise<void> {
    // Verificar que el quiz pertenece al usuario
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('user_id')
      .eq('id', quizId)
      .single()

    if (!quiz || quiz.user_id !== userId) {
      throw new Error('Quiz no encontrado o sin permisos')
    }

    const { error } = await supabase
      .from('quizzes')
      .update({ title: newTitle })
      .eq('id', quizId)

    if (error) throw error
  }

  /**
   * Elimina un quiz
   */
  async deleteQuiz(quizId: string, userId: string): Promise<void> {
    // Verificar que el quiz pertenece al usuario
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('user_id')
      .eq('id', quizId)
      .single()

    if (!quiz || quiz.user_id !== userId) {
      throw new Error('Quiz no encontrado o sin permisos')
    }

    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId)

    if (error) throw error
  }

  /**
   * Obtiene todas las preguntas de los quizzes de un usuario
   * Útil para modos de práctica rápida
   */
  async getAllQuestions(userId: string): Promise<Question[]> {
    // Primero obtenemos todos los quiz IDs del usuario
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('user_id', userId)

    if (quizzesError) throw quizzesError
    if (!quizzes || quizzes.length === 0) return []

    const quizIds = quizzes.map(q => q.id)

    // Luego obtenemos todas las preguntas de esos quizzes
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .in('quiz_id', quizIds)

    if (questionsError) throw questionsError
    return questions || []
  }
}

// Exportar instancia singleton
export const quizzesService = new QuizzesService()
