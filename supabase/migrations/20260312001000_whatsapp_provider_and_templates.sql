begin;

create table if not exists public.whatsapp_provider_settings (
  setting_key text primary key default 'global',
  active_provider text not null default 'meta_api'
    check (active_provider in ('meta_api', 'baileys_wa')),
  allow_fallback_to_meta boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  provider_scope text not null default 'baileys_wa'
    check (provider_scope in ('meta_api', 'baileys_wa', 'all')),
  body_text text not null,
  variables_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.whatsapp_provider_settings (setting_key, active_provider, allow_fallback_to_meta)
values ('global', 'meta_api', true)
on conflict (setting_key) do nothing;

insert into public.whatsapp_templates (
  name,
  slug,
  provider_scope,
  body_text,
  variables_json,
  is_active
)
values (
  'New Website Order - Action Required',
  'new-website-order-action-required',
  'baileys_wa',
  'New Website Order - Action Required

Customer name: {{customerName}}
Item: {{itemsLine}}
Delivery location: {{deliveryLocation}}

Status: {{orderStatus}}
Payment method: {{paymentMethod}}

Please:
- Confirm payment once received
- Start order preparation immediately after payment
- Allow approx. 30min for preparation
- Inform management once the order is ready and when it is dispatched

Delivery location: {{deliveryLocation}}

The customer will be notified separately.
For questions, contact the customer: {{customerPhone}}.',
  '{"customerName":"Customer name","itemsLine":"Order items","deliveryLocation":"Delivery location","orderStatus":"Payment state","paymentMethod":"Payment method","customerPhone":"Customer phone"}'::jsonb,
  true
)
on conflict (slug) do nothing;

alter table public.whatsapp_provider_settings enable row level security;
alter table public.whatsapp_templates enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'whatsapp_provider_settings'
      and policyname = 'service_role_all_whatsapp_provider_settings'
  ) then
    create policy "service_role_all_whatsapp_provider_settings"
      on public.whatsapp_provider_settings
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'whatsapp_templates'
      and policyname = 'service_role_all_whatsapp_templates'
  ) then
    create policy "service_role_all_whatsapp_templates"
      on public.whatsapp_templates
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end
$$;

commit;
