-- =====================================================================
-- Lets a customer override how their link buttons render, independent of
-- which of the 42 templates they picked — each template still draws its
-- own native button style by default (button_style IS NULL / 'default'),
-- but 'badge' and 'gradient' replace just that one part of the layout
-- with a shared look, built from the owner's own accent colour the same
-- way background_effect already is. Same pattern as
-- 054_card_background_effect.sql and 055_card_intro_style.sql: one more
-- per-card rendering knob, not a new colour or a new authorization surface.
--
-- Who writes/reads/validates: identical reasoning to background_effect —
-- the existing owner-write / anyone-reads-published policies already
-- cover this column, and the CHECK constraint mirrors intro_style's.
-- =====================================================================

ALTER TABLE public.card_profiles
  ADD COLUMN button_style text
  CHECK (button_style IS NULL OR button_style IN ('default', 'badge', 'gradient'));
