-- Create table for caching domain patterns
create table if not exists public.domain_patterns (
  domain text primary key,
  pattern text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create table for caching found emails
create table if not exists public.found_emails (
  email text primary key,
  first_name text,
  last_name text,
  domain text,
  score int,
  status text,
  source text, -- 'hunter', 'pattern_guess'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.domain_patterns enable row level security;
alter table public.found_emails enable row level security;

-- Create policies to allow read/write access for authenticated users
create policy "Enable read access for all users" on public.domain_patterns for select using (true);
create policy "Enable insert access for authenticated users" on public.domain_patterns for insert with check (auth.role() = 'authenticated');

create policy "Enable read access for all users" on public.found_emails for select using (true);
create policy "Enable insert access for authenticated users" on public.found_emails for insert with check (auth.role() = 'authenticated');
