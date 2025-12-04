-- Create resumes table to store parsed CV data
create table if not exists public.resumes (
  user_id text not null primary key references public.profiles(id) on delete cascade,
  content jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.resumes enable row level security;

-- Create policies
create policy "Users can view their own resume"
  on public.resumes for select
  using (auth.uid()::text = user_id);

create policy "Users can insert/update their own resume"
  on public.resumes for insert
  with check (auth.uid()::text = user_id);

create policy "Users can update their own resume"
  on public.resumes for update
  using (auth.uid()::text = user_id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_resumes_updated_at
  before update on public.resumes
  for each row
  execute procedure public.handle_updated_at();
