-- Create table for storing public analyses
create table if not exists public_analyses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id text, -- Can be null for anonymous or link to Clerk ID
  content jsonb not null, -- Stores the analysis result
  career_slug text -- Optional, to link back to the career path
);

-- RLS Policies
alter table public_analyses enable row level security;

-- Allow anyone to READ public analyses (This is key for sharing)
create policy "Public analyses are viewable by everyone"
  on public_analyses for select
  using (true);

-- Allow authenticated users to INSERT their analysis
create policy "Authenticated users can insert analyses"
  on public_analyses for insert
  with check (true);
