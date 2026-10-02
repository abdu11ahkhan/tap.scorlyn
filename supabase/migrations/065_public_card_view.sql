-- =====================================================================
-- Public card data, without the private columns.
--
-- RLS is per row, so "anyone can read a published card" exposed every column
-- of every published card through the public API — payment accounts the
-- owner had switched off, payment-proof file paths, approval references, the
-- login email of cards set up by an admin. This adds the replacement:
--
--   public_card_profiles  -> a view with only what a card page shows.
--                            Payment accounts only when the owner shows them;
--                            phone/email/WhatsApp only when the card has a
--                            matching button. No approval, artwork or owner ids.
--   is_live_card()        -> what the tap-insert policy checks instead of
--                            reading card_profiles itself
--   referrer_for_code()   -> the one owner id the referral route needs
--
-- Additive on purpose: the old public policy is removed separately (066)
-- after the code that reads this view is deployed, so the site never has a
-- window where cards can't be read.
-- =====================================================================

CREATE OR REPLACE VIEW public.public_card_profiles
WITH (security_invoker = false) AS
SELECT
  cp.id,
  cp.username,
  cp.full_name,
  cp.headline,
  cp.company,
  cp.bio,
  cp.avatar_url,
  cp.cover_url,
  cp.cover_mode,
  cp.logo_url,
  cp.location,
  CASE WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(cp.buttons, '[]'::jsonb)) b WHERE b ->> 'kind' = 'whatsapp')
       THEN cp.whatsapp END AS whatsapp,
  CASE WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(cp.buttons, '[]'::jsonb)) b WHERE b ->> 'kind' = 'phone')
       THEN cp.phone END AS phone,
  CASE WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(cp.buttons, '[]'::jsonb)) b WHERE b ->> 'kind' = 'email')
       THEN cp.email END AS email,
  cp.accent_color,
  cp.surface_color,
  cp.background_style,
  cp.background_gradient,
  cp.background_effect,
  cp.intro_style,
  cp.button_style,
  cp.template,
  cp.font,
  cp.buttons,
  cp.gallery,
  cp.available_for_work,
  cp.availability_note,
  cp.business_hours,
  cp.video_url,
  cp.payment_enabled,
  CASE WHEN cp.payment_enabled THEN cp.payment_methods ELSE '[]'::jsonb END AS payment_methods,
  cp.show_qr,
  cp.view_count,
  cp.referral_code,
  cp.is_single_purpose,
  cp.review_config,
  cp.published,
  cp.created_at,
  cp.updated_at
FROM public.card_profiles cp
WHERE cp.published = true AND cp.owner_suspended = false;

GRANT SELECT ON public.public_card_profiles TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_live_card(p_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.card_profiles
    WHERE id = p_id AND published = true AND owner_suspended = false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_live_card(UUID) TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can record a tap on a published card." ON public.card_taps;
CREATE POLICY "Anyone can record a tap on a published card."
  ON public.card_taps FOR INSERT
  WITH CHECK (public.is_live_card(card_profile_id));

CREATE OR REPLACE FUNCTION public.referrer_for_code(p_code TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.card_profiles
  WHERE referral_code = p_code AND published = true AND owner_suspended = false
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.referrer_for_code(TEXT) TO anon, authenticated;
