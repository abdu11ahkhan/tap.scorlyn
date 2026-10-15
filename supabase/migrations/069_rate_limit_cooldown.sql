-- 069: support the public-endpoint rate limits (Phase 1).
--
-- Additive only: one index and one new function. Nothing existing changes,
-- and the application keeps working if this has not been run yet —
-- src/lib/rate-limit.ts falls back to hit_rate_limit() for the cooldown.
--
-- 1. hit_rate_limit() deletes rows older than two days on every call, by
--    window_start. The primary key starts with `key`, so that delete scanned
--    the whole table each time. /api/tap now goes through the limiter on
--    every event, so the scan has to stay cheap.
--
-- 2. claim_cooldown(): "at most one per N seconds" for one key, exactly.
--    hit_rate_limit() uses fixed clock-aligned windows, which allows two hits
--    either side of a boundary (e.g. 10:04:59 and 10:05:00). Used for
--    "one feedback alert email per card per five minutes". A per-key
--    transaction-scoped advisory lock makes concurrent claims safe.
--
-- Service role only, same as hit_rate_limit(). Safe to run more than once.

CREATE INDEX IF NOT EXISTS api_rate_limits_window_start_idx
  ON public.api_rate_limits (window_start);

CREATE OR REPLACE FUNCTION public.claim_cooldown(p_key TEXT, p_seconds INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  k TEXT := 'cooldown:' || p_key;
  last_at TIMESTAMPTZ;
BEGIN
  IF p_key IS NULL OR p_seconds IS NULL OR p_seconds <= 0 THEN
    RETURN false;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(k));

  SELECT max(window_start) INTO last_at
  FROM public.api_rate_limits
  WHERE key = k;

  IF last_at IS NOT NULL AND last_at > now() - make_interval(secs => p_seconds) THEN
    RETURN false;
  END IF;

  INSERT INTO public.api_rate_limits (key, window_start, hits)
  VALUES (k, now(), 1)
  ON CONFLICT (key, window_start) DO NOTHING;

  -- Older claims for this key are no longer needed.
  DELETE FROM public.api_rate_limits WHERE key = k AND window_start < now();

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_cooldown(TEXT, INTEGER) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_cooldown(TEXT, INTEGER) TO service_role;
