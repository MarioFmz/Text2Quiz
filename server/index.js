import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY
});

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Text2Quiz API Server' });
});

// Analyze content endpoint
app.post('/api/analyze-content', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Basic analysis
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).length;

    let difficulty = 'medium';
    if (wordCount < 500) difficulty = 'easy';
    if (wordCount > 2000) difficulty = 'hard';

    const suggestedQuestionCount = Math.min(Math.max(Math.floor(wordCount / 200), 5), 20);

    res.json({
      success: true,
      analysis: {
        difficulty,
        suggestedQuestionCount,
        keyConceptsCount: Math.floor(sentenceCount / 3),
        wordCount,
        sentenceCount
      }
    });
  } catch (error) {
    console.error('Error analyzing content:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate quiz endpoint
app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { documentId, numQuestions = 10, difficulty = 'medium', name, questionType = 'mixed' } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }

    console.log(`Generating quiz for document ${documentId}...`);
    if (name) {
      console.log(`Custom quiz name: ${name}`);
    }
    console.log(`Question type: ${questionType}`);

    // Get document from database
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!document.extracted_text) {
      return res.status(400).json({ error: 'Document has no extracted text' });
    }

    console.log(`Document found: ${document.title}`);
    console.log(`Text length: ${document.extracted_text.length} characters`);

    // Generate quiz with OpenAI
    const prompt = buildQuizPrompt(document.extracted_text, numQuestions, difficulty, questionType);

    console.log('Calling OpenAI API...');

    const completion = await openai.chat.completions.create({
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
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const generatedQuiz = JSON.parse(content);
    console.log(`Quiz generated: ${generatedQuiz.title}, ${generatedQuiz.questions.length} questions`);
    console.log(`Summary generated: ${generatedQuiz.summary ? 'YES' : 'NO'}`);
    if (generatedQuiz.summary) {
      console.log(`Summary preview: ${generatedQuiz.summary.substring(0, 100)}...`);
    }

    // Save quiz to database
    const { data: savedQuiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        document_id: documentId,
        user_id: document.user_id,
        title: name || generatedQuiz.title, // Usar nombre personalizado si está disponible
        difficulty: generatedQuiz.difficulty,
        total_questions: generatedQuiz.questions.length,
        summary: generatedQuiz.summary || 'Repasa los conceptos clave antes de comenzar el quiz.'
      })
      .select()
      .single();

    if (quizError) throw quizError;

    // Save questions
    const questionsToInsert = generatedQuiz.questions.map((q, index) => ({
      quiz_id: savedQuiz.id,
      question_text: q.question_text,
      question_type: q.question_type,
      correct_answer: q.correct_answer,
      options: q.options,
      explanation: q.explanation,
      order: index + 1
    }));

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert);

    if (questionsError) throw questionsError;

    console.log('Quiz saved to database successfully');

    res.json({
      success: true,
      quiz: savedQuiz
    });
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate quiz from multiple documents
app.post('/api/quizzes/create-from-multiple', async (req, res) => {
  try {
    const { userId, title, documentIds, numQuestions = 10, difficulty = 'medium', questionType = 'mixed' } = req.body;

    if (!userId || !title || !documentIds || documentIds.length === 0) {
      return res.status(400).json({ error: 'userId, title, and documentIds are required' });
    }

    console.log(`Creating quiz from ${documentIds.length} document(s)...`);
    console.log(`Quiz title: ${title}`);

    // Get all documents
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .in('id', documentIds);

    if (docsError || !documents || documents.length === 0) {
      return res.status(404).json({ error: 'Documents not found' });
    }

    // Combine all extracted text
    let combinedText = '';
    const documentTitles = [];

    for (const doc of documents) {
      if (doc.extracted_text) {
        combinedText += `\n\n=== ${doc.title} ===\n\n${doc.extracted_text}`;
        documentTitles.push(doc.title);
      }
    }

    if (!combinedText.trim()) {
      return res.status(400).json({ error: 'No text found in documents' });
    }

    console.log(`Combined text from: ${documentTitles.join(', ')}`);
    console.log(`Total combined text length: ${combinedText.length} characters`);

    // Generate quiz with OpenAI
    const prompt = buildQuizPrompt(combinedText, numQuestions, difficulty, questionType);

    console.log('Calling OpenAI API...');
    console.log(`Question type: ${questionType}`);

    const completion = await openai.chat.completions.create({
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
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const generatedQuiz = JSON.parse(content);
    console.log(`Quiz generated: ${generatedQuiz.questions.length} questions`);

    // Save quiz to database (without document_id, using new model)
    const { data: savedQuiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        user_id: userId,
        title: title, // Use user-provided title
        difficulty: generatedQuiz.difficulty,
        total_questions: generatedQuiz.questions.length,
        summary: generatedQuiz.summary || 'Repasa los conceptos clave antes de comenzar el quiz.',
        combined_content: combinedText // Store combined content
      })
      .select()
      .single();

    if (quizError) throw quizError;

    // Create quiz_documents relationships
    const quizDocuments = documentIds.map(docId => ({
      quiz_id: savedQuiz.id,
      document_id: docId
    }));

    const { error: relError } = await supabase
      .from('quiz_documents')
      .insert(quizDocuments);

    if (relError) throw relError;

    // Save questions
    const questionsToInsert = generatedQuiz.questions.map((q, index) => ({
      quiz_id: savedQuiz.id,
      question_text: q.question_text,
      question_type: q.question_type,
      correct_answer: q.correct_answer,
      options: q.options,
      explanation: q.explanation,
      order: index + 1
    }));

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert);

    if (questionsError) throw questionsError;

    console.log('Quiz saved successfully with multiple document links');

    res.json({
      success: true,
      quiz: savedQuiz,
      documentCount: documentIds.length
    });
  } catch (error) {
    console.error('Error creating quiz from multiple documents:', error);
    res.status(500).json({ error: error.message });
  }
});

