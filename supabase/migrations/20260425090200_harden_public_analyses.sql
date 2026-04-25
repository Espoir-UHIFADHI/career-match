-- Harden public share links: authenticated inserts, expiry and revocation.

alter table public_analyses
  add column if not exists expires_at timestamp with time zone default (timezone('utc'::text, now()) + interval '30 days') not null,
  add column if not exists revoked_at timestamp with time zone,
  add column if not exists share_type text not null default 'analysis';

drop policy if exists "Public analyses are viewable by everyone" on public_analyses;
drop policy if exists "Authenticated users can insert analyses" on public_analyses;
drop policy if exists "Users can revoke own public analyses" on public_analyses;

create policy "Public analyses are viewable by everyone"
  on public_analyses for select
  using (revoked_at is null and expires_at > timezone('utc'::text, now()));

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
