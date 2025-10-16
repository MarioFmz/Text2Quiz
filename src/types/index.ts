export type {
  Database,
  Document,
  Quiz,
  Question,
  UserAnswer,
  LearningProgress,
  QuizCategory,
  QuizLike,
  QuizReport,
  QuizChallenge,
  ChallengeAttempt
} from './database.types'

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

export interface PublicQuizWithDetails extends Quiz {
  category?: QuizCategory
  creator?: {
    display_name: string | null
    avatar_url: string | null
  }
  is_liked?: boolean
  participants_count?: number
}

export interface QuizFilters {
  category?: string
  tags?: string[]
  difficulty?: 'easy' | 'medium' | 'hard'
  search?: string
  sortBy?: 'popular' | 'recent' | 'likes'
  page?: number
  limit?: number
}
