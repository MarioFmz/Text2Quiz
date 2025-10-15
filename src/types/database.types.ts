export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          user_id: string
          title: string
          file_url: string
          file_type: 'pdf' | 'image'
          processed_status: 'pending' | 'processing' | 'completed' | 'error'
          extracted_text: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          file_url: string
          file_type: 'pdf' | 'image'
          processed_status?: 'pending' | 'processing' | 'completed' | 'error'
          extracted_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          file_url?: string
          file_type?: 'pdf' | 'image'
          processed_status?: 'pending' | 'processing' | 'completed' | 'error'
          extracted_text?: string | null
          updated_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          document_id: string
          user_id: string
          title: string
          difficulty: 'easy' | 'medium' | 'hard'
          total_questions: number
          generated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          user_id: string
          title: string
          difficulty?: 'easy' | 'medium' | 'hard'
          total_questions: number
          generated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string
          title?: string
          difficulty?: 'easy' | 'medium' | 'hard'
          total_questions?: number
        }
      }
      questions: {
        Row: {
          id: string
          quiz_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false'
          correct_answer: string
          options: string[]
          explanation: string | null
          order: number
        }
        Insert: {
          id?: string
          quiz_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false'
          correct_answer: string
          options: string[]
          explanation?: string | null
          order: number
        }
        Update: {
          id?: string
          quiz_id?: string
          question_text?: string
          question_type?: 'multiple_choice' | 'true_false'
          correct_answer?: string
          options?: string[]
          explanation?: string | null
          order?: number
        }
      }
      user_answers: {
        Row: {
          id: string
          user_id: string
          question_id: string
          quiz_id: string
          selected_answer: string
          is_correct: boolean
          answered_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          quiz_id: string
          selected_answer: string
          is_correct: boolean
          answered_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          quiz_id?: string
          selected_answer?: string
          is_correct?: boolean
        }
      }
      learning_progress: {
        Row: {
          id: string
          user_id: string
          document_id: string
          quiz_id: string
          score: number
          total_questions: number
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          document_id: string
          quiz_id: string
          score: number
          total_questions: number
          completed_at?: string
        }
        Update: {
          id?: string
          score?: number
          total_questions?: number
        }
      }
    }
  }
}

export type Document = Database['public']['Tables']['documents']['Row']
export type Quiz = Database['public']['Tables']['quizzes']['Row']
export type Question = Database['public']['Tables']['questions']['Row']
export type UserAnswer = Database['public']['Tables']['user_answers']['Row']
export type LearningProgress = Database['public']['Tables']['learning_progress']['Row']
