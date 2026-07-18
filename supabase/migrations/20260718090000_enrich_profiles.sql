-- Enrichissement de la table profiles :
-- 1. Données UTM (source de trafic pour attribution Google Ads)
-- 2. Données de profil métier (target_role, industry)
-- 3. Méta onboarding

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS utm_source    text,
  ADD COLUMN IF NOT EXISTS utm_medium    text,
  ADD COLUMN IF NOT EXISTS utm_campaign  text,
  ADD COLUMN IF NOT EXISTS utm_content   text,
  ADD COLUMN IF NOT EXISTS utm_term      text,
  ADD COLUMN IF NOT EXISTS gclid         text,
  ADD COLUMN IF NOT EXISTS target_role   text,
  ADD COLUMN IF NOT EXISTS industry      text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at    timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.handle_profiles_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_profiles_updated_at();

-- RPC sécurisée pour écrire les UTMs (appelée côté client au signup, une seule fois)
-- La logique "ne remplace que si vide" évite d'écraser les UTMs d'une session précédente
CREATE OR REPLACE FUNCTION public.set_user_utm(
  p_user_id     text,
  p_utm_source  text DEFAULT NULL,
  p_utm_medium  text DEFAULT NULL,
  p_utm_campaign text DEFAULT NULL,
  p_utm_content text DEFAULT NULL,
  p_utm_term    text DEFAULT NULL,
  p_gclid       text DEFAULT NULL,
  p_target_role text DEFAULT NULL,
  p_industry    text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id text := auth.jwt() ->> 'sub';
BEGIN
  -- Vérification d'autorisation : seul l'utilisateur lui-même peut écrire
  IF v_caller_id IS NULL OR v_caller_id != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.profiles (id, utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, target_role, industry)
    VALUES (p_user_id, p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content, p_utm_term, p_gclid, p_target_role, p_industry)
  ON CONFLICT (id) DO UPDATE SET
    -- UTMs : écrire uniquement si la colonne est encore vide (première attribution)
    utm_source   = CASE WHEN profiles.utm_source   IS NULL THEN EXCLUDED.utm_source   ELSE profiles.utm_source   END,
    utm_medium   = CASE WHEN profiles.utm_medium   IS NULL THEN EXCLUDED.utm_medium   ELSE profiles.utm_medium   END,
    utm_campaign = CASE WHEN profiles.utm_campaign IS NULL THEN EXCLUDED.utm_campaign ELSE profiles.utm_campaign END,
    utm_content  = CASE WHEN profiles.utm_content  IS NULL THEN EXCLUDED.utm_content  ELSE profiles.utm_content  END,
    utm_term     = CASE WHEN profiles.utm_term     IS NULL THEN EXCLUDED.utm_term     ELSE profiles.utm_term     END,
    gclid        = CASE WHEN profiles.gclid        IS NULL THEN EXCLUDED.gclid        ELSE profiles.gclid        END,
    -- target_role / industry : toujours mettre à jour si une valeur est fournie
    target_role  = COALESCE(EXCLUDED.target_role, profiles.target_role),
    industry     = COALESCE(EXCLUDED.industry, profiles.industry);
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.set_user_utm TO authenticated;
