-- Manual rollback script for Baileys WhatsApp testing data model.
-- Run this in Supabase SQL Editor only when you intentionally want to remove
-- the WhatsApp provider toggle/template persistence introduced for Baileys testing.
--
-- This script is intentionally stored in supabase/scripts (not supabase/migrations)
-- so it does not auto-run in deployment pipelines.

begin;

-- 1) Force operational safety first (if the settings table still exists).
--    This prevents staying on Baileys if cleanup is partial.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'whatsapp_provider_settings'
  ) then
    update public.whatsapp_provider_settings
       set active_provider = 'meta_api',
           allow_fallback_to_meta = true,
           updated_at = timezone('utc', now())
     where setting_key = 'global';
  end if;
end
$$;

-- 2) Remove Baileys-related support templates/settings tables.
--    CASCADE ensures related policies/indexes are removed with the table.
drop table if exists public.whatsapp_templates cascade;
drop table if exists public.whatsapp_provider_settings cascade;

commit;
