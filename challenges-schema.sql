-- ============================================
-- SISTEMA DE COMPARTIR QUIZZES Y COMPETIR
-- ============================================

-- Tabla para challenges compartidos
CREATE TABLE IF NOT EXISTS public.quiz_challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    share_code VARCHAR(12) UNIQUE NOT NULL, -- Ej: "MET-4821"
    share_slug VARCHAR(50) UNIQUE NOT NULL, -- Ej: "metabolismo-glucosa-abc123"
    is_public BOOLEAN DEFAULT true,
    show_creator_score BOOLEAN DEFAULT true,
    has_leaderboard BOOLEAN DEFAULT true,
    time_limit INTEGER, -- segundos (opcional)
    expires_at TIMESTAMP WITH TIME ZONE, -- (opcional)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    views_count INTEGER DEFAULT 0,
    participants_count INTEGER DEFAULT 0
);

-- Tabla de participantes/intentos en el challenge
CREATE TABLE IF NOT EXISTS public.challenge_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    challenge_id UUID REFERENCES public.quiz_challenges(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL si es anónimo
    username TEXT NOT NULL, -- Nombre para mostrar (puede ser anónimo)
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    percentage INTEGER GENERATED ALWAYS AS (ROUND((score::DECIMAL / total_questions) * 100)) STORED,
    time_taken INTEGER NOT NULL, -- segundos
    is_perfect BOOLEAN GENERATED ALWAYS AS (score = total_questions) STORED,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_challenge UNIQUE(challenge_id, user_id)
);

-- ============================================
-- QUICK PRACTICE & GAMIFICACIÓN
-- ============================================

-- Tabla para rachas de usuario (Daily Challenges)
CREATE TABLE IF NOT EXISTS public.user_streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed_date DATE,
    total_challenges_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para badges/logros
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    badge_type VARCHAR(50) NOT NULL, -- 'champion', 'perfectionist', 'speedster', 'streak_master'
    badge_level INTEGER DEFAULT 1, -- Nivel del badge (1-5)
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB, -- Info adicional (ej: challenge_id donde se ganó)
    UNIQUE(user_id, badge_type, badge_level)
);

-- Tabla para el desafío diario generado
CREATE TABLE IF NOT EXISTS public.daily_challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    challenge_date DATE NOT NULL UNIQUE,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    question_count INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_challenges_share_code ON public.quiz_challenges(share_code);
CREATE INDEX IF NOT EXISTS idx_challenges_share_slug ON public.quiz_challenges(share_slug);
CREATE INDEX IF NOT EXISTS idx_challenges_quiz_id ON public.quiz_challenges(quiz_id);
CREATE INDEX IF NOT EXISTS idx_challenges_creator_id ON public.quiz_challenges(creator_id);
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_challenge_id ON public.challenge_attempts(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_user_id ON public.challenge_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_score ON public.challenge_attempts(score DESC, time_taken ASC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON public.daily_challenges(challenge_date DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Quiz Challenges: Cualquiera puede ver los públicos
ALTER TABLE public.quiz_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public challenges are viewable by everyone"
    ON public.quiz_challenges FOR SELECT
    USING (is_public = true);

CREATE POLICY "Users can create challenges"
    ON public.quiz_challenges FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own challenges"
    ON public.quiz_challenges FOR UPDATE
    USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own challenges"
    ON public.quiz_challenges FOR DELETE
    USING (auth.uid() = creator_id);

-- Challenge Attempts: Los intentos son públicos si el challenge es público
ALTER TABLE public.challenge_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenge attempts are viewable if challenge is public"
    ON public.challenge_attempts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.quiz_challenges
            WHERE id = challenge_attempts.challenge_id
            AND is_public = true
        )
    );

CREATE POLICY "Users can create challenge attempts"
    ON public.challenge_attempts FOR INSERT
    WITH CHECK (true); -- Permitir anónimos también

CREATE POLICY "Users can view their own attempts"
    ON public.challenge_attempts FOR SELECT
    USING (auth.uid() = user_id);

-- User Streaks: Solo el usuario puede ver y modificar su racha
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own streaks"
    ON public.user_streaks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
    ON public.user_streaks FOR ALL
    USING (auth.uid() = user_id);

-- User Badges: Los badges son públicos
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are viewable by everyone"
    ON public.user_badges FOR SELECT
    USING (true);

CREATE POLICY "System can insert badges"
    ON public.user_badges FOR INSERT
    WITH CHECK (true);

-- Daily Challenges: Públicos para todos
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily challenges are viewable by everyone"
    ON public.daily_challenges FOR SELECT
    USING (true);

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función para generar código de compartir único
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Sin confusión: sin I,O,0,1
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar contador de participantes
CREATE OR REPLACE FUNCTION update_challenge_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.quiz_challenges
    SET participants_count = (
        SELECT COUNT(DISTINCT user_id)
        FROM public.challenge_attempts
        WHERE challenge_id = NEW.challenge_id
    )
    WHERE id = NEW.challenge_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar stats automáticamente
DROP TRIGGER IF EXISTS trigger_update_challenge_stats ON public.challenge_attempts;
CREATE TRIGGER trigger_update_challenge_stats
    AFTER INSERT ON public.challenge_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_challenge_stats();

-- Función para actualizar racha de usuario
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_last_date DATE;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Obtener o crear racha del usuario
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_completed_date)
    VALUES (p_user_id, 1, 1, v_today)
    ON CONFLICT (user_id) DO UPDATE
    SET
        current_streak = CASE
            WHEN user_streaks.last_completed_date = v_today THEN user_streaks.current_streak -- Ya completó hoy
            WHEN user_streaks.last_completed_date = v_today - INTERVAL '1 day' THEN user_streaks.current_streak + 1 -- Día consecutivo
            ELSE 1 -- Se rompió la racha
        END,
        longest_streak = GREATEST(
            user_streaks.longest_streak,
            CASE
                WHEN user_streaks.last_completed_date = v_today - INTERVAL '1 day' THEN user_streaks.current_streak + 1
                ELSE 1
            END
        ),
        last_completed_date = v_today,
        total_challenges_completed = user_streaks.total_challenges_completed + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE public.quiz_challenges IS 'Challenges compartidos para competir con otros usuarios';
COMMENT ON TABLE public.challenge_attempts IS 'Intentos de usuarios en los challenges compartidos';
COMMENT ON TABLE public.user_streaks IS 'Rachas de usuarios en Daily Challenges';
COMMENT ON TABLE public.user_badges IS 'Badges/logros ganados por usuarios';
COMMENT ON TABLE public.daily_challenges IS 'Desafío diario generado automáticamente';
