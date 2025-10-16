import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase credentials not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Configuration
const config = {
  pdfPath: process.argv[2] || path.join(__dirname, '..', 'tcae-navarra-2025-examen-12-abril.pdf'),
  userId: process.argv[3] || null, // User ID to associate the quiz with (null for system quizzes)
  quizTitle: process.argv[4] || 'OPE Navarra TCAE - Examen 12 Abril 2025',
  category: process.argv[5] || 'Oposiciones',
  tags: process.argv[6]?.split(',') || ['OPE Navarra', 'TCAE', '2025', 'Examen Oficial'],
  source: process.argv[7] || 'OPE Navarra - Examen Oficial TCAE 2025',
  visibility: 'public',
  questionType: 'multiple_choice',
  isVerified: process.argv[8] === 'true' || true // Mark as verified/official
};

console.log('📚 Import Exam Script');
console.log('=====================');
console.log('PDF:', config.pdfPath);
console.log('Title:', config.quizTitle);
console.log('Category:', config.category);
console.log('Tags:', config.tags.join(', '));
console.log('');

// Extract text from PDF
async function extractTextFromPDF(pdfPath) {
  try {
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    let fullText = '';

    console.log(`📄 Processing ${pdf.numPages} pages...`);

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw error;
  }
}

// Parse questions from text
function parseQuestions(text) {
  const questions = [];

  // Pattern to match questions: number followed by dot or parenthesis
  // Matches: "1.", "1)", "1.-", etc.
  const questionPattern = /(\d+)[.)]\s*[-]?\s*([^\n]+?)(?=(?:\n[a-d][).]|\n\s*[a-d][).]))/gi;

  // Pattern to match options: a), b), c), d) or a., b., c., d.
  const optionPattern = /([a-d])[).]\s*([^\n]+?)(?=\n|$)/gi;

  // Split text into chunks by question numbers
  const chunks = text.split(/(?=\d+[.)]\s*[-]?)/);

  for (const chunk of chunks) {
    if (!chunk.trim()) continue;

    // Extract question number and text
    const questionMatch = chunk.match(/^(\d+)[.)]\s*[-]?\s*(.+?)(?=\n[a-d][).])/is);
    if (!questionMatch) continue;

    const questionNum = parseInt(questionMatch[1]);
    const questionText = questionMatch[2].trim();

    // Extract options
    const optionsText = chunk.substring(questionMatch[0].length);
    const optionMatches = [...optionsText.matchAll(/([a-d])[).]\s*([^\n]+?)(?=\n[a-d][).]|\n\n|\n*$)/gis)];

    if (optionMatches.length < 2) continue; // Skip if less than 2 options found

    const options = optionMatches.slice(0, 4).map(match => match[2].trim());

    // Try to find the correct answer
    // Look for patterns like "Respuesta correcta: a", "Correcta: a", "La respuesta es a", etc.
    const correctAnswerPattern = /(?:respuesta\s+correcta|correcta|respuesta|answer)[\s:]+([a-d])/i;
    const correctMatch = chunk.match(correctAnswerPattern);

    // Also check for highlighted/marked answers in the text
    let correctIndex = 0; // Default to first option if not found

    if (correctMatch) {
      const correctLetter = correctMatch[1].toLowerCase();
      correctIndex = correctLetter.charCodeAt(0) - 'a'.charCodeAt(0);
    } else {
      // Try to detect marked answer (sometimes marked with ✓, *, or bold)
      for (let i = 0; i < options.length; i++) {
        if (options[i].includes('✓') || options[i].includes('*') ||
            optionsText.match(new RegExp(`[a-d][).][\\s*]+${options[i]}[\\s*]+(?:correcta|✓)`, 'i'))) {
          correctIndex = i;
          break;
        }
      }
    }

    // Only add if we have at least 2 options
    if (options.length >= 2 && questionText.length > 5) {
      questions.push({
        number: questionNum,
        text: questionText,
        options: options,
        correctIndex: correctIndex
      });
    }
  }

  return questions;
}

// Enhanced parser for OPE Navarra format specifically
function parseOPENavarraQuestions(text) {
  const questions = [];

  // Split text into question chunks
  // Pattern: number followed by dot, then text until next question or "Respuesta correcta"
  const questionRegex = /(\d+)\.\s+(.+?)(?=\d+\.\s+|$)/gs;
  const matches = [...text.matchAll(questionRegex)];

  for (const match of matches) {
    const questionNum = parseInt(match[1]);
    const questionBlock = match[2];

    // Extract question text (everything before first option a))
    const questionTextMatch = questionBlock.match(/^(.+?)(?=\s+a\))/s);
    if (!questionTextMatch) continue;

    const questionText = questionTextMatch[1].trim()
      .replace(/\s+/g, ' ')  // Normalize spaces
      .replace(/^\s*:\s*/, ''); // Remove leading colons

    // Extract all options (a), b), c), d))
    const optionRegex = /([a-d])\)\s+(.+?)(?=\s+[a-d]\)|Respuesta\s+correcta|Respuesta:|$)/gis;
    const optionMatches = [...questionBlock.matchAll(optionRegex)];

    if (optionMatches.length < 2) continue; // Need at least 2 options

    const options = optionMatches.map(om =>
      om[2].trim()
        .replace(/\s+/g, ' ')  // Normalize spaces
        .replace(/\s+$/, '')    // Remove trailing spaces
    );

    // Find correct answer
    // Pattern: "Respuesta correcta: a)" or "Respuesta correcta a )" or "Respuesta: a)"
    // Note: There might be spaces before the closing parenthesis
    const correctAnswerMatch = questionBlock.match(/Respuesta\s+correcta\s*:?\s*([a-d])\s*\)/i);
    let correctIndex = 0;

    if (correctAnswerMatch) {
      const correctLetter = correctAnswerMatch[1].toLowerCase();
      correctIndex = correctLetter.charCodeAt(0) - 'a'.charCodeAt(0);
    } else {
      // Try alternative pattern without "correcta"
      const altMatch = questionBlock.match(/Respuesta\s*:?\s*([a-d])\s*\)/i);
      if (altMatch) {
        const correctLetter = altMatch[1].toLowerCase();
        correctIndex = correctLetter.charCodeAt(0) - 'a'.charCodeAt(0);
      }
    }

    // Only add questions with valid data
    if (options.length >= 2 && questionText.length > 10) {
      questions.push({
        number: questionNum,
        text: questionText,
        options: options.slice(0, 4), // Max 4 options
        correctIndex: Math.min(correctIndex, options.length - 1)
      });
    }
  }

  return questions;
}

