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
   * Si el PDF no tiene texto (escaneado), usa OCR automáticamente
   */
  private async processPDF(file: File): Promise<ProcessedDocument> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      // Intentar extraer texto directamente
      const textPromises: Promise<string>[] = []

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
      const fullText = pagesText.join('\n\n').trim()

      console.log('PDF text extraction:', {
        pages: pdf.numPages,
        textLength: fullText.length
      })

      // Si no hay texto o es muy poco, es un PDF escaneado -> usar OCR
      if (!fullText || fullText.length < 50) {
        console.log('PDF appears to be scanned, using OCR fallback...')
        return await this.processPDFWithOCR(pdf)
      }

      return {
        text: fullText,
        pageCount: pdf.numPages,
        wordCount: this.countWords(fullText),
        characterCount: fullText.length
      }
    } catch (error) {
      console.error('Error processing PDF:', error)
      throw error instanceof Error ? error : new Error('Error al procesar el PDF')
    }
  }

  /**
   * Procesa un PDF escaneado convirtiendo cada página a imagen y aplicando OCR
   */
  private async processPDFWithOCR(pdf: pdfjsLib.PDFDocumentProxy): Promise<ProcessedDocument> {
    console.log(`Processing ${pdf.numPages} pages with OCR...`)

    const ocrPromises: Promise<string>[] = []

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      ocrPromises.push(
        (async () => {
          try {
            const page = await pdf.getPage(pageNum)

            // Renderizar página a canvas
            const viewport = page.getViewport({ scale: 2.0 }) // Escala 2x para mejor OCR
            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')!

            canvas.width = viewport.width
            canvas.height = viewport.height

            await page.render({
              canvasContext: context,
              viewport: viewport
            }).promise

            // Convertir canvas a blob
            const blob = await new Promise<Blob>((resolve) => {
              canvas.toBlob((blob) => resolve(blob!), 'image/png')
            })

            console.log(`OCR on page ${pageNum}/${pdf.numPages}...`)

            // Aplicar OCR a la imagen
            const result = await Tesseract.recognize(blob, 'spa', {
              logger: (m) => {
                if (m.status === 'recognizing text') {
                  console.log(`Page ${pageNum}: ${Math.round(m.progress * 100)}%`)
                }
              }
            })

            return result.data.text
          } catch (error) {
            console.error(`Error processing page ${pageNum}:`, error)
            return ''
          }
        })()
      )
    }

    const ocrTexts = await Promise.all(ocrPromises)
    const fullText = ocrTexts.filter(t => t.trim().length > 0).join('\n\n').trim()

    console.log('OCR processing complete:', {
      pages: pdf.numPages,
      textLength: fullText.length,
      preview: fullText.substring(0, 200)
    })

    if (!fullText || fullText.length < 10) {
      throw new Error('No se pudo extraer texto del PDF. El documento puede estar vacío o la calidad de la imagen es muy baja.')
    }

    return {
      text: fullText,
      pageCount: pdf.numPages,
      wordCount: this.countWords(fullText),
      characterCount: fullText.length
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
