-- =====================================================================
-- Widens 059's button_style CHECK to the three additional looks added to
-- card-templates/LinkButtons.tsx: 'solid' (one flat accent colour, every
-- button the same), 'outline' (border only, no fill), and 'block' (square
-- corners, a trailing arrow chip) — alongside the original 'badge' and
-- 'gradient'.
--
-- Postgres has no ALTER CONSTRAINT for a CHECK's condition, so this drops
-- the one 059 added (Postgres's default name for a column-level CHECK is
-- <table>_<column>_check) and adds it back with the wider list.
-- =====================================================================

ALTER TABLE public.card_profiles
  DROP CONSTRAINT IF EXISTS card_profiles_button_style_check;

ALTER TABLE public.card_profiles
  ADD CONSTRAINT card_profiles_button_style_check
  CHECK (button_style IS NULL OR button_style IN ('default', 'badge', 'gradient', 'solid', 'outline', 'block'));
