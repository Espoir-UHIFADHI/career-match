-- ==============================================================================
-- FIX RLS FOR CLERK INTEGRATION (FINAL)
-- ==============================================================================
-- Description:
-- Prevents "invalid input syntax for type uuid" errors by checking the JWT 'sub' claim
-- directly as text, instead of trying to cast it to a UUID with auth.uid().
-- This supports generic string IDs like Clerk's (e.g., "user_2p...").

BEGIN;

-- 1. PROFILES TABLE POLICIES
-- Drop potentially existing policies to ensure clean recreation
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles; -- legacy name check

-- Create robust policies
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING ( (select auth.jwt() ->> 'sub') = id );

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK ( (select auth.jwt() ->> 'sub') = id );

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING ( (select auth.jwt() ->> 'sub') = id );


-- 2. RESUMES TABLE POLICIES
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own resume" ON public.resumes;
DROP POLICY IF EXISTS "Users can insert/update their own resume" ON public.resumes;
DROP POLICY IF EXISTS "Users can update their own resume" ON public.resumes;

-- Create robust policies
CREATE POLICY "Users can view their own resume"
ON public.resumes FOR SELECT
TO authenticated
USING ( (select auth.jwt() ->> 'sub') = user_id );

CREATE POLICY "Users can insert/update their own resume"
ON public.resumes FOR INSERT
TO authenticated
WITH CHECK ( (select auth.jwt() ->> 'sub') = user_id );

CREATE POLICY "Users can update their own resume"
ON public.resumes FOR UPDATE
TO authenticated
USING ( (select auth.jwt() ->> 'sub') = user_id );

COMMIT;
