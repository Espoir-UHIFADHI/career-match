-- Idempotent credit grants for paid purchases, licenses and referrals.

create table if not exists public.credit_grants (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id text not null,
  amount integer not null,
  source text not null,
  reference text not null,
  meta jsonb not null default '{}'::jsonb,
  unique (source, reference)
);

create index if not exists credit_grants_user_created_at_idx
  on public.credit_grants(user_id, created_at desc);

alter table public.credit_grants enable row level security;

drop policy if exists "Users can read own credit grants" on public.credit_grants;
create policy "Users can read own credit grants"
  on public.credit_grants for select
  to authenticated
  using ((auth.jwt() ->> 'sub') = user_id);

create or replace function public.grant_user_credits_once(
  p_user_id text,
  p_amount integer,
  p_source text,
  p_reference text,
  p_meta jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_balance integer;
  v_inserted_count integer;
begin
  if p_user_id is null or p_user_id = '' then
    raise exception 'Missing user id';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Invalid credit amount';
  end if;

  if p_source is null or p_source = '' or p_reference is null or p_reference = '' then
    raise exception 'Missing grant source or reference';
  end if;

  insert into public.credit_grants (user_id, amount, source, reference, meta)
  values (p_user_id, p_amount, p_source, p_reference, coalesce(p_meta, '{}'::jsonb))
  on conflict (source, reference) do nothing;

  get diagnostics v_inserted_count = row_count;

  if v_inserted_count = 0 then
    select credits into v_new_balance
    from public.profiles
    where id = p_user_id;

    return coalesce(v_new_balance, 0);
  end if;

  insert into public.profiles (id, credits)
  values (p_user_id, p_amount)
  on conflict (id) do update
    set credits = public.profiles.credits + excluded.credits
  returning credits into v_new_balance;

  insert into public.credit_usage_events (user_id, action, amount, reason, meta)
  values (
    p_user_id,
    p_source,
    p_amount,
    'granted',
    jsonb_build_object('reference', p_reference) || coalesce(p_meta, '{}'::jsonb)
  );

  return v_new_balance;
end;
$$;

grant execute on function public.grant_user_credits_once(text, integer, text, text, jsonb) to service_role;
