-- =====================================================================
-- Phase 11.5 — a corporate owner needs to read the physical-card lifecycle
-- (order status + NFC assignment) for their employees' cards, not just
-- their own. Confirmed via direct pg_policies introspection: nfc_cards and
-- orders each have exactly one non-admin SELECT policy, both scoped to
-- auth.uid() = user_id. An owner has no path to an employee's order or NFC
-- assignment row at all — only to one they personally placed/own.
--
-- Mirrors the exact pattern already used for card_taps
-- ("Corporate owners can view their employees' card taps.",
-- 050_corporate_card_taps_visibility.sql) — same relationship (join through
-- card_profiles.org_owner_id), same shape, applied to the two sibling
-- tables the physical-card status derivation reads.
--
-- Read-only. Does not touch INSERT/UPDATE/DELETE — an owner still cannot
-- place an order or assign a card on an employee's behalf through this;
-- those remain admin-only actions, unchanged.
-- =====================================================================

CREATE POLICY "Corporate owners can view their employees' orders."
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.card_profiles cp
      WHERE cp.id = orders.card_profile_id AND cp.org_owner_id = auth.uid()
    )
  );

CREATE POLICY "Corporate owners can view their employees' NFC cards."
  ON public.nfc_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.card_profiles cp
      WHERE cp.id = nfc_cards.card_profile_id AND cp.org_owner_id = auth.uid()
    )
  );
