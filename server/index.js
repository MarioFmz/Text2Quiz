const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai').default;
const { createClient } = require('@supabase/supabase-js');

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
    const { documentId, numQuestions = 10, difficulty = 'medium', name } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }

    console.log(`Generating quiz for document ${documentId}...`);
    if (name) {
      console.log(`Custom quiz name: ${name}`);
    }

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
    const prompt = buildQuizPrompt(document.extracted_text, numQuestions, difficulty);

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
    const { userId, title, documentIds, numQuestions = 10, difficulty = 'medium' } = req.body;

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
    const prompt = buildQuizPrompt(combinedText, numQuestions, difficulty);

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

function buildQuizPrompt(text, numQuestions, difficulty) {
  return `
Analiza el siguiente texto y genera un quiz educativo de alta calidad en español.

TEXTO:
${text.substring(0, 6000)} ${text.length > 6000 ? '...' : ''}

INSTRUCCIONES:
1. Genera un resumen conciso con los conceptos más importantes (3-5 puntos clave) para que el usuario repase antes del quiz
2. Genera exactamente ${numQuestions} preguntas de nivel ${difficulty}
3. Mezcla preguntas de múltiple opción (4 opciones) y verdadero/falso (2 opciones)
4. Las preguntas deben evaluar conceptos clave, no detalles triviales
5. Proporciona explicaciones claras para cada respuesta correcta
6. Para múltiple opción, las opciones incorrectas deben ser plausibles pero claramente incorrectas
7. Genera un título descriptivo para el quiz basado en el contenido

FORMATO DE RESPUESTA (JSON):
{
  "title": "Título del Quiz",
  "difficulty": "${difficulty}",
  "summary": "• Concepto clave 1: Breve explicación del concepto principal\\n• Concepto clave 2: Breve explicación del segundo concepto\\n• Concepto clave 3: Breve explicación del tercer concepto",
  "questions": [
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
    }
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
      hasLeaderboard = true
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
        has_leaderboard: hasLeaderboard
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
    const { data: challenges, error: challengesError } = await supabase
      .from('quiz_challenges')
      .select(`
        id,
        quiz_id,
        creator_id,
        share_code,
        share_slug,
        created_at,
        quizzes (
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
          quizzes (
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

// Obtener un challenge por código o slug
app.get('/api/challenges/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;

    // Buscar por código o slug
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
      .or(`share_code.eq.${identifier},share_slug.eq.${identifier}`)
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

    // Primero obtener el creator_id del challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('quiz_challenges')
      .select('creator_id')
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
      creator_id: challenge.creator_id
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

// Start server
app.listen(PORT, () => {
  console.log(`✅ Text2Quiz API Server running on http://localhost:${PORT}`);
  console.log(`✅ OpenAI API Key configured: ${!!process.env.VITE_OPENAI_API_KEY}`);
  console.log(`✅ Supabase configured: ${!!process.env.VITE_SUPABASE_URL}`);
});
