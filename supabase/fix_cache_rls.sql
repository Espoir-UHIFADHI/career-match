-- ==============================================================================
-- FIX CACHE RLS POLICIES
-- ==============================================================================
-- Description:
-- Enables Row Level Security (RLS) and adds policies for `domain_patterns` and 
-- `found_emails` tables to allow authenticated users to save cache hits.
-- Also allows public read access so the tool works for everyone.

BEGIN;

-- 1. DOMAIN PATTERNS CACHE
ALTER TABLE public.domain_patterns ENABLE ROW LEVEL SECURITY;

-- Drop potential existing policies
DROP POLICY IF EXISTS "Authenticated users can insert domain patterns" ON public.domain_patterns;
DROP POLICY IF EXISTS "Authenticated users can update domain patterns" ON public.domain_patterns;
DROP POLICY IF EXISTS "Everyone can read domain patterns" ON public.domain_patterns;

-- Create policies
CREATE POLICY "Authenticated users can insert domain patterns"
ON public.domain_patterns FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update domain patterns"
ON public.domain_patterns FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Everyone can read domain patterns"
ON public.domain_patterns FOR SELECT
TO public
USING (true);


-- 2. FOUND EMAILS CACHE (If exists)
-- Wrap in DO block to avoid error if table missing
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'found_emails') THEN
        ALTER TABLE public.found_emails ENABLE ROW LEVEL SECURITY;

        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert emails" ON public.found_emails';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update emails" ON public.found_emails';
        EXECUTE 'DROP POLICY IF EXISTS "Everyone can read emails" ON public.found_emails';

        EXECUTE 'CREATE POLICY "Authenticated users can insert emails" ON public.found_emails FOR INSERT TO authenticated WITH CHECK (true)';
        EXECUTE 'CREATE POLICY "Authenticated users can update emails" ON public.found_emails FOR UPDATE TO authenticated USING (true)';
        EXECUTE 'CREATE POLICY "Everyone can read emails" ON public.found_emails FOR SELECT TO public USING (true)';
    END IF;
END $$;

COMMIT;
