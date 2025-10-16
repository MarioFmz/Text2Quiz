-- Eliminar la constraint que impide múltiples intentos del mismo usuario en un challenge
-- Esto permite que los usuarios puedan reintentar los desafíos múltiples veces

ALTER TABLE challenge_attempts
DROP CONSTRAINT IF EXISTS unique_user_challenge;

-- Verificar que la constraint fue eliminada
SELECT
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'challenge_attempts'::regclass
AND conname = 'unique_user_challenge';
