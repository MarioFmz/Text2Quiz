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
          visibility: 'public' | 'private' | 'unlisted'
          category_id: string | null
          tags: string[]
          source: string | null
          global_challenge_id: string | null
          views_count: number
          likes_count: number
          is_verified: boolean
          summary?: string | null
          combined_content?: string | null
          formatted_content?: string | null
        }
        Insert: {
          id?: string
          document_id: string
          user_id: string
          title: string
          difficulty?: 'easy' | 'medium' | 'hard'
          total_questions: number
          generated_at?: string
          visibility?: 'public' | 'private' | 'unlisted'
          category_id?: string | null
          tags?: string[]
          source?: string | null
          global_challenge_id?: string | null
          views_count?: number
          likes_count?: number
          is_verified?: boolean
          summary?: string | null
          combined_content?: string | null
          formatted_content?: string | null
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string
          title?: string
          difficulty?: 'easy' | 'medium' | 'hard'
          total_questions?: number
          visibility?: 'public' | 'private' | 'unlisted'
          category_id?: string | null
          tags?: string[]
          source?: string | null
          global_challenge_id?: string | null
          views_count?: number
          likes_count?: number
          is_verified?: boolean
          summary?: string | null
          combined_content?: string | null
          formatted_content?: string | null
        }
      }
      quiz_categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          parent_id?: string | null
          updated_at?: string
        }
      }
      quiz_likes: {
        Row: {
          id: string
          user_id: string
          quiz_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quiz_id: string
          created_at?: string
        }
        Update: {
          id?: string
        }
      }
      quiz_reports: {
        Row: {
          id: string
          quiz_id: string
          reporter_id: string | null
          reason: 'inappropriate' | 'incorrect' | 'duplicate' | 'spam' | 'other'
          description: string | null
          status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id?: string
          quiz_id: string
          reporter_id?: string | null
          reason: 'inappropriate' | 'incorrect' | 'duplicate' | 'spam' | 'other'
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          reason?: 'inappropriate' | 'incorrect' | 'duplicate' | 'spam' | 'other'
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
      }
      quiz_challenges: {
        Row: {
          id: string
          quiz_id: string
          creator_id: string
          share_code: string
          share_slug: string
          created_at: string
          is_active: boolean
          show_creator_score: boolean
          has_leaderboard: boolean
          is_anonymous: boolean
          views_count: number
          challenge_type: 'global' | 'private'
        }
        Insert: {
          id?: string
          quiz_id: string
          creator_id: string
          share_code: string
          share_slug: string
          created_at?: string
          is_active?: boolean
          show_creator_score?: boolean
          has_leaderboard?: boolean
          is_anonymous?: boolean
          views_count?: number
          challenge_type?: 'global' | 'private'
        }
        Update: {
          is_active?: boolean
          show_creator_score?: boolean
          has_leaderboard?: boolean
          is_anonymous?: boolean
          views_count?: number
        }
      }
      challenge_attempts: {
        Row: {
          id: string
          challenge_id: string
          user_id: string | null
          username: string
          score: number
          total_questions: number
          time_taken: number
          completed_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          user_id?: string | null
          username: string
          score: number
          total_questions: number
          time_taken: number
          completed_at?: string
        }
        Update: {
          score?: number
          time_taken?: number
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
          attempt_snapshot?: any | null
        }
        Insert: {
          id?: string
          user_id: string
          document_id: string
          quiz_id: string
          score: number
          total_questions: number
          completed_at?: string
          attempt_snapshot?: any | null
        }
        Update: {
          id?: string
          score?: number
          total_questions?: number
          attempt_snapshot?: any | null
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
export type QuizCategory = Database['public']['Tables']['quiz_categories']['Row']
export type QuizLike = Database['public']['Tables']['quiz_likes']['Row']
export type QuizReport = Database['public']['Tables']['quiz_reports']['Row']
export type QuizChallenge = Database['public']['Tables']['quiz_challenges']['Row']
export type ChallengeAttempt = Database['public']['Tables']['challenge_attempts']['Row']
