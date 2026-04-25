-- Create table for storing public analyses
create table if not exists public_analyses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default (timezone('utc'::text, now()) + interval '30 days') not null,
  revoked_at timestamp with time zone,
  user_id text, -- Can be null for anonymous or link to Clerk ID
  content jsonb not null, -- Stores the analysis result
  career_slug text, -- Optional, to link back to the career path
  share_type text not null default 'analysis'
);

-- RLS Policies
alter table public_analyses enable row level security;

-- Policies (idempotent)
drop policy if exists "Public analyses are viewable by everyone" on public_analyses;
drop policy if exists "Authenticated users can insert analyses" on public_analyses;
drop policy if exists "Users can revoke own public analyses" on public_analyses;

-- Allow anyone to READ active public analyses only.
create policy "Public analyses are viewable by everyone"
  on public_analyses for select
  using (revoked_at is null and expires_at > timezone('utc'::text, now()));

-- Allow authenticated users to INSERT their analysis
create policy "Authenticated users can insert analyses"
  on public_analyses for insert
  to authenticated
  with check (
    (auth.jwt() ->> 'sub') = user_id
    and expires_at <= timezone('utc'::text, now()) + interval '90 days'
  );

create policy "Users can revoke own public analyses"
  on public_analyses for update
  to authenticated
  using ((auth.jwt() ->> 'sub') = user_id)
  with check ((auth.jwt() ->> 'sub') = user_id);

