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

    // Generate formatted study material
    const formattedContent = await generateFormattedContent(document.extracted_text);

    // Save quiz to database
    const { data: savedQuiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        document_id: documentId,
        user_id: document.user_id,
        title: name || generatedQuiz.title, // Usar nombre personalizado si está disponible
        difficulty: generatedQuiz.difficulty,
        total_questions: generatedQuiz.questions.length,
        summary: generatedQuiz.summary || 'Repasa los conceptos clave antes de comenzar el quiz.',
        combined_content: document.extracted_text, // Store original text for regeneration
        formatted_content: formattedContent // Store formatted text for display
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

    // Crear global challenge automáticamente
    const globalChallenge = await ensureGlobalChallenge(savedQuiz.id, document.user_id, savedQuiz.title);

    // Generar podcast en background (no esperar)
    generatePodcastInBackground(savedQuiz.id, savedQuiz.title, formattedContent).catch(err => {
      console.error(`Error generating podcast for quiz ${savedQuiz.id}:`, err);
    });

    res.json({
      success: true,
      quiz: {
        ...savedQuiz,
        global_challenge_id: globalChallenge?.id || savedQuiz.global_challenge_id
      }
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

    // Generate formatted study material
    const formattedContent = await generateFormattedContent(combinedText);

    // Save quiz to database (without document_id, using new model)
    const { data: savedQuiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        user_id: userId,
        title: title, // Use user-provided title
        difficulty: generatedQuiz.difficulty,
        total_questions: generatedQuiz.questions.length,
        summary: generatedQuiz.summary || 'Repasa los conceptos clave antes de comenzar el quiz.',
        combined_content: combinedText, // Store combined content for regeneration
        formatted_content: formattedContent // Store formatted text for display
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

    // Crear global challenge automáticamente
    const globalChallenge = await ensureGlobalChallenge(savedQuiz.id, userId, savedQuiz.title);

    res.json({
      success: true,
      quiz: {
        ...savedQuiz,
        global_challenge_id: globalChallenge?.id || savedQuiz.global_challenge_id
      },
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

// Generate podcast in background (fire-and-forget)
async function generatePodcastInBackground(quizId, quizTitle, studyMaterial) {
  try {
    console.log(`🎙️ Starting audio generation for quiz ${quizId}...`);

    // Check if podcast already exists
    const { data: existingFile } = await supabase.storage
      .from('audio-summaries')
      .list('', {
        search: `quiz_${quizId}.mp3`
      });

    if (existingFile && existingFile.length > 0) {
      console.log(`✅ Audio already exists for quiz ${quizId}, skipping generation`);
      return;
    }

    const CONVERSATIONAL_THRESHOLD = 15000; // ~20-30 pages
    const isLongContent = studyMaterial && studyMaterial.length > CONVERSATIONAL_THRESHOLD;

    if (isLongContent) {
      // For long content: simple reading with single voice
      console.log(`📄 Content is long (${studyMaterial.length} chars), generating simple reading...`);

      // Truncate to reasonable length for audio (OpenAI TTS has 4096 char limit per request)
      const MAX_AUDIO_LENGTH = 20000; // ~25-30 pages maximum
      const textToRead = studyMaterial.substring(0, MAX_AUDIO_LENGTH);

      // Split into chunks of 4000 characters to respect OpenAI limits
      const chunkSize = 4000;
      const chunks = [];
      for (let i = 0; i < textToRead.length; i += chunkSize) {
        chunks.push(textToRead.substring(i, i + chunkSize));
      }

      console.log(`📝 Generating audio for ${chunks.length} chunks...`);
      const audioBuffers = [];

      for (let i = 0; i < chunks.length; i++) {
        console.log(`   ${i + 1}/${chunks.length} - Reading chunk ${i + 1}...`);

        const audioResponse = await openai.audio.speech.create({
          model: 'tts-1',
          voice: 'nova', // Use Nova for simple reading
          input: chunks[i],
          response_format: 'mp3'
        });

        const arrayBuffer = await audioResponse.arrayBuffer();
        audioBuffers.push(Buffer.from(arrayBuffer));
      }

      console.log(`✅ All audio generated, combining ${audioBuffers.length} chunks...`);
      const combinedBuffer = Buffer.concat(audioBuffers);

      // Upload to Supabase
      const filePath = `quiz_${quizId}.mp3`;
      console.log(`☁️  Uploading to Supabase Storage: ${filePath}`);

      const { error: uploadError } = await supabase.storage
        .from('audio-summaries')
        .upload(filePath, combinedBuffer, {
          contentType: 'audio/mpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      console.log(`✅ Simple reading generated successfully for quiz ${quizId}!`);
      console.log(`📦 File size: ${(combinedBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    } else {
      // For short content: conversational podcast
      console.log(`🎙️ Content is short (${studyMaterial.length} chars), generating conversational podcast...`);

      // 1. Generate conversational script with GPT-4o-mini
      console.log(`📝 Generating conversational script...`);
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un experto creando podcasts educativos conversacionales en español.

Crea un diálogo natural entre dos presentadores:
- Ana (entusiasta y didáctica, hace preguntas y busca claridad)
- Carlos (analítico y curioso, explica conceptos y profundiza)

El diálogo debe:
1. Ser natural y entretenido, como una conversación real
2. Cubrir los conceptos clave del material
3. Durar aproximadamente 3-5 minutos (800-1200 palabras)
4. Incluir ejemplos y analogías cuando sea apropiado
5. Terminar con un resumen de puntos clave

IMPORTANTE: Responde SOLO con JSON válido en este formato exacto:
{
  "dialogue": [
    {"speaker": "Ana", "text": "Hola Carlos, hoy vamos a hablar sobre..."},
    {"speaker": "Carlos", "text": "Así es Ana. Este tema es fascinante porque..."},
    ...
  ]
}`
          },
          {
            role: 'user',
            content: `Crea un podcast educativo conversacional sobre el siguiente material de estudio:\n\n${studyMaterial.substring(0, 4000)}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');
      const script = response.dialogue || response.podcast;

      if (!script || script.length === 0) {
        throw new Error('No dialogue generated');
      }

      console.log(`✅ Script generated: ${script.length} dialogue turns`);

      // 2. Generate audio for each turn with OpenAI TTS
      console.log(`🎤 Generating audio for ${script.length} dialogue turns...`);
      const audioBuffers = [];

      for (let i = 0; i < script.length; i++) {
        const turn = script[i];
        const voice = turn.speaker === 'Ana' ? 'nova' : 'onyx';

        console.log(`   ${i + 1}/${script.length} - ${turn.speaker}: ${turn.text.substring(0, 50)}...`);

        const audioResponse = await openai.audio.speech.create({
          model: 'tts-1',
          voice: voice,
          input: turn.text,
          response_format: 'mp3'
        });

        const arrayBuffer = await audioResponse.arrayBuffer();
        audioBuffers.push(Buffer.from(arrayBuffer));
      }

      console.log(`✅ All audio generated, combining ${audioBuffers.length} segments...`);

      // 3. Combine all audio buffers into single MP3
      const combinedBuffer = Buffer.concat(audioBuffers);

      // 4. Upload to Supabase Storage
      const filePath = `quiz_${quizId}.mp3`;
      console.log(`☁️  Uploading to Supabase Storage: ${filePath}`);

      const { error: uploadError } = await supabase.storage
        .from('audio-summaries')
        .upload(filePath, combinedBuffer, {
          contentType: 'audio/mpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      console.log(`✅ Conversational podcast generated successfully for quiz ${quizId}!`);
      console.log(`📦 File size: ${(combinedBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    }

  } catch (error) {
    console.error(`❌ Error generating podcast for quiz ${quizId}:`, error);
    // Don't throw - this is a background task, failures shouldn't break quiz creation
  }
}

// Generate formatted, readable content from extracted text for study material
async function generateFormattedContent(rawText) {
  try {
    console.log('Generating formatted study material...');

    const prompt = `
Eres un experto en crear materiales de estudio bien formateados. Toma el siguiente texto extraído de un PDF (que puede contener errores de formato, caracteres extraños, etc.) y conviértelo en contenido de estudio limpio, bien organizado y fácil de leer.

TEXTO ORIGINAL:
${rawText.substring(0, 8000)} ${rawText.length > 8000 ? '...' : ''}

INSTRUCCIONES:
1. Limpia el texto eliminando caracteres extraños, símbolos raros y errores de formato
2. Organiza la información en secciones claras con encabezados descriptivos
3. Usa listas con viñetas (•) cuando sea apropiado para mejor legibilidad
4. Mantén toda la información importante del contenido original
5. Corrige errores ortográficos y gramaticales evidentes
6. Formato el texto de manera profesional y académica
7. NO agregues información que no esté en el texto original
8. NO uses formato markdown (**, ##, etc) - solo texto plano con estructura clara

IMPORTANTE: Responde SOLO con el texto formateado, sin introducción ni comentarios adicionales.`.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en formatear y limpiar contenido educativo. Tu tarea es tomar texto mal formateado y convertirlo en material de estudio claro y bien organizado.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent formatting
      max_tokens: 3000
    });

    const formattedContent = completion.choices[0].message.content;

    if (!formattedContent || formattedContent.trim().length === 0) {
      console.log('Warning: No formatted content generated, using original text');
      return rawText.substring(0, 3000); // Fallback to truncated original
    }

    console.log(`Formatted content generated: ${formattedContent.length} characters`);
    return formattedContent;

  } catch (error) {
    console.error('Error generating formatted content:', error);
    // Return truncated original text as fallback
    return rawText.substring(0, 3000) + '\n\n[Contenido truncado]';
  }
}

// Regenerate quiz questions
app.post('/api/quizzes/:quizId/regenerate', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log(`Regenerating questions for quiz ${quizId}...`);

    // Get quiz and verify ownership
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Allow regeneration if:
    // 1. User is the owner, OR
    // 2. Quiz has a global_challenge_id (it's a public quiz with challenges), OR
    // 3. There's any challenge for this quiz
    const isOwner = quiz.user_id === userId;
    const hasGlobalChallenge = !!quiz.global_challenge_id;

    if (!isOwner && !hasGlobalChallenge) {
      // As a fallback, check if there's ANY challenge for this quiz
      const { data: anyChallenge } = await supabase
        .from('quiz_challenges')
        .select('id')
        .eq('quiz_id', quizId)
        .maybeSingle();

      if (!anyChallenge) {
        return res.status(403).json({ error: 'Not authorized to regenerate this quiz' });
      }

      console.log(`Allowing regeneration for challenge participant (challenge ${anyChallenge.id})`);
    } else if (hasGlobalChallenge) {
      console.log(`Allowing regeneration for global challenge (${quiz.global_challenge_id})`);
    }

    // Get content to regenerate from
    let content = quiz.combined_content;

    // If no combined_content, get from document
    if (!content && quiz.document_id) {
      const { data: document } = await supabase
        .from('documents')
        .select('extracted_text')
        .eq('id', quiz.document_id)
        .single();

      content = document?.extracted_text;
    }

    if (!content) {
      return res.status(400).json({ error: 'No content available to regenerate questions' });
    }

    console.log(`Found content: ${content.length} characters`);

    // Delete existing questions
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('quiz_id', quizId);

    if (deleteError) throw deleteError;
    console.log('Existing questions deleted');

    // Generate new questions with OpenAI
    const prompt = buildQuizPrompt(content, quiz.total_questions, quiz.difficulty);

    console.log('Calling OpenAI API for new questions...');

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

    const openaiContent = completion.choices[0].message.content;
    if (!openaiContent) {
      throw new Error('No response from OpenAI');
    }

    const generatedQuiz = JSON.parse(openaiContent);
    console.log(`Generated ${generatedQuiz.questions.length} new questions`);

    // Insert new questions
    const questionsToInsert = generatedQuiz.questions.map((q, index) => ({
      quiz_id: quizId,
      question_text: q.question_text,
      question_type: q.question_type,
      correct_answer: q.correct_answer,
      options: q.options,
      explanation: q.explanation,
      order: index + 1
    }));

    const { data: newQuestions, error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select();

    if (questionsError) throw questionsError;

    console.log('New questions saved successfully');

    res.json({
      success: true,
      quiz,
      questions: newQuestions,
      message: 'Questions regenerated successfully'
    });
  } catch (error) {
    console.error('Error regenerating quiz questions:', error);
    res.status(500).json({ error: error.message });
  }
});

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

// Función helper para asegurar que un quiz tenga un global challenge
async function ensureGlobalChallenge(quizId, userId, quizTitle) {
  try {
    // Verificar si el quiz ya tiene global_challenge_id
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('global_challenge_id, user_id')
      .eq('id', quizId)
      .single();

    if (quizError) throw quizError;

    // Si ya tiene global challenge, retornarlo
    if (quiz.global_challenge_id) {
      const { data: existingChallenge } = await supabase
        .from('quiz_challenges')
        .select('id, share_code, share_slug')
        .eq('id', quiz.global_challenge_id)
        .single();

      if (existingChallenge) {
        console.log(`Quiz ${quizId} already has global challenge ${existingChallenge.id}`);
        return existingChallenge;
      }
    }

    // Crear nuevo global challenge
    const shareCode = generateShareCode();
    const shareSlug = generateShareSlug(quizTitle);

    // For system quizzes without user_id, use special system user ID
    const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

    const { data: newChallenge, error: createError } = await supabase
      .from('quiz_challenges')
      .insert({
        quiz_id: quizId,
        creator_id: quiz.user_id || userId || SYSTEM_USER_ID,
        share_code: shareCode,
        share_slug: shareSlug,
        show_creator_score: false,
        has_leaderboard: true,
        is_anonymous: false
      })
      .select()
      .single();

    if (createError) throw createError;

    // Actualizar quiz con global_challenge_id
    await supabase
      .from('quizzes')
      .update({ global_challenge_id: newChallenge.id })
      .eq('id', quizId);

    console.log(`Created global challenge ${newChallenge.id} for quiz ${quizId}`);
    return newChallenge;
  } catch (error) {
    console.error(`Error ensuring global challenge for quiz ${quizId}:`, error);
    // No lanzar error, solo log - el quiz se puede usar sin challenge
    return null;
  }
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
              user_attempts: 1,
              user_rank: null,  // Se calculará después
              total_attempts: 0  // Se calculará después
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

      // Calcular rankings y total de intentos para cada challenge participado
      for (const [challengeId, challengeData] of uniqueChallenges) {
        console.log(`\n🔍 Calculating rank for challenge ${challengeId}...`);

        // Obtener todos los intentos del challenge
        const { data: allAttempts } = await supabase
          .from('challenge_attempts')
          .select('score, total_questions, user_id')
          .eq('challenge_id', challengeId)
          .order('score', { ascending: false })
          .order('time_taken', { ascending: true });

        console.log(`📊 Found ${allAttempts?.length || 0} total attempts for challenge ${challengeId}`);

        if (allAttempts) {
          challengeData.total_attempts = allAttempts.length;

          // Calcular ranking del usuario
          const sortedAttempts = [...allAttempts].sort((a, b) => {
            const percentA = (a.score / a.total_questions) * 100;
            const percentB = (b.score / b.total_questions) * 100;
            if (percentB !== percentA) {
              return percentB - percentA;
            }
            // Si empatan en porcentaje, usar time_taken (aunque no lo tenemos aquí, el order inicial lo hace)
            return 0;
          });

          console.log(`📋 Sorted attempts:`, sortedAttempts.map((a, i) => `${i+1}. ${a.user_id === userId ? 'YOU' : 'user'}: ${Math.round((a.score / a.total_questions) * 100)}%`));

          const rankIndex = sortedAttempts.findIndex(a => a.user_id === userId);
          if (rankIndex !== -1) {
            challengeData.user_rank = rankIndex + 1;
            console.log(`✅ User rank: ${challengeData.user_rank} out of ${allAttempts.length}`);
          } else {
            console.log(`❌ User not found in attempts!`);
          }

          console.log(`📝 Challenge data:`, {
            id: challengeData.id,
            quiz_title: challengeData.quiz_title,
            user_rank: challengeData.user_rank,
            total_attempts: challengeData.total_attempts,
            user_score: challengeData.user_score
          });
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

    // Check if identifier looks like a UUID (to avoid type errors)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    // Build OR condition based on identifier format
    let orCondition;
    if (isUUID) {
      // If it's a UUID, check all three columns
      orCondition = `id.eq.${identifier},share_code.eq.${identifier},share_slug.eq.${identifier}`;
    } else {
      // If it's not a UUID, only check share_code and share_slug
      orCondition = `share_code.eq.${identifier},share_slug.eq.${identifier}`;
    }

    // Buscar por ID, código o slug
    const { data: challenge, error: challengeError} = await supabase
      .from('quiz_challenges')
      .select(`
        *,
        quizzes!quiz_challenges_quiz_id_fkey (
          id,
          title,
          difficulty,
          total_questions,
          summary,
          document_id,
          formatted_content,
          combined_content
        )
      `)
      .or(orCondition)
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

// Helper function to get current leaderboard top player
async function getTopPlayer(challengeId) {
  const { data: attempts } = await supabase
    .from('challenge_attempts')
    .select('user_id, username, score, total_questions, time_taken')
    .eq('challenge_id', challengeId)
    .order('score', { ascending: false })
    .order('time_taken', { ascending: true })
    .limit(1)
    .maybeSingle();

  return attempts;
}

// Helper function to create rank change notification
async function createRankChangeNotification(userId, challengeId, newLeader, previousRank = 1) {
  try {
    // Get challenge and quiz info
    const { data: challenge } = await supabase
      .from('quiz_challenges')
      .select('quiz_id, quizzes!quiz_challenges_quiz_id_fkey(title)')
      .eq('id', challengeId)
      .single();

    if (!challenge || !userId) return;

    const quizTitle = challenge.quizzes?.title || 'un desafío';
    const newLeaderScore = Math.round((newLeader.score / newLeader.total_questions) * 100);

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        type: 'first_place_lost',
        title: '¡Te han superado!',
        message: `${newLeader.username} te ha superado en "${quizTitle}" con un ${newLeaderScore}%`,
        data: {
          previous_rank: previousRank,
          new_rank: 2,
          new_leader_username: newLeader.username,
          new_leader_score: newLeader.score,
          new_leader_percentage: newLeaderScore,
          quiz_title: quizTitle,
          challenge_slug: challenge.share_slug
        }
      });

    console.log(`📬 Notification created: User ${userId} lost first place in challenge ${challengeId}`);
  } catch (error) {
    console.error('Error creating rank change notification:', error);
    // Don't throw - notification failure shouldn't break the main flow
  }
}

// Guardar un intento en el challenge
app.post('/api/challenges/:challengeId/attempt', async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { userId, username, score, totalQuestions, timeTaken } = req.body;

    if (!username || score === undefined || !totalQuestions || !timeTaken) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 🔔 Get current leader BEFORE saving the new attempt
    const previousLeader = await getTopPlayer(challengeId);

    let attempt;

    // Si hay userId, verificar si ya existe un intento previo
    if (userId) {
      const { data: existingAttempt } = await supabase
        .from('challenge_attempts')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingAttempt) {
        // Si la nueva puntuación es MAYOR, actualizar el intento
        if (score > existingAttempt.score) {
          const { data: updatedAttempt, error: updateError } = await supabase
            .from('challenge_attempts')
            .update({
              score,
              time_taken: timeTaken,
              completed_at: new Date().toISOString()
            })
            .eq('id', existingAttempt.id)
            .select()
            .single();

          if (updateError) throw updateError;
          attempt = updatedAttempt;
          console.log(`Challenge attempt updated (better score): ${username} - ${score}/${totalQuestions} (previous: ${existingAttempt.score})`);
        } else {
          // Si la puntuación no es mejor, no hacer nada y retornar el intento existente
          attempt = existingAttempt;
          console.log(`Challenge attempt not updated (score not improved): ${username} - ${score}/${totalQuestions} (best: ${existingAttempt.score})`);
        }
      } else {
        // No existe intento previo, crear uno nuevo
        const { data: newAttempt, error: attemptError } = await supabase
          .from('challenge_attempts')
          .insert({
            challenge_id: challengeId,
            user_id: userId,
            username,
            score,
            total_questions: totalQuestions,
            time_taken: timeTaken
          })
          .select()
          .single();

        if (attemptError) throw attemptError;
        attempt = newAttempt;
        console.log(`Challenge attempt created: ${username} - ${score}/${totalQuestions}`);
      }

      // Actualizar racha del usuario
      await supabase.rpc('update_user_streak', { p_user_id: userId });
    } else {
      // Usuario anónimo - siempre crear nuevo intento
      const { data: newAttempt, error: attemptError } = await supabase
        .from('challenge_attempts')
        .insert({
          challenge_id: challengeId,
          user_id: null,
          username,
          score,
          total_questions: totalQuestions,
          time_taken: timeTaken
        })
        .select()
        .single();

      if (attemptError) throw attemptError;
      attempt = newAttempt;
      console.log(`Anonymous challenge attempt saved: ${username} - ${score}/${totalQuestions}`);
    }

    // 🔔 Check if leader changed and create notification
    if (previousLeader && previousLeader.user_id) {
      // Get new leader AFTER saving the attempt
      const newLeader = await getTopPlayer(challengeId);

      // Check if leader changed
      if (newLeader && newLeader.user_id !== previousLeader.user_id) {
        // Someone took first place! Notify the previous leader
        await createRankChangeNotification(
          previousLeader.user_id,
          challengeId,
          newLeader,
          1 // previous rank was 1st place
        );
      }
    }

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

// Get user streak
app.get('/api/users/:userId/streak', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('current_streak, longest_streak, last_activity_date')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      streak: {
        current_streak: profile?.current_streak || 0,
        longest_streak: profile?.longest_streak || 0,
        last_activity_date: profile?.last_activity_date
      }
    });
  } catch (error) {
    console.error('Error getting user streak:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user streak (for daily challenges and practice modes)
app.post('/api/users/:userId/update-streak', async (req, res) => {
  try {
    const { userId } = req.params;
    const { score, totalQuestions } = req.body;

    // Calculate percentage if score and totalQuestions are provided
    let percentage = 100;
    if (score !== undefined && totalQuestions !== undefined) {
      percentage = Math.round((score / totalQuestions) * 100);
    }

    // Only update streak if score is >= 70% or if no score provided
    if (percentage >= 70) {
      // Call the stored procedure to update streak
      const { error } = await supabase.rpc('update_user_streak', {
        p_user_id: userId
      });

      if (error) throw error;
      console.log(`Streak updated for user ${userId}: passed with ${percentage}%`);
    } else {
      // Score < 70%, reset streak to 0
      const { error } = await supabase
        .from('user_profiles')
        .update({
          current_streak: 0,
          last_activity_date: new Date().toISOString().split('T')[0]
        })
        .eq('user_id', userId);

      if (error) throw error;
      console.log(`Streak reset for user ${userId}: failed with ${percentage}%`);
    }

    // Get updated streak
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('current_streak, longest_streak, last_activity_date')
      .eq('user_id', userId)
      .single();

    res.json({
      success: true,
      streak: {
        current_streak: profile?.current_streak || 0,
        longest_streak: profile?.longest_streak || 0,
        last_activity_date: profile?.last_activity_date
      }
    });
  } catch (error) {
    console.error('Error updating user streak:', error);
    res.status(500).json({ error: error.message });
  }
});

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

// ============================================
// NOTIFICATIONS ENDPOINTS
// ============================================

// Get user notifications
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { unread_only } = req.query;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (unread_only === 'true') {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      notifications: notifications || [],
      unread_count: notifications?.filter(n => !n.read).length || 0
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
app.put('/api/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Update notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read
app.put('/api/notifications/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete notification
app.delete('/api/notifications/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SUGGESTIONS ENDPOINTS
// ============================================

// Submit a suggestion
app.post('/api/suggestions', async (req, res) => {
  try {
    const { userId, email, category, title, description } = req.body;

    if (!category || !title || !description) {
      return res.status(400).json({ error: 'category, title, and description are required' });
    }

    const validCategories = ['feature', 'bug', 'improvement', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const { data: suggestion, error } = await supabase
      .from('suggestions')
      .insert({
        user_id: userId || null,
        email: email || null,
        category,
        title,
        description,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`📝 New suggestion submitted: "${title}" by ${userId || email || 'anonymous'}`);

    res.json({
      success: true,
      suggestion,
      message: 'Sugerencia enviada correctamente. ¡Gracias por tu feedback!'
    });
  } catch (error) {
    console.error('Error submitting suggestion:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all suggestions (admin only - requires service role)
app.get('/api/suggestions', async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('suggestions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: suggestions, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      suggestions: suggestions || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update suggestion status (admin only)
app.put('/api/suggestions/:suggestionId', async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const { status, admin_notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const validStatuses = ['pending', 'reviewed', 'in_progress', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = { status };
    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes;
    }

    const { data: suggestion, error } = await supabase
      .from('suggestions')
      .update(updateData)
      .eq('id', suggestionId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      suggestion,
      message: 'Suggestion updated successfully'
    });
  } catch (error) {
    console.error('Error updating suggestion:', error);
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
