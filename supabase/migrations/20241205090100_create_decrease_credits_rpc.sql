-- Create a stored procedure to decrease user credits atomically
-- This ensures the balance check and update happen in a single transaction
-- and avoids direct table access inconsistencies.

CREATE OR REPLACE FUNCTION public.decrease_user_credits(p_user_id text, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER -- Run as database owner
SET search_path = public
AS $$
DECLARE
  v_new_credits integer;
  v_caller_id text;
  v_role text;
BEGIN
  v_caller_id := auth.jwt() ->> 'sub';
  v_role := auth.role();

  IF p_user_id IS NULL OR p_user_id = '' THEN
    RAISE EXCEPTION 'Missing user id';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid credit amount';
  END IF;

  IF v_role <> 'service_role' AND (v_caller_id IS NULL OR v_caller_id <> p_user_id) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE public.profiles
  SET credits = credits - p_amount
  WHERE id = p_user_id
    AND credits >= p_amount
  RETURNING credits INTO v_new_credits;

  IF v_new_credits IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
      RAISE EXCEPTION 'Insufficient credits';
    END IF;
    RAISE EXCEPTION 'User not found';
  END IF;

  RETURN v_new_credits;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.decrease_user_credits(text, integer) TO authenticated;

