-- Keep Hunter cache writes server-side; avoid exposing collected email data publicly.

drop policy if exists "Enable read access for all users" on public.domain_patterns;
drop policy if exists "Enable insert access for authenticated users" on public.domain_patterns;
drop policy if exists "Enable read access for all users" on public.found_emails;
drop policy if exists "Enable insert access for authenticated users" on public.found_emails;

create policy "Authenticated users can read domain patterns"
  on public.domain_patterns for select
  to authenticated
  using (true);

create policy "Authenticated users can read cached emails"
  on public.found_emails for select
  to authenticated
  using (true);
