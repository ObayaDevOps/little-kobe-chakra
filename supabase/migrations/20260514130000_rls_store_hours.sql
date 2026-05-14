-- RLS for store_hours.
-- Public storefront needs SELECT to show opening hours.
-- Writes go through the admin API which uses service_role, so no authenticated write policy needed.

begin;

alter table public.store_hours enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'store_hours'
      and policyname = 'service_role_all_store_hours'
  ) then
    create policy "service_role_all_store_hours"
      on public.store_hours
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'store_hours'
      and policyname = 'public_read_store_hours'
  ) then
    create policy "public_read_store_hours"
      on public.store_hours
      for select
      to anon, authenticated
      using (true);
  end if;
end
$$;

commit;
