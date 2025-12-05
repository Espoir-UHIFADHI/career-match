-- Create a stored procedure to decrease user credits atomically
-- This ensures the balance check and update happen in a single transaction
-- and avoids direct table access inconsistencies.

CREATE OR REPLACE FUNCTION public.decrease_user_credits(p_user_id text, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER -- Run as database owner
AS $$
DECLARE
  v_current_credits integer;
  v_new_credits integer;
BEGIN
  -- 1. Check current credits
  SELECT credits INTO v_current_credits
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_current_credits IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_current_credits < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- 2. Update credits
  UPDATE public.profiles
  SET credits = credits - p_amount
  WHERE id = p_user_id
  RETURNING credits INTO v_new_credits;

  RETURN v_new_credits;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.decrease_user_credits(text, integer) TO authenticated;
