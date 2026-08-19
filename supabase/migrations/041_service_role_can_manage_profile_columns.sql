-- =====================================================================
-- 041 - protect_profile_columns() (014) never exempted service_role.
--
-- Found empirically while testing the corporate-accounts feature: a raw
-- service-role PATCH to profiles.suspended returned 200/204 and silently did
-- nothing. Reproduced outside any application code with a bare REST call —
-- this is not specific to suspendEmployee() or any client library.
--
-- 014's trigger blocks everyone who is not public.is_admin() from touching
-- id/is_admin/suspended/referral_code, "silently, because raising here would
-- break the ordinary profile save, which sends the whole row." That is
-- correct for a normal signed-in user (auth.uid() = their own id, is_admin()
-- false) and correct for the admin console (auth.uid() = the admin's id,
-- is_admin() true) — but a service-role request has no auth.uid() at all,
-- so is_admin() evaluates false for it too, and it fell into the same bucket
-- as an ordinary user being blocked from escalating themselves.
--
-- 032_admin_can_rename.sql and card_profiles_lock_ownership (this feature's
-- own 040_corporate_accounts.sql) both already carry this exact exemption for
-- exactly this reason — service-role already bypasses RLS on every table in
-- this schema, so exempting it here does not widen what a service-role
-- request can already do; it just makes this trigger consistent with the two
-- that were written after it.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin()
     OR coalesce(
          current_setting('request.jwt.claims', true)::jsonb ->> 'role',
          ''
        ) = 'service_role'
  THEN
    RETURN NEW;
  END IF;

  NEW.id := OLD.id;
  NEW.is_admin := OLD.is_admin;
  NEW.suspended := OLD.suspended;
  NEW.referral_code := OLD.referral_code;

  RETURN NEW;
END;
$$;
