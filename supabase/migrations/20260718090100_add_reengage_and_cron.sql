-- Colonne pour éviter les doublons d'emails de re-engagement
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reengage_sent_at timestamp with time zone;

-- Index pour les requêtes de la edge function reengage-users
CREATE INDEX IF NOT EXISTS cv_history_user_score_created_idx
  ON public.cv_history(user_id, match_score, created_at DESC);

-- pg_cron est déjà activé sur ce projet (extension préexistante)
-- Cron : appeler reengage-users tous les jours à 9h UTC
-- Note : remplacer PROJECT_REF par votre ref Supabase (hzzeoxkenxyjtpazshgp)
SELECT cron.schedule(
  'reengage-users-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://hzzeoxkenxyjtpazshgp.supabase.co/functions/v1/reengage-users',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
