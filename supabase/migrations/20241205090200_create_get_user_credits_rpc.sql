-- Create a stored procedure to handle credit fetching/creation atomically
-- This bypasses PostgREST cache issues by running directly in the DB engine.

CREATE OR REPLACE FUNCTION public.get_user_credits(p_user_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER -- Run as database owner to ensure permissions
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

  -- 1. Try to find the user
  SELECT credits INTO v_credits
  FROM public.profiles
  WHERE id = p_user_id;

  -- 2. If user not found, create them
  IF v_credits IS NULL THEN
    INSERT INTO public.profiles (id, credits)
    VALUES (p_user_id, 7) -- Default 7 credits
    RETURNING credits INTO v_credits;
  END IF;

  RETURN v_credits;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_credits(text) TO authenticated;

