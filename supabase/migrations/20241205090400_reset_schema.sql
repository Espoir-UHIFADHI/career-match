-- Non-destructive schema hardening for Clerk text IDs.
-- Older versions of this migration dropped profiles/resumes. Do not drop production data.

BEGIN;

-- 1. Ensure profiles table exists with correct ID type (TEXT).
CREATE TABLE IF NOT EXISTS public.profiles (
  id text NOT NULL PRIMARY KEY,
  credits integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Ensure resumes table exists with correct Foreign Key type (TEXT).
CREATE TABLE IF NOT EXISTS public.resumes (
  user_id text NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  content jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- 4. Recreate Policies for Profiles (idempotent)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.jwt() ->> 'sub') = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.jwt() ->> 'sub') = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.jwt() ->> 'sub') = id);

-- 5. Recreate Policies for Resumes (idempotent)
DROP POLICY IF EXISTS "Users can view their own resume" ON public.resumes;
DROP POLICY IF EXISTS "Users can insert/update their own resume" ON public.resumes;
DROP POLICY IF EXISTS "Users can update their own resume" ON public.resumes;

CREATE POLICY "Users can view their own resume" ON public.resumes FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Users can insert/update their own resume" ON public.resumes FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Users can update their own resume" ON public.resumes FOR UPDATE USING ((auth.jwt() ->> 'sub') = user_id);

-- 6. Recreate Trigger for Resumes (idempotent)
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_resumes_updated_at ON public.resumes;
CREATE TRIGGER handle_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- 7. Grant Permissions
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.resumes TO authenticated;

COMMIT;

