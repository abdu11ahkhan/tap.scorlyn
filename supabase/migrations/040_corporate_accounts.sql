-- =====================================================================
-- Corporate accounts: a business signs up once and creates logins for
-- its employees, who get cards at /u/{company-slug}-{employee-slug}.
--
-- Deliberately reuses the existing single-segment /u/[username] route and
-- its whole uniqueness/lock machinery rather than inventing a second one:
-- an employee's card is an ordinary card_profiles row whose username
-- happens to be "{company_slug}-{something}", identified as staff only by
-- the new org_owner_id column. Nothing about how a card is served changes.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. What kind of account this is.
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'individual'
    CHECK (account_type IN ('individual', 'corporate'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_name TEXT;

-- The prefix every employee's handle inherits, e.g. "acme". Same charset as
-- card_profiles.username (see USERNAME_PATTERN in src/lib/card-draft.ts), but
-- capped much shorter: username tops out at 30 characters total and every
-- employee handle is "{company_slug}-{employee}", so a slug anywhere near
-- that cap on its own would leave no room for anyone's name. 21 leaves at
-- least 8 characters for the employee half. Mirrored in
-- COMPANY_SLUG_PATTERN / COMPANY_SLUG_MAX in src/lib/org.ts — keep both in
-- step if this ever changes.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_slug TEXT
    CHECK (company_slug ~ '^[a-z0-9][a-z0-9-]{1,20}$');

-- Partial: only corporate accounts have one, and NULL is never a collision.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_company_slug_key
  ON public.profiles (company_slug)
  WHERE company_slug IS NOT NULL;

-- ---------------------------------------------------------------------
-- 2. Which corporate account manages this card, if any.
--
-- NULL for every individual card and for a corporate owner's own personal
-- card — only set on cards created *for* an employee.
-- ---------------------------------------------------------------------
ALTER TABLE public.card_profiles
  ADD COLUMN IF NOT EXISTS org_owner_id UUID
    REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS card_profiles_org_owner_id_idx
  ON public.card_profiles (org_owner_id);

-- ---------------------------------------------------------------------
-- 3. Give a corporate owner exactly the reach over their own employees
--    that admin already has over everyone — same shapes, scoped down.
--
--    Reads and edits are plain RLS (mirrors "Admins can view all card
--    profiles." / the admin update+delete policies in 004_admin.sql and
--    023_admin_delete_card.sql). Account lifecycle (create the login,
--    suspend it) stays off RLS entirely and goes through a service-role
--    server action instead, same as admin's createCustomer/setSuspended —
--    profiles has no per-employee column-level protection, and a policy
--    permissive enough to flip `suspended` would just as easily let an
--    owner flip `is_admin` on their own employee's row.
-- ---------------------------------------------------------------------
CREATE POLICY "Corporate owners can view their employees' cards."
  ON public.card_profiles FOR SELECT
  USING (org_owner_id = auth.uid());

CREATE POLICY "Corporate owners can edit their employees' cards."
  ON public.card_profiles FOR UPDATE
  USING (org_owner_id = auth.uid())
  WITH CHECK (org_owner_id = auth.uid());

CREATE POLICY "Corporate owners can delete their employees' cards."
  ON public.card_profiles FOR DELETE
  USING (org_owner_id = auth.uid());

-- ---------------------------------------------------------------------
-- 4. Ownership itself is not something the edit policy above should be
--    able to move. WITH CHECK (org_owner_id = auth.uid()) alone still
--    lets an owner's UPDATE change *user_id* while leaving org_owner_id
--    untouched — silently reassigning an employee's card to themselves.
--    Locked the same way 032_admin_can_rename.sql locks username: any
--    authenticated, non-admin, non-service-role change to either
--    ownership column is rejected outright.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lock_card_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.user_id IS DISTINCT FROM OLD.user_id
      OR NEW.org_owner_id IS DISTINCT FROM OLD.org_owner_id)
     AND auth.uid() IS NOT NULL
     AND COALESCE(
           current_setting('request.jwt.claims', true)::jsonb ->> 'role',
           ''
         ) <> 'service_role'
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION
      'Card ownership cannot be changed from the dashboard.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS card_profiles_lock_ownership ON public.card_profiles;
CREATE TRIGGER card_profiles_lock_ownership
  BEFORE UPDATE ON public.card_profiles
  FOR EACH ROW EXECUTE FUNCTION public.lock_card_ownership();

-- ---------------------------------------------------------------------
-- 5. Company-slug availability, anonymous-callable — signup needs this
--    before any session exists, same reason username_available() (see
--    022_username_available.sql) is granted to anon.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.company_slug_available(candidate TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE company_slug = lower(trim(candidate))
  );
$$;

REVOKE ALL ON FUNCTION public.company_slug_available(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.company_slug_available(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------
-- 6. Carry the choice through from signup.
--
--    Widened rather than replaced: handle_new_user() previously read only
--    full_name (see supabase/SETUP_ALL.sql and 001_card_profiles_and_referrals.sql).
--    account_type defaults to 'individual' whenever the new keys are absent,
--    so Google OAuth and every signup path that doesn't know about this
--    yet keeps working exactly as before.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, email, referral_code,
    account_type, company_name, company_slug
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    public.generate_referral_code(),
    COALESCE(new.raw_user_meta_data->>'account_type', 'individual'),
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'company_slug'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
