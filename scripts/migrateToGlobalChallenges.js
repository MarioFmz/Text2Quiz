import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔄 Global Challenge Migration Script');
console.log('=====================================\n');

// Generate share code (same as server)
function generateShareCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Generate share slug (same as server)
function generateShareSlug(title) {
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const random = Math.random().toString(36).substring(2, 8);
  const fullSlug = `${slug}-${random}`;

  // Limit to 50 characters (database limit)
  return fullSlug.substring(0, 50);
}

// Ensure global challenge for a quiz
async function ensureGlobalChallenge(quizId, userId, quizTitle) {
  try {
    // Verify if quiz already has global_challenge_id
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('global_challenge_id, user_id')
      .eq('id', quizId)
      .single();

    if (quizError) throw quizError;

    // If it already has global challenge, return it
    if (quiz.global_challenge_id) {
      const { data: existingChallenge } = await supabase
        .from('quiz_challenges')
        .select('id, share_code, share_slug')
        .eq('id', quiz.global_challenge_id)
        .single();

      if (existingChallenge) {
        return { existing: true, challenge: existingChallenge };
      }
    }

    // Create new global challenge
    const shareCode = generateShareCode();
    const shareSlug = generateShareSlug(quizTitle);

    // For system quizzes without user_id, we need a special system user ID
    // Using a special UUID that represents "system" quizzes
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

    // Update quiz with global_challenge_id
    await supabase
      .from('quizzes')
      .update({ global_challenge_id: newChallenge.id })
      .eq('id', quizId);

    return { existing: false, challenge: newChallenge };
  } catch (error) {
    console.error(`   ❌ Error for quiz ${quizId}:`, error.message);
    return null;
  }
}

// Main migration function
async function migrateQuizzes() {
  try {
    console.log('📊 Fetching quizzes without global challenges...\n');

    // Get all quizzes that don't have a global_challenge_id
    const { data: quizzes, error: fetchError } = await supabase
      .from('quizzes')
      .select('id, title, user_id, visibility')
      .is('global_challenge_id', null)
      .order('generated_at', { ascending: false });

    if (fetchError) throw fetchError;

    if (!quizzes || quizzes.length === 0) {
      console.log('✅ All quizzes already have global challenges!');
      console.log('📊 Nothing to migrate.\n');
      return;
    }

    console.log(`📋 Found ${quizzes.length} quizzes to migrate:\n`);

    // Show summary by visibility
    const publicCount = quizzes.filter(q => q.visibility === 'public').length;
    const privateCount = quizzes.filter(q => q.visibility === 'private').length;
    console.log(`   • Public quizzes: ${publicCount}`);
    console.log(`   • Private quizzes: ${privateCount}`);
    console.log(`   • Total: ${quizzes.length}\n`);

    console.log('🚀 Starting migration...\n');

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Process each quiz
    for (let i = 0; i < quizzes.length; i++) {
      const quiz = quizzes[i];
      const progress = `[${i + 1}/${quizzes.length}]`;

      process.stdout.write(`${progress} ${quiz.title.substring(0, 50)}... `);

      const result = await ensureGlobalChallenge(quiz.id, quiz.user_id, quiz.title);

      if (result === null) {
        console.log('❌ ERROR');
        errorCount++;
      } else if (result.existing) {
        console.log('⏭️  SKIPPED (already has challenge)');
        skipCount++;
      } else {
        console.log(`✅ CREATED (${result.challenge.share_code})`);
        successCount++;
      }

      // Add small delay to avoid rate limits
      if (i < quizzes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created: ${successCount}`);
    console.log(`⏭️  Skipped (already exist): ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total processed: ${quizzes.length}`);
    console.log('='.repeat(60));

    if (errorCount > 0) {
      console.log('\n⚠️  Some quizzes failed to migrate. Check the errors above.');
    } else {
      console.log('\n🎉 Migration completed successfully!');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Check if --dry-run flag is passed
const dryRun = process.argv.includes('--dry-run');

if (dryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made\n');

  // Just count quizzes that need migration
  (async () => {
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('id, title, visibility', { count: 'exact' })
      .is('global_challenge_id', null);

    if (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }

    console.log(`📊 Found ${quizzes?.length || 0} quizzes that need global challenges\n`);

    if (quizzes && quizzes.length > 0) {
      const publicCount = quizzes.filter(q => q.visibility === 'public').length;
      const privateCount = quizzes.filter(q => q.visibility === 'private').length;
      console.log(`   • Public: ${publicCount}`);
      console.log(`   • Private: ${privateCount}\n`);

      console.log('💡 Run without --dry-run to perform the migration');
    }
  })();
} else {
  // Run the actual migration
  migrateQuizzes();
}
