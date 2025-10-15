import * as pdfjsLib from 'pdfjs-dist'
import Tesseract from 'tesseract.js'

// Configurar worker de PDF.js
// El worker debe estar en la carpeta public/
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

export interface ProcessedDocument {
  text: string
  pageCount?: number
  wordCount: number
  characterCount: number
}

/**
 * Agente 1: Document Processing
 * Extrae texto de PDFs e imágenes usando OCR
 */
export class DocumentProcessor {
  /**
   * Procesa un archivo (PDF o imagen) y extrae el texto
   */
  async processFile(file: File): Promise<ProcessedDocument> {
    const fileType = file.type

    if (fileType === 'application/pdf') {
      return await this.processPDF(file)
    } else if (fileType.startsWith('image/')) {
      return await this.processImage(file)
    } else {
      throw new Error('Tipo de archivo no soportado')
    }
  }

  /**
   * Procesa un PDF y extrae el texto de todas las páginas
   */
  private async processPDF(file: File): Promise<ProcessedDocument> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      const textPromises: Promise<string>[] = []

      // Extraer texto de cada página
      for (let i = 1; i <= pdf.numPages; i++) {
        textPromises.push(
          pdf.getPage(i).then(async (page) => {
            const textContent = await page.getTextContent()
            return textContent.items
              .map((item: any) => item.str)
              .join(' ')
          })
        )
      }

      const pagesText = await Promise.all(textPromises)
      const fullText = pagesText.join('\n\n')

      return {
        text: fullText,
        pageCount: pdf.numPages,
        wordCount: this.countWords(fullText),
        characterCount: fullText.length
      }
    } catch (error) {
      console.error('Error processing PDF:', error)
      throw new Error('Error al procesar el PDF')
    }
  }

  /**
   * Procesa una imagen usando OCR (Tesseract.js)
   */
  private async processImage(file: File): Promise<ProcessedDocument> {
    try {
      const result = await Tesseract.recognize(file, 'spa', {
        logger: (m) => console.log(m)
      })

      const text = result.data.text

      return {
        text,
        wordCount: this.countWords(text),
        characterCount: text.length
      }
    } catch (error) {
      console.error('Error processing image:', error)
      throw new Error('Error al procesar la imagen con OCR')
    }
  }

  /**
   * Cuenta las palabras en un texto
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  /**
   * Divide el texto en chunks para procesamiento (útil para textos muy largos)
   */
  chunkText(text: string, maxChunkSize: number = 2000): string[] {
    const words = text.split(/\s+/)
    const chunks: string[] = []
    let currentChunk: string[] = []

    for (const word of words) {
      currentChunk.push(word)
      const currentText = currentChunk.join(' ')

      if (currentText.length >= maxChunkSize) {
        chunks.push(currentText)
        currentChunk = []
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '))
    }

    return chunks
  }

  /**
   * Limpia y normaliza el texto extraído
   */
  cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
      .replace(/\n+/g, '\n') // Múltiples saltos de línea a uno solo
      .trim()
  }
}

// Exportar instancia singleton
export const documentProcessor = new DocumentProcessor()
