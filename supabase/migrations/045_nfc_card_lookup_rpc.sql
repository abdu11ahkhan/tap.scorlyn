-- =====================================================================
-- Phase 7 — fixes a P0 found while wiring NFC attribution: nfc_cards has
-- no public SELECT policy (only "Users can manage their own NFC cards."
-- USING (auth.uid() = user_id), plus admin policies). An anonymous visitor
-- — which is what every real physical tap is — gets zero rows back when
-- looking up a card_url, confirmed live against production with the anon
-- key. /api/nfc/[cardId] has always used that anon-key client, so a real
-- physical tap has been falling through to the "unassigned" redirect
-- regardless of whether the card is actually assigned. This is the real
-- root cause behind card_taps.nfc_card_id always being null — not merely
-- that the value was never forwarded, but that resolving it as an
-- anonymous visitor was never possible to begin with.
--
-- Fix: a narrow SECURITY DEFINER function, not a broad public SELECT
-- policy. A blanket "USING (true)" policy would let anyone read every
-- column of every row via PostgREST (batch labels, user_id assignments,
-- the full card_url inventory) — RLS is row-level, not column-level, so
-- there's no way to open "just card_profile_id" through a policy alone.
-- This function returns exactly the two columns the redirect needs and
-- nothing else, for exactly one card_url at a time.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.resolve_nfc_card(code TEXT)
RETURNS TABLE (nfc_card_id UUID, card_profile_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, nfc_cards.card_profile_id
  FROM public.nfc_cards
  WHERE card_url = code;
$$;

-- PostgREST's anon/authenticated roles need explicit EXECUTE — functions
-- aren't covered by table RLS at all, so without this grant the function
-- would exist but be uncallable from the client.
GRANT EXECUTE ON FUNCTION public.resolve_nfc_card(TEXT) TO anon, authenticated;
