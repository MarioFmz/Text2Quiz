export type { Database, Document, Quiz, Question, UserAnswer, LearningProgress } from './database.types'

export interface User {
  id: string
  email: string
  created_at: string
}

export interface QuizWithQuestions extends Quiz {
  questions: Question[]
}

export interface QuizResult {
  quizId: string
  score: number
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  completedAt: string
}

export interface DocumentUploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
}
