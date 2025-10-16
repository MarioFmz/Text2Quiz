import axios from 'axios'
import type { QuizFilters, PublicQuizWithDetails, QuizCategory } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface PublicQuizzesResponse {
  success: boolean
  quizzes: PublicQuizWithDetails[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface QuizDetailsResponse {
  success: boolean
  quiz: PublicQuizWithDetails
  questions: any[]
}

export interface CategoriesResponse {
  success: boolean
  categories: QuizCategory[]
}

/**
 * Get all quiz categories
 */
export async function getCategories(): Promise<QuizCategory[]> {
  try {
    const response = await axios.get<CategoriesResponse>(`${API_URL}/api/categories`)
    return response.data.categories
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw error
  }
}

/**
 * Get public quizzes with filters
 */
export async function getPublicQuizzes(
  filters: QuizFilters,
  userId?: string
): Promise<PublicQuizzesResponse> {
  try {
    const params = new URLSearchParams()

    if (filters.category) params.append('category', filters.category)
    if (filters.difficulty) params.append('difficulty', filters.difficulty)
    if (filters.search) params.append('search', filters.search)
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (userId) params.append('userId', userId)

    const response = await axios.get<PublicQuizzesResponse>(
      `${API_URL}/api/public-quizzes?${params.toString()}`
    )

    return response.data
  } catch (error) {
    console.error('Error fetching public quizzes:', error)
    throw error
  }
}

/**
 * Get a specific public quiz with details
 */
export async function getPublicQuiz(
  quizId: string,
  userId?: string
): Promise<QuizDetailsResponse> {
  try {
    const params = userId ? `?userId=${userId}` : ''
    const response = await axios.get<QuizDetailsResponse>(
      `${API_URL}/api/quizzes/${quizId}/public${params}`
    )

    return response.data
  } catch (error) {
    console.error('Error fetching public quiz:', error)
    throw error
  }
}

/**
 * Like or unlike a quiz
 */
export async function toggleQuizLike(quizId: string, userId: string): Promise<{ liked: boolean }> {
  try {
    const response = await axios.post<{ success: boolean; liked: boolean }>(
      `${API_URL}/api/quizzes/${quizId}/like`,
      { userId }
    )

    return { liked: response.data.liked }
  } catch (error) {
    console.error('Error toggling quiz like:', error)
    throw error
  }
}

/**
 * Report a quiz
 */
export async function reportQuiz(
  quizId: string,
  userId: string,
  reason: 'inappropriate' | 'incorrect' | 'duplicate' | 'spam' | 'other',
  description?: string
): Promise<void> {
  try {
    await axios.post(`${API_URL}/api/quizzes/${quizId}/report`, {
      userId,
      reason,
      description
    })
  } catch (error) {
    console.error('Error reporting quiz:', error)
    throw error
  }
}

/**
 * Update quiz visibility and metadata
 */
export async function updateQuizVisibility(
  quizId: string,
  userId: string,
  data: {
    visibility: 'public' | 'private' | 'unlisted'
    category_id?: string
    tags?: string[]
    source?: string
  }
): Promise<any> {
  try {
    const response = await axios.put(
      `${API_URL}/api/quizzes/${quizId}/visibility`,
      {
        userId,
        ...data
      }
    )

    return response.data
  } catch (error) {
    console.error('Error updating quiz visibility:', error)
    throw error
  }
}
