-- Create resumes table to store parsed CV data
create table if not exists public.resumes (
  user_id text not null primary key references public.profiles(id) on delete cascade,
  content jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.resumes enable row level security;

-- Policies (idempotent)
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

-- Create updated_at trigger (idempotent)
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