function buildQuizPrompt(text, numQuestions, difficulty, questionType = 'mixed') {
  // Determinar las instrucciones según el tipo de pregunta
  let questionTypeInstructions = '';
  let questionTypeExamples = '';

  if (questionType === 'multiple_choice') {
    questionTypeInstructions = '3. Genera SOLO preguntas de múltiple opción con 4 opciones cada una';
    questionTypeExamples = `
    {
      "question_text": "Pregunta aquí",
      "question_type": "multiple_choice",
      "correct_answer": "Respuesta correcta",
      "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
      "explanation": "Explicación de por qué es correcta"
    }`;
  } else if (questionType === 'true_false') {
    questionTypeInstructions = '3. Genera SOLO preguntas de verdadero/falso con 2 opciones cada una';
    questionTypeExamples = `
    {
      "question_text": "Pregunta verdadero/falso",
      "question_type": "true_false",
      "correct_answer": "Verdadero",
      "options": ["Verdadero", "Falso"],
      "explanation": "Explicación"
    }`;
  } else {
    // mixed
    questionTypeInstructions = '3. Mezcla preguntas de múltiple opción (4 opciones) y verdadero/falso (2 opciones)';
    questionTypeExamples = `
    {
      "question_text": "Pregunta aquí",
      "question_type": "multiple_choice",
      "correct_answer": "Respuesta correcta",
      "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
      "explanation": "Explicación de por qué es correcta"
    },
    {
      "question_text": "Pregunta verdadero/falso",
      "question_type": "true_false",
      "correct_answer": "Verdadero",
      "options": ["Verdadero", "Falso"],
      "explanation": "Explicación"
    }`;
  }

  return `
Analiza el siguiente texto y genera un quiz educativo de alta calidad en español.

TEXTO:
${text.substring(0, 6000)} ${text.length > 6000 ? '...' : ''}

INSTRUCCIONES:
1. Genera un resumen conciso con los conceptos más importantes (3-5 puntos clave) para que el usuario repase antes del quiz
2. Genera exactamente ${numQuestions} preguntas de nivel ${difficulty}
${questionTypeInstructions}
4. Las preguntas deben evaluar conceptos clave, no detalles triviales
5. Proporciona explicaciones claras para cada respuesta correcta
6. Para múltiple opción, las opciones incorrectas deben ser plausibles pero claramente incorrectas
7. Genera un título descriptivo para el quiz basado en el contenido

FORMATO DE RESPUESTA (JSON):
{
  "title": "Título del Quiz",
  "difficulty": "${difficulty}",
  "summary": "• Concepto clave 1: Breve explicación del concepto principal\\n• Concepto clave 2: Breve explicación del segundo concepto\\n• Concepto clave 3: Breve explicación del tercer concepto",
  "questions": [${questionTypeExamples}
  ]
}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.
  `.trim();
}

// ============================================
// CHALLENGES & SHARING ENDPOINTS
// ============================================

// Función helper para generar código único
function generateShareCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Función helper para generar slug único
function generateShareSlug(title) {
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const random = Math.random().toString(36).substring(2, 8);
  const fullSlug = `${slug}-${random}`;

  // Limitar a 50 caracteres (límite de la base de datos)
  return fullSlug.substring(0, 50);
}

