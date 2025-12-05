-- Create a stored procedure to handle credit fetching/creation atomically
-- This bypasses PostgREST cache issues by running directly in the DB engine.

CREATE OR REPLACE FUNCTION public.get_user_credits(p_user_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER -- Run as database owner to ensure permissions
AS $$
DECLARE
  v_credits integer;
BEGIN
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
