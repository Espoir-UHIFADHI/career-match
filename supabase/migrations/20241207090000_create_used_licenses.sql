-- Create used_licenses table to prevent replay attacks
create table if not exists public.used_licenses (
  id uuid default gen_random_uuid() primary key,
  license_key text not null,
  user_id text not null references public.profiles(id),
  product_permalink text not null,
  variant text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure a license key can only be used once globally (or per product, but globally is safer for Gumroad)
  constraint used_licenses_key_unique unique (license_key)
);

-- Enable RLS
alter table public.used_licenses enable row level security;

-- Policies (idempotent)
drop policy if exists "Users can view own used licenses" on public.used_licenses;
create policy "Users can view own used licenses"
on public.used_licenses for select
to authenticated
using ( current_setting('request.jwt.claim.sub', true) = user_id );

