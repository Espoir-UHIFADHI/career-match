-- Referral records used by process-referral Edge Function.

create table if not exists public.referrals (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  referrer_id text not null,
  referred_user_id text not null,
  status text not null default 'pending',
  unique (referred_user_id)
);

create index if not exists referrals_referrer_created_at_idx
  on public.referrals(referrer_id, created_at desc);

drop policy if exists "Users can view their own referrals" on public.referrals;
drop policy if exists "Users can read own referrals" on public.referrals;

alter table public.referrals
  drop constraint if exists referrals_referrer_id_fkey,
  drop constraint if exists referrals_referred_user_id_fkey;

alter table public.referrals
  alter column referrer_id type text using referrer_id::text,
  alter column referred_user_id type text using referred_user_id::text;

alter table public.referrals enable row level security;

create policy "Users can read own referrals"
  on public.referrals for select
  to authenticated
  using ((auth.jwt() ->> 'sub') = referrer_id or (auth.jwt() ->> 'sub') = referred_user_id);
