begin;

-- Create the whatsapp_provider_settings table if it was never applied
create table if not exists public.whatsapp_provider_settings (
  setting_key text primary key default 'global',
  active_provider text not null default 'meta_api'
    check (active_provider in ('meta_api', 'baileys_wa')),
  allow_fallback_to_meta boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Create the whatsapp_templates table if it was never applied
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

-- Add shopkeeper WA number column
alter table public.whatsapp_provider_settings
  add column if not exists shopkeeper_wa_number text;

-- Seed the default global settings row
insert into public.whatsapp_provider_settings (setting_key, active_provider, allow_fallback_to_meta)
values ('global', 'meta_api', true)
on conflict (setting_key) do nothing;

-- RLS
alter table public.whatsapp_provider_settings enable row level security;
alter table public.whatsapp_templates enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'whatsapp_provider_settings'
      and policyname = 'service_role_all_whatsapp_provider_settings'
  ) then
    create policy "service_role_all_whatsapp_provider_settings"
      on public.whatsapp_provider_settings
      for all to service_role
      using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'whatsapp_templates'
      and policyname = 'service_role_all_whatsapp_templates'
  ) then
    create policy "service_role_all_whatsapp_templates"
      on public.whatsapp_templates
      for all to service_role
      using (true) with check (true);
  end if;
end
$$;

commit;
