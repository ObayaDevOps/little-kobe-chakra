-- RLS hardening for Little Kobe tables.
-- Goal: secure data without breaking existing production flows that rely on service_role.

begin;

-- Helper schema + function for admin checks.
create schema if not exists private;

create or replace function private.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('owner', 'admin')
  );
$$;

-- Enable RLS on all public app tables.
alter table public.orders enable row level security;
alter table public.inventory enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.processed_events enable row level security;
alter table public.user_roles enable row level security;
alter table public.admin_signup_requests enable row level security;

-- Keep service_role fully functional across all tables.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'orders' and policyname = 'service_role_all_orders'
  ) then
    create policy "service_role_all_orders"
      on public.orders
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'inventory' and policyname = 'service_role_all_inventory'
  ) then
    create policy "service_role_all_inventory"
      on public.inventory
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'order_items' and policyname = 'service_role_all_order_items'
  ) then
    create policy "service_role_all_order_items"
      on public.order_items
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payments' and policyname = 'service_role_all_payments'
  ) then
    create policy "service_role_all_payments"
      on public.payments
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'processed_events' and policyname = 'service_role_all_processed_events'
  ) then
    create policy "service_role_all_processed_events"
      on public.processed_events
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_roles' and policyname = 'service_role_all_user_roles'
  ) then
    create policy "service_role_all_user_roles"
      on public.user_roles
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'admin_signup_requests' and policyname = 'service_role_all_admin_signup_requests'
  ) then
    create policy "service_role_all_admin_signup_requests"
      on public.admin_signup_requests
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end
$$;

-- Public storefront inventory reads.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'inventory' and policyname = 'public_read_inventory'
  ) then
    create policy "public_read_inventory"
      on public.inventory
      for select
      to anon, authenticated
      using (true);
  end if;
end
$$;

-- Authenticated users can read only their own orders, admins can read all.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'orders' and policyname = 'users_read_own_orders'
  ) then
    create policy "users_read_own_orders"
      on public.orders
      for select
      to authenticated
      using (
        user_id = auth.uid()
        or (select private.is_admin_user())
      );
  end if;
end
$$;

-- Authenticated users can read order items belonging to their own orders.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'order_items' and policyname = 'users_read_own_order_items'
  ) then
    create policy "users_read_own_order_items"
      on public.order_items
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.orders o
          where o.id = order_items.order_id
            and (
              o.user_id = auth.uid()
              or (select private.is_admin_user())
            )
        )
      );
  end if;
end
$$;

-- Authenticated users can read only their own payments, admins can read all.
-- Note: payments.user_id is text in current schema.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payments' and policyname = 'users_read_own_payments'
  ) then
    create policy "users_read_own_payments"
      on public.payments
      for select
      to authenticated
      using (
        user_id = auth.uid()::text
        or (select private.is_admin_user())
      );
  end if;
end
$$;

-- Users can see their own role row; admins can see all.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_roles' and policyname = 'users_read_own_role_or_admin'
  ) then
    create policy "users_read_own_role_or_admin"
      on public.user_roles
      for select
      to authenticated
      using (
        user_id = auth.uid()
        or (select private.is_admin_user())
      );
  end if;
end
$$;

-- Admin signup requests: users can create/view their own request; admins can view/update all.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'admin_signup_requests' and policyname = 'users_insert_own_admin_signup_request'
  ) then
    create policy "users_insert_own_admin_signup_request"
      on public.admin_signup_requests
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'admin_signup_requests' and policyname = 'users_read_own_admin_signup_request'
  ) then
    create policy "users_read_own_admin_signup_request"
      on public.admin_signup_requests
      for select
      to authenticated
      using (
        user_id = auth.uid()
        or (select private.is_admin_user())
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'admin_signup_requests' and policyname = 'admins_update_admin_signup_request'
  ) then
    create policy "admins_update_admin_signup_request"
      on public.admin_signup_requests
      for update
      to authenticated
      using ((select private.is_admin_user()))
      with check ((select private.is_admin_user()));
  end if;
end
$$;

commit;
