-- =====================================================================
-- Single-purpose NFC cards: a card dedicated to one action (WhatsApp,
-- Instagram, Maps, a Google Review link, a payment link, ...) where a tap
-- opens that action directly, with no Tap Scorlyn profile page in between.
--
-- No new table: card_profiles already is "the thing a tap opens" — a
-- single-purpose card is exactly that, it just opens something else
-- immediately. The one destination reuses the existing `buttons` column
-- (buttons[0]) and resolveButton(), so nothing about checkout, chip
-- assignment, or the template renderer needs to know this card is
-- different — only the tap/QR resolution path branches on the new flag.
-- =====================================================================

ALTER TABLE public.card_profiles
  ADD COLUMN IF NOT EXISTS is_single_purpose BOOLEAN NOT NULL DEFAULT false;

-- Widened to return what a single-purpose tap needs to redirect in one hop,
-- without a second round trip to card_profiles. These are the same fields
-- already publicly visible on a published profile (username, its first
-- button) — this just hands them back one step earlier. Still SECURITY
-- DEFINER and still scoped to exactly one card_url at a time, same as before.
--
-- The return row shape changed (new OUT columns), which CREATE OR REPLACE
-- can't do in place — Postgres requires the old signature dropped first.
DROP FUNCTION IF EXISTS public.resolve_nfc_card(TEXT);

CREATE OR REPLACE FUNCTION public.resolve_nfc_card(code TEXT)
RETURNS TABLE (
  nfc_card_id UUID,
  card_profile_id UUID,
  username TEXT,
  is_single_purpose BOOLEAN,
  redirect_kind TEXT,
  redirect_value TEXT,
  redirect_message TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    nc.id,
    nc.card_profile_id,
    cp.username,
    cp.is_single_purpose,
    (cp.buttons -> 0 ->> 'kind'),
    (cp.buttons -> 0 ->> 'value'),
    (cp.buttons -> 0 ->> 'message')
  FROM public.nfc_cards nc
  LEFT JOIN public.card_profiles cp ON cp.id = nc.card_profile_id
  WHERE nc.card_url = code;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_nfc_card(TEXT) TO anon, authenticated;
