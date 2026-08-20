-- =====================================================================
-- Lets a customer pick which entrance animation their card's elements
-- use on load — rise (default), dropdown, bubble, or swipe. Same pattern
-- as 054_card_background_effect.sql: one more per-card rendering knob,
-- not a new colour or a new authorization surface.
--
-- Who writes/reads/validates: identical reasoning to background_effect —
-- the existing owner-write / anyone-reads-published policies already
-- cover this column, and the CHECK constraint mirrors nfc_finish's.
-- =====================================================================

ALTER TABLE public.card_profiles
  ADD COLUMN intro_style text
  CHECK (intro_style IS NULL OR intro_style IN ('rise', 'dropdown', 'bubble', 'swipe'));
