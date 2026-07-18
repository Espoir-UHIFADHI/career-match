-- Réduction des crédits gratuits par défaut : 7 → 3
-- Raison : 7 crédits permettaient de compléter 2 analyses complètes gratuitement,
-- réduisant l'incitation à l'achat. 3 crédits = exactement 1 analyse complète.
-- Les utilisateurs existants NE SONT PAS affectés (on ne touche pas aux profils existants).

CREATE OR REPLACE FUNCTION public.get_user_credits(p_user_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits integer;
  v_caller_id text;
  v_role text;
BEGIN
  v_caller_id := auth.jwt() ->> 'sub';
  v_role := auth.role();

  IF p_user_id IS NULL OR p_user_id = '' THEN
    RAISE EXCEPTION 'Missing user id';
  END IF;

  IF v_role <> 'service_role' AND (v_caller_id IS NULL OR v_caller_id <> p_user_id) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT credits INTO v_credits
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_credits IS NULL THEN
    INSERT INTO public.profiles (id, credits)
    VALUES (p_user_id, 3) -- 3 crédits gratuits = 1 analyse complète
    RETURNING credits INTO v_credits;
  END IF;

  RETURN v_credits;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_credits(text) TO authenticated;
