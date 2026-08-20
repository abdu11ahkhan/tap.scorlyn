-- =====================================================================
-- Phase 9 — company-wide analytics needs a corporate owner to read taps
-- on their employees' cards, not just their own. card_taps' only
-- non-admin SELECT policy today checks card_profiles.user_id = auth.uid()
-- (confirmed via direct introspection in Phase 8.5) — an owner has no
-- path to their employees' analytics at all, only to a card they
-- personally created.
--
-- Mirrors the exact pattern already used for card_profiles itself
-- ("Corporate owners can view their employees' cards." USING
-- (org_owner_id = auth.uid()), 040_corporate_accounts.sql) — same
-- relationship, same shape, applied to the sibling table.
-- =====================================================================

CREATE POLICY "Corporate owners can view their employees' card taps."
  ON public.card_taps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.card_profiles cp
      WHERE cp.id = card_taps.card_profile_id AND cp.org_owner_id = auth.uid()
    )
  );
