-- Create profiles table if it doesn't exist
create table if not exists public.profiles (
  id text not null primary key,
  credits integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Drop existing policies to avoid "already exists" errors
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- Policy: Allow users to view their own profile
create policy "Users can view own profile"
on public.profiles for select
to authenticated
using ( (select auth.uid())::text = id );

-- Policy: Allow users to insert their own profile
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check ( (select auth.uid())::text = id );

-- Policy: Allow users to update their own profile (for credit usage)
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using ( (select auth.uid())::text = id );

-- Grant access to authenticated users
grant select, insert, update on table public.profiles to authenticated;
