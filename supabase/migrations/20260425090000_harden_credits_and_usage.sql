-- Harden credits: caller-bound RPCs, usage audit, and no direct credit updates by clients.

create table if not exists public.credit_usage_events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id text not null,
  action text not null,
  amount integer not null,
  reason text not null,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists credit_usage_events_user_created_at_idx
  on public.credit_usage_events(user_id, created_at desc);

alter table public.credit_usage_events enable row level security;

drop policy if exists "Users can read own credit usage events" on public.credit_usage_events;
create policy "Users can read own credit usage events"
  on public.credit_usage_events for select
  to authenticated
  using ((auth.jwt() ->> 'sub') = user_id);

revoke update on table public.profiles from authenticated;
grant select, insert on table public.profiles to authenticated;

create or replace function public.decrease_user_credits(p_user_id text, p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_credits integer;
  v_caller_id text;
  v_role text;
begin
  v_caller_id := auth.jwt() ->> 'sub';
  v_role := auth.role();

  if p_user_id is null or p_user_id = '' then
    raise exception 'Missing user id';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Invalid credit amount';
  end if;

  if v_role <> 'service_role' and (v_caller_id is null or v_caller_id <> p_user_id) then
    raise exception 'Forbidden';
  end if;

  update public.profiles
  set credits = credits - p_amount
  where id = p_user_id
    and credits >= p_amount
  returning credits into v_new_credits;

  if v_new_credits is null then
    if exists (select 1 from public.profiles where id = p_user_id) then
      raise exception 'Insufficient credits';
    end if;
    raise exception 'User not found';
  end if;

  return v_new_credits;
end;
$$;

create or replace function public.get_user_credits(p_user_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credits integer;
  v_caller_id text;
  v_role text;
begin
  v_caller_id := auth.jwt() ->> 'sub';
  v_role := auth.role();

  if p_user_id is null or p_user_id = '' then
    raise exception 'Missing user id';
  end if;

  if v_role <> 'service_role' and (v_caller_id is null or v_caller_id <> p_user_id) then
    raise exception 'Forbidden';
  end if;

  select credits into v_credits
  from public.profiles
  where id = p_user_id;

  if v_credits is null then
    insert into public.profiles (id, credits)
    values (p_user_id, 7)
    returning credits into v_credits;
  end if;

  return v_credits;
end;
$$;

grant execute on function public.decrease_user_credits(text, integer) to authenticated, service_role;
grant execute on function public.get_user_credits(text) to authenticated, service_role;
