-- WARNING: THIS SCRIPT DROPS TABLES AND DELETES DATA
-- It is necessary to fix the "invalid input syntax for type uuid" error definitively.

BEGIN;

-- 1. Drop the dependent table first (resumes references profiles)
DROP TABLE IF EXISTS public.resumes;

-- 2. Drop the main table
DROP TABLE IF EXISTS public.profiles;

-- 3. Recreate profiles table with correct ID type (TEXT)
CREATE TABLE public.profiles (
  id text NOT NULL PRIMARY KEY,
  credits integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Recreate resumes table with correct Foreign Key type (TEXT)
CREATE TABLE public.resumes (
  user_id text NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  content jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- 6. Recreate Policies for Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid()::text = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid()::text = id);

-- 7. Recreate Policies for Resumes
CREATE POLICY "Users can view their own resume" ON public.resumes FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert/update their own resume" ON public.resumes FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own resume" ON public.resumes FOR UPDATE USING (auth.uid()::text = user_id);

-- 8. Recreate Trigger for Resumes
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- 9. Grant Permissions
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.resumes TO authenticated;

COMMIT;
