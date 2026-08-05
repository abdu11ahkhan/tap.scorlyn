-- =====================================================================
-- Admin access.
-- Run AFTER 003_card_images.sql
-- =====================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------
-- Helper. SECURITY DEFINER so it can read profiles without tripping the
-- table's own RLS, and marked STABLE so Postgres can cache it per statement.
--
-- Every admin policy below calls this instead of sub-querying profiles
-- directly: a policy on profiles that queries profiles recurses forever.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()),
    false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ---------------------------------------------------------------------
-- Read-everything policies for admins.
-- Deliberately SELECT-only: the console reports, it does not rewrite
-- people's cards. Suspension is the one write, handled separately below.
-- ---------------------------------------------------------------------
CREATE POLICY "Admins can view all profiles."
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can view all card profiles."
  ON public.card_profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can view all taps."
  ON public.card_taps FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can view all referral events."
  ON public.referral_events FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can view all nfc cards."
  ON public.nfc_cards FOR SELECT
  USING (public.is_admin());

-- Suspending a user unpublishes their card; that needs an UPDATE path.
CREATE POLICY "Admins can suspend accounts."
  ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can unpublish a card."
  ON public.card_profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- Make yourself an admin (run once, with your own email):
--
--   UPDATE public.profiles SET is_admin = true
--   WHERE email = 'you@example.com';
-- ---------------------------------------------------------------------
