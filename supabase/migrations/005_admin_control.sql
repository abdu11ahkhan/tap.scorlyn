-- =====================================================================
-- Admin control surface: template catalogue, NFC card management,
-- and site-wide settings.
-- Run AFTER 004_admin.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- Template catalogue.
--
-- The designs themselves are React components and can't be created from a
-- UI. What an admin genuinely needs to control is the *catalogue*: which
-- templates are offered, what they're called, which sector they sit in and
-- in what order. Rows here override the defaults compiled into the app;
-- anything without a row falls back to the code definition.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.template_settings (
  -- Matches CARD_TEMPLATES[].id in src/lib/card.ts
  template_id TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  name TEXT,
  blurb TEXT,
  category TEXT,
  vibe TEXT,
  preview_accent TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_new BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.template_settings ENABLE ROW LEVEL SECURITY;

-- The gallery is public, so anyone must be able to read which templates are on.
CREATE POLICY "Anyone can read template settings."
  ON public.template_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage template settings."
  ON public.template_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- Site-wide settings. Single row, keyed so it can only ever be one.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  signups_open BOOLEAN NOT NULL DEFAULT true,
  publishing_open BOOLEAN NOT NULL DEFAULT true,
  announcement TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.app_settings (id) VALUES (true) ON CONFLICT DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app settings."
  ON public.app_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can change app settings."
  ON public.app_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- NFC card management.
--
-- 004 gave admins SELECT on nfc_cards so the console could report. Issuing
-- and reassigning physical stock needs the write side too — that is the
-- whole job of running an NFC card business.
-- ---------------------------------------------------------------------
CREATE POLICY "Admins can issue NFC cards."
  ON public.nfc_cards FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can reassign NFC cards."
  ON public.nfc_cards FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete NFC cards."
  ON public.nfc_cards FOR DELETE
  USING (public.is_admin());

-- A blank card can be printed and assigned to an owner later, so user_id
-- has to be optional. It was NOT NULL, which made pre-issuing stock
-- impossible.
ALTER TABLE public.nfc_cards ALTER COLUMN user_id DROP NOT NULL;

-- Batch label, so a print run can be tracked.
ALTER TABLE public.nfc_cards ADD COLUMN IF NOT EXISTS batch TEXT;
ALTER TABLE public.nfc_cards ADD COLUMN IF NOT EXISTS note TEXT;

-- ---------------------------------------------------------------------
-- Suspension must actually do something: a suspended owner's cards stop
-- being publicly readable.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view a published card profile." ON public.card_profiles;

CREATE POLICY "Anyone can view a published card profile."
  ON public.card_profiles FOR SELECT
  USING (
    published = true
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = card_profiles.user_id AND p.suspended = true
    )
  );
