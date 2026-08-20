-- =====================================================================
-- Lets a customer pick an optional background effect (glow / grid /
-- gradient wash) for their own digital card, on top of their existing
-- accent_color/surface_color choices — not a new colour system, just one
-- more per-card rendering knob alongside the ones that already exist.
--
-- Who writes: the card's own owner, through the same editor path that
-- already writes accent_color/surface_color — covered by the existing
-- "Owners can manage their own card profiles." ALL policy, no new policy
-- needed.
-- Who reads: anyone viewing the published card (existing "Anyone can view
-- a published card profile." policy already covers every column on the
-- row, this one included).
-- Validation: a CHECK constraint at the DB level, mirroring the pattern
-- already used for nfc_finish — the application only ever offers these
-- four values, but a constraint means a stray value can't silently reach
-- a template's render logic from anywhere else that writes this table.
-- =====================================================================

ALTER TABLE public.card_profiles
  ADD COLUMN background_effect text
  CHECK (background_effect IS NULL OR background_effect IN ('none', 'glow', 'grid', 'gradient'));
