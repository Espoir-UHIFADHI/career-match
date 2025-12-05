-- Change profiles.id from UUID to TEXT to support Clerk IDs
-- This is necessary because Clerk User IDs are strings (e.g., "user_xyz"), not UUIDs.

BEGIN;

-- 1. Drop constraints that might depend on the column type (if any)
-- (none expected for a simple profile table, but good practice to be aware)

-- 2. Alter the column type
ALTER TABLE public.profiles
ALTER COLUMN id TYPE text;

COMMIT;