// Generate slug from text
function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Get or create category
async function getOrCreateCategory(categoryName) {
  // First, try to find existing category
  const { data: existing, error: findError} = await supabase
    .from('quiz_categories')
    .select('id')
    .eq('name', categoryName)
    .maybeSingle();

  if (existing) {
    return existing.id;
  }

  // Create new category with slug
  const slug = generateSlug(categoryName);
  const { data: newCategory, error: createError } = await supabase
    .from('quiz_categories')
    .insert([{
      name: categoryName,
      slug: slug,
      description: `Categoría para ${categoryName}`
    }])
    .select()
    .single();

  if (createError) {
    console.error('Error creating category:', createError);
    throw createError;
  }

  return newCategory.id;
}

// Main import function
async function importExam() {
  try {
    // Check if PDF exists
    if (!fs.existsSync(config.pdfPath)) {
      console.error(`❌ Error: PDF file not found at ${config.pdfPath}`);
      process.exit(1);
    }

    // User ID is optional - if not provided, creates a system quiz
    if (!config.userId) {
      console.log('ℹ️  No user ID provided - creating as system/official quiz');
    }

    console.log('🔍 Extracting text from PDF...');
    const pdfText = await extractTextFromPDF(config.pdfPath);

    console.log('📝 Parsing questions...');
    let questions = parseOPENavarraQuestions(pdfText);

    // If OPE parser didn't find many questions, try generic parser
    if (questions.length < 10) {
      console.log('⚠️  OPE parser found few questions, trying generic parser...');
      questions = parseQuestions(pdfText);
    }

    console.log(`✅ Found ${questions.length} questions`);

    if (questions.length === 0) {
      console.error('❌ No questions found in PDF. Check the PDF format.');
      process.exit(1);
    }

    // Show first 3 questions as preview
    console.log('\n📋 Preview of first 3 questions:');
    console.log('='.repeat(80));
    questions.slice(0, 3).forEach((q, idx) => {
      console.log(`\n${idx + 1}. ${q.text}`);
      q.options.forEach((opt, i) => {
        const marker = i === q.correctIndex ? '✓' : ' ';
        console.log(`   ${marker} ${String.fromCharCode(97 + i)}) ${opt}`);
      });
    });
    console.log('='.repeat(80));

    // Ask for confirmation
    console.log(`\n📊 Ready to import ${questions.length} questions`);
    console.log('Title:', config.quizTitle);
    console.log('Visibility:', config.visibility);

    // Get or create category
    console.log('\n🏷️  Setting up category...');
    const categoryId = await getOrCreateCategory(config.category);
    console.log(`✅ Category ID: ${categoryId}`);

    // Create quiz
    console.log('\n📝 Creating quiz...');
    const quizData = {
      title: config.quizTitle,
      visibility: config.visibility,
      category_id: categoryId,
      tags: config.tags,
      source: config.source,
      is_verified: config.isVerified,
      total_questions: questions.length
    };

    // Only add user_id if provided
    if (config.userId) {
      quizData.user_id = config.userId;
    }

    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert([quizData])
      .select()
      .single();

    if (quizError) {
      console.error('❌ Error creating quiz:', quizError);
      throw quizError;
    }

    console.log(`✅ Quiz created with ID: ${quiz.id}`);

    // Insert questions in batches
    console.log('\n📥 Inserting questions...');
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      const questionsToInsert = batch.map((q, idx) => ({
        quiz_id: quiz.id,
        question_text: q.text,
        question_type: 'multiple_choice',
        options: q.options,
        correct_answer: q.correctIndex,
        order: i + idx
      }));

      const { error: insertError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (insertError) {
        console.error('❌ Error inserting questions batch:', insertError);
        throw insertError;
      }

      inserted += batch.length;
      console.log(`   Inserted ${inserted}/${questions.length} questions...`);
    }

    console.log('\n✅ Import completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Quiz ID: ${quiz.id}`);
    console.log(`   Title: ${quiz.title}`);
    console.log(`   Questions: ${questions.length}`);
    console.log(`   Visibility: ${quiz.visibility}`);
    console.log(`   Category: ${config.category}`);
    console.log(`   Tags: ${config.tags.join(', ')}`);
    console.log(`\n🔗 View quiz at: /quiz/${quiz.id}`);

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importExam();