// Crear un challenge compartido
app.post('/api/challenges/create', async (req, res) => {
  try {
    const {
      quizId,
      creatorId,
      creatorUsername,
      creatorScore,
      totalQuestions,
      timeTaken = 0,
      showCreatorScore = true,
      hasLeaderboard = true,
      isAnonymous = false
    } = req.body;

    if (!quizId || !creatorId || !totalQuestions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Obtener info del quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('title')
      .eq('id', quizId)
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // ⭐ VERIFICAR SI YA EXISTE UN CHALLENGE ACTIVO PARA ESTE QUIZ
    const { data: existingChallenge, error: existingError } = await supabase
      .from('quiz_challenges')
      .select('id, share_code, share_slug, is_anonymous')
      .eq('quiz_id', quizId)
      .eq('creator_id', creatorId)
      .eq('is_active', true)
      .maybeSingle();

    // Si ya existe un challenge activo, devolverlo
    if (existingChallenge) {
      console.log(`Challenge already exists for quiz ${quizId}: ${existingChallenge.share_code}`);

      return res.json({
        success: true,
        challenge: {
          id: existingChallenge.id,
          shareCode: existingChallenge.share_code,
          shareSlug: existingChallenge.share_slug,
          shareUrl: `/challenge/${existingChallenge.share_slug}`
        },
        share_code: existingChallenge.share_code,
        share_slug: existingChallenge.share_slug,
        isExisting: true // Indicador de que se reutilizó un challenge existente
      });
    }

    // Generar código y slug únicos
    let shareCode = generateShareCode();
    let shareSlug = generateShareSlug(quiz.title);

    // Verificar unicidad del código
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('quiz_challenges')
        .select('id')
        .eq('share_code', shareCode)
        .single();

      if (!existing) break;
      shareCode = generateShareCode();
      attempts++;
    }

    // Crear challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('quiz_challenges')
      .insert({
        quiz_id: quizId,
        creator_id: creatorId,
        share_code: shareCode,
        share_slug: shareSlug,
        show_creator_score: showCreatorScore,
        has_leaderboard: hasLeaderboard,
        is_anonymous: isAnonymous
      })
      .select()
      .single();

    if (challengeError) throw challengeError;

    console.log(`Challenge created: ${shareCode}`);

    // Crear el intento inicial del creador
    const { data: creatorAttempt, error: attemptError } = await supabase
      .from('challenge_attempts')
      .insert({
        challenge_id: challenge.id,
        user_id: creatorId,
        username: creatorUsername || 'Creador',
        score: creatorScore,
        total_questions: totalQuestions,
        time_taken: timeTaken
      })
      .select()
      .single();

    if (attemptError) {
      console.error('Error creating creator attempt:', attemptError);
      // No lanzar error, continuar con la respuesta
    } else {
      console.log(`Creator attempt saved: ${creatorUsername} - ${creatorScore}/${totalQuestions}`);
    }

    res.json({
      success: true,
      challenge: {
        id: challenge.id,
        shareCode: challenge.share_code,
        shareSlug: challenge.share_slug,
        shareUrl: `/challenge/${challenge.share_slug}`
      },
      share_code: shareCode,
      share_slug: shareSlug
    });
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener todos los challenges del usuario
app.get('/api/challenges/my-challenges', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Obtener challenges del usuario con estadísticas
    const { data: challenges, error: challengesError} = await supabase
      .from('quiz_challenges')
      .select(`
        id,
        quiz_id,
        creator_id,
        share_code,
        share_slug,
        created_at,
        is_anonymous,
        quizzes!quiz_challenges_quiz_id_fkey (
          title,
          total_questions
        )
      `)
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (challengesError) throw challengesError;

    // Para cada challenge, obtener estadísticas
    const challengesWithStats = await Promise.all(
      (challenges || []).map(async (challenge) => {
        // Obtener todos los intentos del challenge
        const { data: attempts } = await supabase
          .from('challenge_attempts')
          .select('score, total_questions, user_id')
          .eq('challenge_id', challenge.id)
          .order('score', { ascending: false });

        const totalAttempts = attempts?.length || 0;
        const bestAttempt = attempts?.[0];
        const bestScore = bestAttempt
          ? Math.round((bestAttempt.score / bestAttempt.total_questions) * 100)
          : 0;

        // Encontrar el intento del creador y su ranking
        const creatorAttempt = attempts?.find(a => a.user_id === userId);
        const creatorPercentage = creatorAttempt
          ? Math.round((creatorAttempt.score / creatorAttempt.total_questions) * 100)
          : 0;

        // Calcular ranking del creador
        let creatorRank = null;
        if (creatorAttempt && attempts) {
          const sortedAttempts = [...attempts].sort((a, b) => {
            const percentA = (a.score / a.total_questions) * 100;
            const percentB = (b.score / b.total_questions) * 100;
            return percentB - percentA;
          });
          creatorRank = sortedAttempts.findIndex(a => a.user_id === userId) + 1;
        }

        return {
          id: challenge.id,
          quiz_id: challenge.quiz_id,
          quiz_title: challenge.quizzes?.title || 'Quiz sin título',
          share_code: challenge.share_code,
          share_slug: challenge.share_slug,
          is_active: true, // All challenges are active by default
          is_anonymous: challenge.is_anonymous || false,
          created_at: challenge.created_at,
          total_attempts: totalAttempts,
          best_score: bestScore,
          creator_percentage: creatorPercentage,
          creator_rank: creatorRank
        };
      })
    );

    // También obtener challenges en los que el usuario ha participado (pero no creó)
    const { data: participatedAttempts, error: attemptsError } = await supabase
      .from('challenge_attempts')
      .select(`
        challenge_id,
        score,
        total_questions,
        completed_at,
        quiz_challenges!inner (
          id,
          quiz_id,
          creator_id,
          share_slug,
          created_at,
          quizzes!quiz_challenges_quiz_id_fkey (
            title
          )
        )
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (attemptsError) {
      console.error('Error loading participated challenges:', attemptsError);
    } else {
      console.log(`Found ${participatedAttempts?.length || 0} participated attempts for user ${userId}`);
    }

    // Procesar challenges participados (sin duplicados de los creados)
    const createdChallengeIds = new Set(challengesWithStats.map(c => c.id));
    const participatedChallenges = [];

    if (participatedAttempts) {
      const uniqueChallenges = new Map();

      for (const attempt of participatedAttempts) {
        const challenge = attempt.quiz_challenges;
        console.log(`Processing attempt: challenge=${challenge?.id}, creator=${challenge?.creator_id}, userId=${userId}`);
        // Filtrar: no incluir si el usuario es el creador O si ya está en los creados
        if (challenge && challenge.creator_id !== userId && !createdChallengeIds.has(challenge.id)) {
          console.log(`✓ Challenge ${challenge.id} passed filter`);

          if (!uniqueChallenges.has(challenge.id)) {
            const percentage = Math.round((attempt.score / attempt.total_questions) * 100);

            uniqueChallenges.set(challenge.id, {
              id: challenge.id,
              quiz_id: challenge.quiz_id,
              quiz_title: challenge.quizzes?.title || 'Quiz sin título',
              share_slug: challenge.share_slug,
              created_at: attempt.completed_at,
              is_active: true,
              is_participant: true, // Marca como participante, no creador
              user_score: percentage,
              user_attempts: 1
            });
          } else {
            // Actualizar con la mejor puntuación
            const existing = uniqueChallenges.get(challenge.id);
            const newPercentage = Math.round((attempt.score / attempt.total_questions) * 100);
            if (newPercentage > existing.user_score) {
              existing.user_score = newPercentage;
            }
            existing.user_attempts++;
          }
        } else {
          console.log(`✗ Challenge filtered out: creator=${challenge?.creator_id === userId}, alreadyCreated=${challenge ? createdChallengeIds.has(challenge.id) : 'no challenge'}`);
        }
      }

      participatedChallenges.push(...uniqueChallenges.values());
    }

    console.log(`Returning: ${challengesWithStats.length} created, ${participatedChallenges.length} participated`);

    res.json({
      success: true,
      challenges: challengesWithStats,
      participated: participatedChallenges
    });
  } catch (error) {
    console.error('Error getting my challenges:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener un challenge por código, slug o ID
app.get('/api/challenges/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;

    // Buscar por ID, código o slug
    const { data: challenge, error: challengeError } = await supabase
      .from('quiz_challenges')
      .select(`
        *,
        quizzes (
          id,
          title,
          difficulty,
          total_questions,
          summary,
          document_id
        )
      `)
      .or(`id.eq.${identifier},share_code.eq.${identifier},share_slug.eq.${identifier}`)
      .single();

    if (challengeError || !challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Obtener las preguntas del quiz
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', challenge.quiz_id);

    if (questionsError) throw questionsError;

    // Obtener documentos asociados
    const documents = [];

    // 1. Legacy: documento directo del quiz
    if (challenge.quizzes.document_id) {
      const { data: doc } = await supabase
        .from('documents')
        .select('id, title, file_url')
        .eq('id', challenge.quizzes.document_id)
        .single();

      if (doc) documents.push(doc);
    }

    // 2. Nuevo: documentos de la tabla quiz_documents
    const { data: quizDocs } = await supabase
      .from('quiz_documents')
      .select(`
        documents (
          id,
          title,
          file_url
        )
      `)
      .eq('quiz_id', challenge.quiz_id);

    if (quizDocs) {
      for (const qd of quizDocs) {
        if (qd.documents && !documents.find(d => d.id === qd.documents.id)) {
          documents.push(qd.documents);
        }
      }
    }

    // Incrementar views
    await supabase
      .from('quiz_challenges')
      .update({ views_count: challenge.views_count + 1 })
      .eq('id', challenge.id);

    res.json({
      success: true,
      challenge,
      quiz: challenge.quizzes,
      questions: questions || [],
      documents: documents
    });
  } catch (error) {
    console.error('Error getting challenge:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener leaderboard de un challenge
app.get('/api/challenges/:challengeId/leaderboard', async (req, res) => {
  try {
    const { challengeId } = req.params;

    // Primero obtener el creator_id y is_anonymous del challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('quiz_challenges')
      .select('creator_id, is_anonymous')
      .eq('id', challengeId)
      .single();

    if (challengeError) throw challengeError;

    const { data: attempts, error: attemptsError } = await supabase
      .from('challenge_attempts')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('score', { ascending: false })
      .order('time_taken', { ascending: true })
      .limit(100);

    if (attemptsError) throw attemptsError;

    // Marcar qué intentos son del creador
    const leaderboardWithCreatorFlag = (attempts || []).map(attempt => ({
      ...attempt,
      is_creator: attempt.user_id === challenge.creator_id
    }));

    res.json({
      success: true,
      leaderboard: leaderboardWithCreatorFlag,
      creator_id: challenge.creator_id,
      is_anonymous: challenge.is_anonymous || false
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// Guardar un intento en el challenge
app.post('/api/challenges/:challengeId/attempt', async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { userId, username, score, totalQuestions, timeTaken } = req.body;

    if (!username || score === undefined || !totalQuestions || !timeTaken) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Guardar intento
    const { data: attempt, error: attemptError } = await supabase
      .from('challenge_attempts')
      .insert({
        challenge_id: challengeId,
        user_id: userId || null,
        username,
        score,
        total_questions: totalQuestions,
        time_taken: timeTaken
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    // Si hay usuario, actualizar racha
    if (userId) {
      await supabase.rpc('update_user_streak', { p_user_id: userId });
    }

    console.log(`Challenge attempt saved: ${username} - ${score}/${totalQuestions}`);

    res.json({
      success: true,
      attempt
    });
  } catch (error) {
    console.error('Error saving attempt:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save challenge progress (auto-save functionality)
app.post('/api/challenges/:challengeId/save-progress', async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { userId, sessionId, answers, currentQuestionIndex } = req.body;

    if (!challengeId || (!userId && !sessionId)) {
      return res.status(400).json({ error: 'challengeId and userId/sessionId are required' });
    }

    if (answers === undefined || currentQuestionIndex === undefined) {
      return res.status(400).json({ error: 'answers and currentQuestionIndex are required' });
    }

    // Build the upsert query
    let query = {
      challenge_id: challengeId,
      answers: answers || {},
      current_question_index: currentQuestionIndex,
      completed: false
    };

    if (userId) {
      query.user_id = userId;
    } else {
      query.session_id = sessionId;
    }

    // Check if progress already exists
    let existingProgress;
    if (userId) {
      const { data } = await supabase
        .from('challenge_progress')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .eq('completed', false)
        .maybeSingle();
      existingProgress = data;
    } else {
      const { data } = await supabase
        .from('challenge_progress')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('session_id', sessionId)
        .eq('completed', false)
        .maybeSingle();
      existingProgress = data;
    }

    let savedProgress;
    if (existingProgress) {
      // Update existing progress
      const { data, error } = await supabase
        .from('challenge_progress')
        .update({
          answers: answers || {},
          current_question_index: currentQuestionIndex
        })
        .eq('id', existingProgress.id)
        .select()
        .single();

      if (error) throw error;
      savedProgress = data;
    } else {
      // Insert new progress
      const { data, error } = await supabase
        .from('challenge_progress')
        .insert(query)
        .select()
        .single();

      if (error) throw error;
      savedProgress = data;
    }

    console.log(`Progress saved for challenge ${challengeId}: ${Object.keys(answers || {}).length} answers, question ${currentQuestionIndex}`);

    res.json({
      success: true,
      progress: savedProgress,
      message: 'Progress saved successfully'
    });
  } catch (error) {
    console.error('Error saving challenge progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get saved challenge progress
app.get('/api/challenges/:challengeId/get-progress', async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { userId, sessionId } = req.query;

    if (!challengeId || (!userId && !sessionId)) {
      return res.status(400).json({ error: 'challengeId and userId/sessionId are required' });
    }

    // Query progress
    let query = supabase
      .from('challenge_progress')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('completed', false);

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('session_id', sessionId);
    }

    const { data: progress, error } = await query.maybeSingle();

    if (error) throw error;

    if (progress) {
      console.log(`Progress retrieved for challenge ${challengeId}: ${Object.keys(progress.answers || {}).length} answers`);
    }

    res.json({
      success: true,
      progress: progress || null
    });
  } catch (error) {
    console.error('Error getting challenge progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete saved challenge progress
app.delete('/api/challenges/:challengeId/delete-progress', async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { userId, sessionId } = req.body;

    if (!challengeId || (!userId && !sessionId)) {
      return res.status(400).json({ error: 'challengeId and userId/sessionId are required' });
    }

    // Build delete query
    let query = supabase
      .from('challenge_progress')
      .delete()
      .eq('challenge_id', challengeId)
      .eq('completed', false);

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('session_id', sessionId);
    }

    const { error } = await query;

    if (error) throw error;

    console.log(`Progress deleted for challenge ${challengeId}`);

    res.json({
      success: true,
      message: 'Progress deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting challenge progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PUBLIC QUIZZES & DISCOVERY ENDPOINTS
// ============================================

// Get all quiz categories
app.get('/api/categories', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('quiz_categories')
      .select('*')
      .order('name');

    if (error) throw error;

    res.json({
      success: true,
      categories: categories || []
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: error.message });
  }
});

// List public quizzes with filters and search
app.get('/api/public-quizzes', async (req, res) => {
  try {
    const {
      category,
      difficulty,
      search,
      sortBy = 'recent',
      page = 1,
      limit = 12,
      userId
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Base query
    let query = supabase
      .from('quizzes')
      .select(`
        id,
        title,
        difficulty,
        total_questions,
        tags,
        source,
        is_verified,
        views_count,
        likes_count,
        generated_at,
        category_id,
        global_challenge_id,
        user_id,
        quiz_categories (
          id,
          name,
          slug,
          icon
        )
      `, { count: 'exact' })
      .eq('visibility', 'public');

    // Apply filters
    if (category) {
      query = query.eq('category_id', category);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,tags.cs.{${search}}`);
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        query = query.order('views_count', { ascending: false });
        break;
      case 'likes':
        query = query.order('likes_count', { ascending: false });
        break;
      case 'completed':
        // For completed, we'll sort after getting participants count
        query = query.order('generated_at', { ascending: false });
        break;
      case 'recent':
      default:
        query = query.order('generated_at', { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: quizzes, error, count } = await query;

    if (error) throw error;

    // If user is logged in, check which quizzes they've liked
    let likedQuizIds = new Set();
    if (userId) {
      const { data: likes } = await supabase
        .from('quiz_likes')
        .select('quiz_id')
        .eq('user_id', userId);

      likedQuizIds = new Set(likes?.map(l => l.quiz_id) || []);
    }

    // Get participants count and creator info for each quiz
    let quizzesWithStats = await Promise.all(
      (quizzes || []).map(async (quiz) => {
        let participants_count = 0;
        let creator = null;

        if (quiz.global_challenge_id) {
          const { count } = await supabase
            .from('challenge_attempts')
            .select('id', { count: 'exact', head: true })
            .eq('challenge_id', quiz.global_challenge_id);

          participants_count = count || 0;
        }

        // Get creator info only if user_id is not null
        if (quiz.user_id) {
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('display_name, avatar_url')
            .eq('user_id', quiz.user_id)
            .single();

          creator = userProfile;
        }

        return {
          ...quiz,
          category: quiz.quiz_categories,
          creator,
          is_liked: likedQuizIds.has(quiz.id),
          participants_count
        };
      })
    );

    // If sorting by completed, sort by participants_count
    if (sortBy === 'completed') {
      quizzesWithStats.sort((a, b) => b.participants_count - a.participants_count);
    }

    res.json({
      success: true,
      quizzes: quizzesWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting public quizzes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific public quiz with full details
app.get('/api/quizzes/:quizId/public', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { userId } = req.query;

    // Get quiz with full details
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select(`
        *,
        quiz_categories (
          id,
          name,
          slug,
          icon,
          description
        )
      `)
      .eq('id', quizId)
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check if quiz is public or if user owns it
    if (quiz.visibility !== 'public' && quiz.user_id !== userId) {
      return res.status(403).json({ error: 'Quiz is not public' });
    }

    // Get creator info only if user_id is not null
    let creator = null;
    if (quiz.user_id) {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('display_name, avatar_url, bio')
        .eq('user_id', quiz.user_id)
        .maybeSingle();

      creator = userProfile;
    }

    // Get questions
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order');

    // Check if user has liked this quiz
    let is_liked = false;
    if (userId) {
      const { data: like } = await supabase
        .from('quiz_likes')
        .select('id')
        .eq('user_id', userId)
        .eq('quiz_id', quizId)
        .maybeSingle();

      is_liked = !!like;
    }

    // Get participants count from global challenge
    let participants_count = 0;
    if (quiz.global_challenge_id) {
      const { count } = await supabase
        .from('challenge_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', quiz.global_challenge_id);

      participants_count = count || 0;
    }

    // Increment view count
    await supabase
      .from('quizzes')
      .update({ views_count: quiz.views_count + 1 })
      .eq('id', quizId);

    res.json({
      success: true,
      quiz: {
        ...quiz,
        category: quiz.quiz_categories,
        creator,
        is_liked,
        participants_count
      },
      questions: questions || []
    });
  } catch (error) {
    console.error('Error getting public quiz:', error);
    res.status(500).json({ error: error.message });
  }
});

// Like/unlike a quiz
app.post('/api/quizzes/:quizId/like', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('quiz_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .maybeSingle();

    if (existingLike) {
      // Unlike: delete the like
      const { error: deleteError } = await supabase
        .from('quiz_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) throw deleteError;

      res.json({
        success: true,
        liked: false,
        message: 'Quiz unliked'
      });
    } else {
      // Like: insert new like
      const { error: insertError } = await supabase
        .from('quiz_likes')
        .insert({
          user_id: userId,
          quiz_id: quizId
        });

      if (insertError) throw insertError;

      res.json({
        success: true,
        liked: true,
        message: 'Quiz liked'
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: error.message });
  }
});

// Report a quiz
app.post('/api/quizzes/:quizId/report', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { userId, reason, description } = req.body;

    if (!userId || !reason) {
      return res.status(400).json({ error: 'userId and reason are required' });
    }

    const validReasons = ['inappropriate', 'incorrect', 'duplicate', 'spam', 'other'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Invalid reason' });
    }

    // Create report
    const { error } = await supabase
      .from('quiz_reports')
      .insert({
        quiz_id: quizId,
        reporter_id: userId,
        reason,
        description: description || null
      });

    if (error) throw error;

    res.json({
      success: true,
      message: 'Report submitted successfully'
    });
  } catch (error) {
    console.error('Error reporting quiz:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update quiz visibility and metadata
app.put('/api/quizzes/:quizId/visibility', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { userId, visibility, category_id, tags, source } = req.body;

    if (!userId || !visibility) {
      return res.status(400).json({ error: 'userId and visibility are required' });
    }

    // Verify ownership
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('user_id, visibility')
      .eq('id', quizId)
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update quiz
    const updateData = {
      visibility,
      ...(category_id !== undefined && { category_id }),
      ...(tags !== undefined && { tags }),
      ...(source !== undefined && { source })
    };

    const { data: updatedQuiz, error: updateError } = await supabase
      .from('quizzes')
      .update(updateData)
      .eq('id', quizId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Note: The trigger will automatically create a global challenge if visibility is set to 'public'

    res.json({
      success: true,
      quiz: updatedQuiz,
      message: visibility === 'public' ? 'Quiz is now public and discoverable' : 'Quiz visibility updated'
    });
  } catch (error) {
    console.error('Error updating quiz visibility:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a quiz
app.delete('/api/quizzes/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Verify ownership
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('user_id, title')
      .eq('id', quizId)
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this quiz' });
    }

    // Delete quiz (cascading deletes will handle related records)
    const { error: deleteError } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId);

    if (deleteError) throw deleteError;

    console.log(`Quiz deleted: ${quiz.title} (${quizId}) by user ${userId}`);

    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ error: error.message });
  }
});

// Copy a public quiz to user's account
app.post('/api/quizzes/:quizId/copy', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get the original quiz
    const { data: originalQuiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (quizError || !originalQuiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check if quiz is public
    if (originalQuiz.visibility !== 'public') {
      return res.status(403).json({ error: 'Quiz is not public' });
    }

    // Create a copy for the user
    const { data: copiedQuiz, error: copyError } = await supabase
      .from('quizzes')
      .insert({
        user_id: userId,
        title: `${originalQuiz.title} (Copia)`,
        difficulty: originalQuiz.difficulty,
        total_questions: originalQuiz.total_questions,
        summary: originalQuiz.summary,
        visibility: 'private', // Copied quizzes are private by default
        category_id: originalQuiz.category_id,
        tags: originalQuiz.tags,
        source: originalQuiz.source
      })
      .select()
      .single();

    if (copyError) throw copyError;

    // Copy all questions
    console.log(`Fetching questions for quiz ${quizId}...`);
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quizId);

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      throw questionsError;
    }

    console.log(`Found ${questions?.length || 0} questions to copy`);

    if (questions && questions.length > 0) {
      const copiedQuestions = questions.map(q => ({
        quiz_id: copiedQuiz.id,
        question_text: q.question_text,
        question_type: q.question_type,
        correct_answer: q.correct_answer,
        options: q.options,
        explanation: q.explanation,
        order: q.order
      }));

      console.log(`Inserting ${copiedQuestions.length} questions into new quiz...`);
      const { error: insertQuestionsError } = await supabase
        .from('questions')
        .insert(copiedQuestions);

      if (insertQuestionsError) {
        console.error('Error inserting questions:', insertQuestionsError);
        throw insertQuestionsError;
      }

      console.log(`Successfully copied ${copiedQuestions.length} questions`);
    } else {
      console.log('No questions found in original quiz');
    }

    console.log(`Quiz ${quizId} copied to user ${userId} as ${copiedQuiz.id}`);

    res.json({
      success: true,
      quiz: copiedQuiz,
      message: 'Quiz copiado exitosamente a tus quizzes'
    });
  } catch (error) {
    console.error('Error copying quiz:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get or create global challenge for a public quiz
app.post('/api/quizzes/:quizId/get-or-create-challenge', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get the quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, title, global_challenge_id, visibility, total_questions')
      .eq('id', quizId)
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check if quiz is public
    if (quiz.visibility !== 'public') {
      return res.status(403).json({ error: 'Quiz is not public' });
    }

    // If global challenge already exists, return it
    if (quiz.global_challenge_id) {
      const { data: existingChallenge, error: challengeError } = await supabase
        .from('quiz_challenges')
        .select('id, share_code, share_slug')
        .eq('id', quiz.global_challenge_id)
        .single();

      if (!challengeError && existingChallenge) {
        console.log(`Using existing global challenge ${existingChallenge.id} for quiz ${quizId}`);
        return res.json({
          success: true,
          challenge: existingChallenge,
          message: 'Uniéndote al desafío global'
        });
      }
    }

    // Create global challenge
    const shareCode = generateShareCode();
    const shareSlug = generateShareSlug(quiz.title);

    const { data: newChallenge, error: createError } = await supabase
      .from('quiz_challenges')
      .insert({
        quiz_id: quizId,
        creator_id: quiz.user_id || userId, // Use quiz creator or current user
        share_code: shareCode,
        share_slug: shareSlug,
        show_creator_score: false, // No creator score for global challenges
        has_leaderboard: true,
        is_anonymous: false
      })
      .select()
      .single();

    if (createError) throw createError;

    // Update quiz with global_challenge_id
    await supabase
      .from('quizzes')
      .update({ global_challenge_id: newChallenge.id })
      .eq('id', quizId);

    console.log(`Created global challenge ${newChallenge.id} for quiz ${quizId}`);

    res.json({
      success: true,
      challenge: newChallenge,
      message: 'Desafío global creado exitosamente'
    });
  } catch (error) {
    console.error('Error getting/creating global challenge:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// USER PROFILE ENDPOINTS
// ============================================

// Get user profile
app.get('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
app.put('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { first_name, last_name, display_name, avatar_url, bio } = req.body;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update({
        first_name,
        last_name,
        display_name,
        avatar_url,
        bio
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Change password endpoint
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Note: Supabase password change requires admin API
    // This is a simplified version - in production you'd want to use Supabase Auth properly
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) throw error;

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server (solo para desarrollo local)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✅ Text2Quiz API Server running on http://localhost:${PORT}`);
    console.log(`✅ OpenAI API Key configured: ${!!process.env.VITE_OPENAI_API_KEY}`);
    console.log(`✅ Supabase configured: ${!!process.env.VITE_SUPABASE_URL}`);
  });
}

// Exportar app para Vercel serverless
export default app;
