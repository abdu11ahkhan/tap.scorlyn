-- 070: public writes only through the rate-limited API routes.
--
-- Until now anyone holding the public anon key (it ships in the site's
-- JavaScript) could skip /api/tap, /api/referral and /api/review-feedback —
-- and so every rate limit and check in them — by writing straight to
-- Supabase:
--   * INSERT into card_taps (policy "Anyone can record a tap on a published card.")
--   * INSERT into referral_events (policy "Anyone can record a referral event.")
--   * EXECUTE submit_review_feedback() (granted to anon, authenticated)
--
-- Those routes now write with the service role (src/lib/rate-limit.ts
-- serviceClient()), so the anonymous paths can close.
--
-- DEPLOY ORDER: ship the application code first, confirm SUPABASE_SERVICE_ROLE_KEY
-- is set in Vercel and taps/feedback still record, THEN run this. Run before
-- the code is live and anonymous tap/referral/feedback writes start failing.
--
-- Reading is unchanged: owners still read their own taps and feedback, and
-- the public profile view, is_live_card() and resolve_nfc_card() keep their
-- grants. Safe to run more than once.

DROP POLICY IF EXISTS "Anyone can record a tap on a published card." ON public.card_taps;

DROP POLICY IF EXISTS "Anyone can record a referral event." ON public.referral_events;

REVOKE EXECUTE ON FUNCTION public.submit_review_feedback(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_review_feedback(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO service_role;
