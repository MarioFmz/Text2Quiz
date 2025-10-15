import { supabase } from './supabase'
import type { Document } from '@/types'
import { documentProcessor } from '@/agents/documentProcessor'
import { contentAnalyzer } from '@/agents/contentAnalyzer'
import { quizGenerator } from '@/agents/quizGenerator'

export interface UploadResult {
  document: Document
  extractedText: string
}

/**
 * Servicio para gestionar documentos en Supabase
 */
export class DocumentsService {
  /**
   * Sube un archivo a Supabase Storage y crea el registro en la BD
   */
  async uploadDocument(file: File, userId: string): Promise<UploadResult> {
    try {
      // 1. Subir archivo a Storage
      const fileName = `${userId}/${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // 2. Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(uploadData.path)

      // 3. Procesar documento para extraer texto
      const processed = await documentProcessor.processFile(file)

      // 4. Crear registro en la base de datos
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: userId,
          title: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type === 'application/pdf' ? 'pdf' : 'image',
          processed_status: 'completed',
          extracted_text: processed.text
        })
        .select()
        .single()

      if (dbError) throw dbError

      return {
        document,
        extractedText: processed.text
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      throw error
    }
  }

  /**
   * Obtiene todos los documentos de un usuario
   */
  async getUserDocuments(userId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Obtiene un documento por ID
   */
  async getDocument(documentId: string): Promise<Document | null> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Elimina un documento
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    // 1. Obtener documento para acceder a file_url
    const document = await this.getDocument(documentId)
    if (!document || document.user_id !== userId) {
      throw new Error('Documento no encontrado o sin permisos')
    }

    // 2. Eliminar archivo de Storage
    const filePath = document.file_url.split('/documents/')[1]
    if (filePath) {
      await supabase.storage.from('documents').remove([filePath])
    }

    // 3. Eliminar registro de BD (esto eliminará en cascada quizzes, preguntas, etc.)
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (error) throw error
  }

  /**
   * Genera un quiz desde un documento
   */
  async generateQuizFromDocument(
    documentId: string,
    options: {
      numQuestions?: number
      difficulty?: 'easy' | 'medium' | 'hard'
    } = {}
  ) {
    try {
      // 1. Obtener documento
      const document = await this.getDocument(documentId)
      if (!document || !document.extracted_text) {
        throw new Error('Documento no encontrado o sin texto extraído')
      }

      // 2. Analizar contenido (opcional, para sugerencias)
      const analysis = await contentAnalyzer.analyzeContent(document.extracted_text)

      // 3. Generar quiz
      const generatedQuiz = await quizGenerator.generateQuiz(document.extracted_text, {
        numQuestions: options.numQuestions || analysis.suggestedQuestionCount,
        difficulty: options.difficulty || analysis.difficulty
      })

      // 4. Guardar quiz en BD
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          document_id: documentId,
          user_id: document.user_id,
          title: generatedQuiz.title,
          difficulty: generatedQuiz.difficulty,
          total_questions: generatedQuiz.questions.length
        })
        .select()
        .single()

      if (quizError) throw quizError

      // 5. Guardar preguntas
      const questionsToInsert = generatedQuiz.questions.map((q, index) => ({
        quiz_id: quiz.id,
        question_text: q.question_text,
        question_type: q.question_type,
        correct_answer: q.correct_answer,
        options: q.options,
        explanation: q.explanation,
        order: index + 1
      }))

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) throw questionsError

      return {
        quiz,
        analysis
      }
    } catch (error) {
      console.error('Error generating quiz from document:', error)
      throw error
    }
  }
}

// Exportar instancia singleton
export const documentsService = new DocumentsService()
