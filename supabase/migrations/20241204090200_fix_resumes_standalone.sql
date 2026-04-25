-- ALTERNATIVE SOLUTION: Standalone Resumes Table
-- This script creates the resumes table WITHOUT linking it to the profiles table.
-- This bypasses the "UUID vs Text" conflict completely for the CV feature.

-- 1. Drop the existing table to start fresh
drop table if exists public.resumes;

-- 2. Create the table with user_id as TEXT (no foreign key to profiles)
create table public.resumes (
  user_id text not null primary key, -- Stores the Clerk User ID directly
  content jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Security (RLS)
alter table public.resumes enable row level security;

-- 4. Policies (idempotent)
drop policy if exists "Users can view their own resume" on public.resumes;
drop policy if exists "Users can insert/update their own resume" on public.resumes;
drop policy if exists "Users can update their own resume" on public.resumes;

create policy "Users can view their own resume"
  on public.resumes for select
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "Users can insert/update their own resume"
  on public.resumes for insert
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "Users can update their own resume"
  on public.resumes for update
  using ((auth.jwt() ->> 'sub') = user_id);

-- 5. Auto-update timestamp trigger (idempotent)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists handle_resumes_updated_at on public.resumes;
create trigger handle_resumes_updated_at
  before update on public.resumes
  for each row
  execute procedure public.handle_updated_at();

