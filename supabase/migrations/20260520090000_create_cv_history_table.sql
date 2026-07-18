-- CV History: one row per generated CV (per user)
create table if not exists public.cv_history (
  id          text not null,
  user_id     text not null references public.profiles(id) on delete cascade,
  created_at  timestamp with time zone default timezone('utc'::text, now()) not null,
  cv_data     jsonb not null,
  job_data    jsonb not null,
  match_score integer not null,
  analysis_language text not null default 'French',
  optimized_cv      jsonb not null,
  full_analysis     jsonb not null,
  full_job_data     jsonb not null,
  primary key (id, user_id)
);

-- Enable RLS
alter table public.cv_history enable row level security;

-- Policies
drop policy if exists "Users can view own cv_history" on public.cv_history;
drop policy if exists "Users can insert own cv_history" on public.cv_history;
drop policy if exists "Users can delete own cv_history" on public.cv_history;

create policy "Users can view own cv_history"
  on public.cv_history for select
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "Users can insert own cv_history"
  on public.cv_history for insert
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "Users can delete own cv_history"
  on public.cv_history for delete
  using ((auth.jwt() ->> 'sub') = user_id);
