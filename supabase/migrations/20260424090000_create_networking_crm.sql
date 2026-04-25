-- Networking CRM: contacts + message history (Clerk user_id as text)

create table if not exists public.networking_contacts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  user_id text not null,
  job_key text, -- cache per offer (e.g. "Company::Title")

  linkedin_url text not null,
  full_name text,
  title text,
  company text,
  snippet text,

  status text not null default 'to_contact', -- to_contact/contacted/followed_up/replied/not_relevant
  tags text[] not null default '{}'::text[],
  notes text,
  next_follow_up date,
  last_generated_at timestamp with time zone
);

create unique index if not exists networking_contacts_user_linkedin_unique
  on public.networking_contacts(user_id, linkedin_url);

create index if not exists networking_contacts_user_job_key_idx
  on public.networking_contacts(user_id, job_key);

create table if not exists public.networking_message_history (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  user_id text not null,
  contact_id uuid not null references public.networking_contacts(id) on delete cascade,

  channel text not null, -- linkedin | email
  step integer not null default 1, -- 1=approach, 2.. followups
  content text not null,
  copied_at timestamp with time zone,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists networking_message_history_contact_idx
  on public.networking_message_history(contact_id, created_at desc);

-- RLS
alter table public.networking_contacts enable row level security;
alter table public.networking_message_history enable row level security;

-- Policies (idempotent)
drop policy if exists "Users can read own networking contacts" on public.networking_contacts;
drop policy if exists "Users can insert own networking contacts" on public.networking_contacts;
drop policy if exists "Users can update own networking contacts" on public.networking_contacts;
drop policy if exists "Users can delete own networking contacts" on public.networking_contacts;

create policy "Users can read own networking contacts"
  on public.networking_contacts for select
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "Users can insert own networking contacts"
  on public.networking_contacts for insert
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "Users can update own networking contacts"
  on public.networking_contacts for update
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "Users can delete own networking contacts"
  on public.networking_contacts for delete
  using ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists "Users can read own networking messages" on public.networking_message_history;
drop policy if exists "Users can insert own networking messages" on public.networking_message_history;
drop policy if exists "Users can update own networking messages" on public.networking_message_history;
drop policy if exists "Users can delete own networking messages" on public.networking_message_history;

create policy "Users can read own networking messages"
  on public.networking_message_history for select
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "Users can insert own networking messages"
  on public.networking_message_history for insert
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "Users can update own networking messages"
  on public.networking_message_history for update
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "Users can delete own networking messages"
  on public.networking_message_history for delete
  using ((auth.jwt() ->> 'sub') = user_id);

-- updated_at trigger (uses existing public.handle_updated_at if present)
do $$
begin
  if exists (select 1 from pg_proc where proname = 'handle_updated_at' and pronamespace = 'public'::regnamespace) then
    drop trigger if exists handle_networking_contacts_updated_at on public.networking_contacts;
    create trigger handle_networking_contacts_updated_at
      before update on public.networking_contacts
      for each row
      execute procedure public.handle_updated_at();
  end if;
end $$;

