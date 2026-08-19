-- =====================================================================
-- 042 - A corporate account's "house style": scan the company's own card
-- once, and every employee card created afterward starts from the same
-- look, instead of the hardcoded minimal/black default createEmployee used
-- before this (see src/app/dashboard/team/actions.ts).
--
-- Nullable and meaningful only for corporate accounts, same pattern as
-- company_slug etc. in 040_corporate_accounts.sql. No RLS changes needed —
-- these are read/written exactly like company_name already is, through the
-- owner's own session.
-- =====================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS house_template TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS house_accent_color TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS house_surface_color TEXT;
