-- Cron keep-alive : maintient le projet Supabase actif toutes les 48h
-- Évite la mise en pause automatique du plan gratuit (7 jours d'inactivité)
-- Appelle la edge function keep-alive qui effectue une requête légère sur la DB

SELECT cron.schedule(
  'keep-alive-48h',
  '0 10 */2 * *',  -- toutes les 48h à 10h UTC
  $$
  SELECT net.http_post(
    url := 'https://hzzeoxkenxyjtpazshgp.supabase.co/functions/v1/keep-alive',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
