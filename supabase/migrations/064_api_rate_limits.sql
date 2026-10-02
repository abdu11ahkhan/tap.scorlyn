-- =====================================================================
-- Rate limits for endpoints that cost money per call (the AI card scan).
--
-- Serverless functions share no memory, so the counter lives here. Only the
-- server (service role) can touch it: the table has RLS on and no policies,
-- and the function is not granted to anon/authenticated, so nobody can
-- inflate or reset someone else's count from the browser.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Counts one hit against `key` in the current window and says whether it is
-- still within `p_max`. Old windows are pruned as it goes.
CREATE OR REPLACE FUNCTION public.hit_rate_limit(p_key TEXT, p_window_seconds INTEGER, p_max INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w TIMESTAMPTZ := to_timestamp(floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds);
  n INTEGER;
BEGIN
  INSERT INTO public.api_rate_limits (key, window_start, hits)
  VALUES (p_key, w, 1)
  ON CONFLICT (key, window_start) DO UPDATE SET hits = api_rate_limits.hits + 1
  RETURNING hits INTO n;

  DELETE FROM public.api_rate_limits WHERE window_start < now() - interval '2 days';

  RETURN n <= p_max;
END;
$$;

REVOKE ALL ON FUNCTION public.hit_rate_limit(TEXT, INTEGER, INTEGER) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hit_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;
