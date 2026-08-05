-- =====================================================================
-- Remove the old portfolio-website builder.
--
-- Tapzar is an NFC card product. The `websites` / `assets` tables and the
-- nfc_cards.website_id column belonged to the site-builder this codebase
-- started life as, and nothing in the app reads them any more.
--
-- Run AFTER 005_admin_control.sql
-- =====================================================================

-- nfc_cards.website_id referenced websites, so it goes first.
ALTER TABLE public.nfc_cards DROP COLUMN IF EXISTS website_id;

DROP TABLE IF EXISTS public.assets CASCADE;
DROP TABLE IF EXISTS public.websites CASCADE;

-- card_profiles.links was superseded by `buttons` in migration 002, which
-- copied every row across. Nothing has read it since.
ALTER TABLE public.card_profiles DROP COLUMN IF EXISTS links;
