-- Change profiles.id from UUID to TEXT to support Clerk IDs
-- This version handles dependencies causing errors on BOTH profiles and resumes tables.

BEGIN;

-- 1. Drop existing policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- 2. Drop existing policies on resumes (THIS WAS MISSING)
DROP POLICY IF EXISTS "Users can view their own resume" ON public.resumes;
DROP POLICY IF EXISTS "Users can insert/update their own resume" ON public.resumes;
DROP POLICY IF EXISTS "Users can update their own resume" ON public.resumes;

-- 3. Drop Foreign Key on resumes
ALTER TABLE public.resumes DROP CONSTRAINT IF EXISTS resumes_user_id_fkey;

-- 4. Alter the column types
ALTER TABLE public.profiles ALTER COLUMN id TYPE text;
ALTER TABLE public.resumes ALTER COLUMN user_id TYPE text;

-- 5. Re-add Foreign Key
ALTER TABLE public.resumes
ADD CONSTRAINT resumes_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 6. Re-create Policies for Profiles (casting auth.uid() to text)
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid()::text = id);

-- 7. Re-create Policies for Resumes (casting auth.uid() to text)
CREATE POLICY "Users can view their own resume"
ON public.resumes FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert/update their own resume"
ON public.resumes FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own resume"
ON public.resumes FOR UPDATE
USING (auth.uid()::text = user_id);

COMMIT;
