import { supabase } from './supabase'
import type { Document } from '@/types'
import { documentProcessor } from '@/agents/documentProcessor'
import { contentAnalyzer } from '@/agents/contentAnalyzer'

export interface UploadResult {
  document: Document
  extractedText: string
}

/**
 * Servicio para gestionar documentos en Supabase
 */
export class DocumentsService {
  /**
   * Sanitiza el nombre del archivo removiendo caracteres especiales
   */
  private sanitizeFileName(fileName: string): string {
    // Remover tildes y caracteres especiales
    return fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover tildes
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Reemplazar caracteres especiales con guión bajo
      .replace(/_{2,}/g, '_') // Reemplazar múltiples guiones bajos con uno solo
      .toLowerCase()
  }

  /**
   * Sube un archivo a Supabase Storage y crea el registro en la BD
   */
  async uploadDocument(file: File, userId: string): Promise<UploadResult> {
    try {
      // 1. Sanitizar nombre del archivo
      const sanitizedFileName = this.sanitizeFileName(file.name)
      const fileName = `${userId}/${Date.now()}_${sanitizedFileName}`

      // 2. Subir archivo a Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // 3. Guardar solo el path (no la URL firmada, se generará cuando se necesite)
      // Las URLs firmadas expiran, así que guardamos el path y generamos URLs bajo demanda
      const filePath = uploadData.path

      // 4. Procesar documento para extraer texto
      console.log('Processing file:', file.name, file.type)
      const processed = await documentProcessor.processFile(file)
      console.log('File processed successfully:', {
        textLength: processed.text.length,
        wordCount: processed.wordCount
      })

      if (!processed.text || processed.text.trim().length === 0) {
        throw new Error('No se pudo extraer texto del documento')
      }

      // 5. Crear registro en la base de datos (guardamos el path, no la URL)
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: userId,
          title: file.name,
          file_url: filePath, // Guardamos el path, no la URL
          file_type: file.type === 'application/pdf' ? 'pdf' : 'image',
          processed_status: 'completed',
          extracted_text: processed.text
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        throw dbError
      }

      console.log('Document saved to database:', document.id)

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
   * Genera una URL firmada temporal para acceder a un documento
   * La URL expira después de 1 hora por defecto
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, expiresIn)

    if (error) throw error
    if (!data?.signedUrl) throw new Error('No se pudo generar URL firmada')

    return data.signedUrl
  }

  /**
   * Elimina un documento
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    // 1. Obtener documento para acceder a file_url (que ahora es el path)
    const document = await this.getDocument(documentId)
    if (!document || document.user_id !== userId) {
      throw new Error('Documento no encontrado o sin permisos')
    }

    // 2. Eliminar archivo de Storage usando el path directamente
    if (document.file_url) {
      await supabase.storage.from('documents').remove([document.file_url])
    }

    // 3. Eliminar registro de BD (esto eliminará en cascada quizzes, preguntas, etc.)
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (error) throw error
  }

  /**
   * Genera un quiz desde un documento usando el backend API
   */
  async generateQuizFromDocument(
    documentId: string,
    options: {
      numQuestions?: number
      difficulty?: 'easy' | 'medium' | 'hard'
      name?: string
    } = {}
  ) {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

      // Llamar al backend API para generar el quiz
      const response = await fetch(`${apiUrl}/api/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId,
          numQuestions: options.numQuestions || 10,
          difficulty: options.difficulty || 'medium',
          name: options.name
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error generando quiz')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error('Error generando quiz')
      }

      // Analizar el contenido del documento para estadísticas (opcional)
      const document = await this.getDocument(documentId)
      let analysis = null

      if (document?.extracted_text) {
        analysis = await contentAnalyzer.analyzeContent(document.extracted_text)
      }

      return {
        quiz: result.quiz,
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
