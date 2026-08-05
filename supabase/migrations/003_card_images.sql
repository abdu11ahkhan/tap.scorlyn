-- =====================================================================
-- Photos on cards: a background/cover image and a small gallery.
-- Run AFTER 002_card_templates.sql
-- =====================================================================

-- Full-bleed background / hero image. Templates that have a cover area use
-- this; the rest ignore it, so it is safe to set on any template.
ALTER TABLE public.card_profiles
  ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- How the cover is treated where a template supports both:
--   'cover'  – fills the hero area
--   'tint'   – sits behind the whole page, dimmed, as a backdrop
ALTER TABLE public.card_profiles
  ADD COLUMN IF NOT EXISTS cover_mode TEXT NOT NULL DEFAULT 'cover'
  CHECK (cover_mode IN ('cover', 'tint'));

-- Portfolio work. [{ "url": "https://...", "caption": "Project", "href": "" }]
ALTER TABLE public.card_profiles
  ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb NOT NULL;
