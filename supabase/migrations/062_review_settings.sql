-- =====================================================================
-- Review Card delivery settings + a private feedback link.
--
-- Kept out of card_profiles on purpose: published card_profiles rows are
-- readable by anyone (RLS is per row, not per column), so a share token or a
-- notification address stored there would be public. This table is admin
-- managed; a card's owner can read their own row.
--
--   share_token      -> /feedback/<token>: a no-login page showing that
--                       business its ratings and feedback. Resettable.
--   notify_email     -> every new feedback is emailed here.
--   notify_whatsapp  -> saved now; sending starts once a WhatsApp Business
--                       API account is connected.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.review_settings (
  card_profile_id UUID PRIMARY KEY REFERENCES public.card_profiles(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE
    DEFAULT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  notify_email TEXT CHECK (notify_email IS NULL OR char_length(notify_email) <= 200),
  notify_whatsapp TEXT CHECK (notify_whatsapp IS NULL OR char_length(notify_whatsapp) <= 30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.review_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage review settings." ON public.review_settings;
CREATE POLICY "Admins can manage review settings."
  ON public.review_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Owners can view their review settings." ON public.review_settings;
CREATE POLICY "Owners can view their review settings."
  ON public.review_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.card_profiles cp
      WHERE cp.id = review_settings.card_profile_id
        AND (cp.user_id = auth.uid() OR cp.org_owner_id = auth.uid())
    )
  );

-- Everything the private feedback page shows, for exactly one token.
-- Returns NULL for an unknown token, so a wrong link reveals nothing.
CREATE OR REPLACE FUNCTION public.review_feedback_by_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile UUID;
  result JSONB;
BEGIN
  IF p_token IS NULL OR char_length(p_token) < 32 THEN
    RETURN NULL;
  END IF;

  SELECT card_profile_id INTO v_profile FROM public.review_settings WHERE share_token = p_token;
  IF v_profile IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'business', jsonb_build_object(
      'full_name', cp.full_name,
      'username', cp.username,
      'logo_url', COALESCE(cp.logo_url, cp.avatar_url),
      'accent_color', cp.accent_color
    ),
    'ratings', (
      SELECT COALESCE(jsonb_object_agg(target, n), '{}'::jsonb)
      FROM (
        SELECT t.target, count(*) AS n
        FROM public.card_taps t
        WHERE t.card_profile_id = v_profile AND t.event_type = 'rating'
          AND t.target IN ('1', '2', '3', '4', '5')
        GROUP BY t.target
      ) r
    ),
    'google_clicks', (
      SELECT count(*) FROM public.card_taps t
      WHERE t.card_profile_id = v_profile AND t.event_type = 'review_click'
    ),
    'feedback', (
      SELECT COALESCE(jsonb_agg(f ORDER BY f.created_at DESC), '[]'::jsonb)
      FROM (
        SELECT rf.id, rf.rating, rf.category, rf.message, rf.contact_name,
               rf.contact_phone, rf.contact_email, rf.created_at,
               nc.serial AS card_serial, nc.nickname AS card_nickname, nc.location AS card_location
        FROM public.review_feedback rf
        LEFT JOIN public.nfc_cards nc ON nc.id = rf.nfc_card_id
        WHERE rf.card_profile_id = v_profile
        ORDER BY rf.created_at DESC
        LIMIT 200
      ) f
    )
  ) INTO result
  FROM public.card_profiles cp
  WHERE cp.id = v_profile;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.review_feedback_by_token(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.review_feedback_by_token(TEXT) TO anon, authenticated;
