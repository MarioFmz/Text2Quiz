// Edge Function para generar quizzes con OpenAI
// Esto evita problemas de CORS al llamar desde el frontend

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateQuizRequest {
  documentId: string
  numQuestions?: number
  difficulty?: 'easy' | 'medium' | 'hard'
}

interface GeneratedQuestion {
  question_text: string
  question_type: 'multiple_choice' | 'true_false'
  correct_answer: string
  options: string[]
  explanation: string
}

interface GeneratedQuiz {
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  questions: GeneratedQuestion[]
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { documentId, numQuestions = 10, difficulty = 'medium' } = await req.json() as GenerateQuizRequest

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Get document from database
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      throw new Error('Documento no encontrado')
    }

    if (!document.extracted_text) {
      throw new Error('El documento no tiene texto extraído')
    }

    // Analyze content first
    const analysis = await analyzeContent(document.extracted_text)

    // Generate quiz with OpenAI
    const quiz = await generateQuizWithOpenAI(
      document.extracted_text,
      numQuestions || analysis.suggestedQuestionCount,
      difficulty || analysis.difficulty
    )

    // Save quiz to database
    const { data: savedQuiz, error: quizError } = await supabaseClient
      .from('quizzes')
      .insert({
        document_id: documentId,
        user_id: document.user_id,
        title: quiz.title,
        difficulty: quiz.difficulty,
        total_questions: quiz.questions.length
      })
      .select()
      .single()

    if (quizError) throw quizError

    // Save questions
    const questionsToInsert = quiz.questions.map((q, index) => ({
      quiz_id: savedQuiz.id,
      question_text: q.question_text,
      question_type: q.question_type,
      correct_answer: q.correct_answer,
      options: q.options,
      explanation: q.explanation,
      order: index + 1
    }))

    const { error: questionsError } = await supabaseClient
      .from('questions')
      .insert(questionsToInsert)

    if (questionsError) throw questionsError

    return new Response(
      JSON.stringify({
        success: true,
        quiz: savedQuiz,
        analysis
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error al generar el quiz'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function analyzeContent(text: string) {
  const wordCount = text.split(/\s+/).length
  const sentenceCount = text.split(/[.!?]+/).length

  let difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  if (wordCount < 500) difficulty = 'easy'
  if (wordCount > 2000) difficulty = 'hard'

  const suggestedQuestionCount = Math.min(Math.max(Math.floor(wordCount / 200), 5), 20)

  return {
    difficulty,
    suggestedQuestionCount,
    keyConceptsCount: Math.floor(sentenceCount / 3)
  }
}

async function generateQuizWithOpenAI(
  text: string,
  numQuestions: number,
  difficulty: string
): Promise<GeneratedQuiz> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const prompt = `
Analiza el siguiente texto y genera un quiz educativo de alta calidad en español.

TEXTO:
${text.substring(0, 6000)} ${text.length > 6000 ? '...' : ''}

INSTRUCCIONES:
1. Genera exactamente ${numQuestions} preguntas de nivel ${difficulty}
2. Mezcla preguntas de múltiple opción (4 opciones) y verdadero/falso
3. Las preguntas deben evaluar conceptos clave, no detalles triviales
4. Proporciona explicaciones claras para cada respuesta correcta
5. Para múltiple opción, las opciones incorrectas deben ser plausibles pero claramente incorrectas
6. Genera un título descriptivo para el quiz basado en el contenido

FORMATO DE RESPUESTA (JSON):
{
  "title": "Título del Quiz",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "question_text": "Pregunta aquí",
      "question_type": "multiple_choice" | "true_false",
      "correct_answer": "Respuesta correcta",
      "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
      "explanation": "Explicación de por qué es correcta"
    }
  ]
}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.
  `.trim()

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en educación que crea quizzes educativos de alta calidad. Debes generar preguntas que ayuden a evaluar la comprensión profunda del material. Siempre responde con JSON válido.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('OpenAI API error:', error)
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  if (!content) {
    throw new Error('No se recibió respuesta de OpenAI')
  }

  return JSON.parse(content) as GeneratedQuiz
}
