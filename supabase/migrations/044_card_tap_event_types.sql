-- =====================================================================
-- Phase 7 — analytics + NFC attribution
--
-- card_taps already carries everything a public-card interaction event
-- needs (card_profile_id, nfc_card_id, source, visitor_hash, created_at)
-- except a way to say *what happened*, so it only ever recorded a page
-- view. Extending it rather than adding a parallel events table: every
-- row is still "an interaction with this card," just with a type now.
--
-- Existing rows get event_type = 'view' via the DEFAULT, so nothing
-- already stored changes meaning.
-- =====================================================================

ALTER TABLE public.card_taps
  ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'view'
    CHECK (event_type IN (
      'view',
      'contact_save',
      'share',
      'qr_open',
      'phone_click',
      'email_click',
      'whatsapp_click',
      'website_click',
      'social_click',
      'booking_click'
    ));

-- Which button/link, for the click events where that's meaningful (e.g.
-- 'instagram' on a social_click, 'link' on a generic website_click). Null
-- for view/share/qr_open/contact_save, which don't have a sub-target.
ALTER TABLE public.card_taps
  ADD COLUMN IF NOT EXISTS target TEXT;

-- The dashboard/admin "total taps" counts already query this table with no
-- event_type filter, relying on it being 100% page views. Once click events
-- start landing here those counts would silently start including clicks —
-- an index makes the .eq("event_type","view") filter added alongside this
-- migration (see dashboard/page.tsx, admin/page.tsx) cheap rather than a
-- full-table scan.
CREATE INDEX IF NOT EXISTS card_taps_profile_event_idx
  ON public.card_taps (card_profile_id, event_type, created_at DESC);

COMMENT ON COLUMN public.card_taps.event_type IS
  'What kind of interaction this row records. Existing rows default to
   view for backward compatibility — the column did not exist before this
   migration and every prior row really was a page view.';
COMMENT ON COLUMN public.card_taps.target IS
  'Optional sub-classification for click events, e.g. the button kind
   (instagram, linkedin, link). Null where not applicable.';
