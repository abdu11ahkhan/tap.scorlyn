-- ---------------------------------------------------------------------
-- 014 - Stop users granting themselves admin.
--
-- "Users can update their own profile." was USING (auth.uid() = id) with no
-- WITH CHECK and no column restriction. RLS in Postgres gates *rows*, not
-- columns, so that policy let an account edit every column of its own row —
-- including is_admin and suspended.
--
-- The browser holds the anon key and the user's session, so this was directly
-- reachable: one supabase.from('profiles').update({ is_admin: true }) from a
-- console and that account owns the admin console, every order and every
-- customer's details. A suspended user could also simply un-suspend itself.
--
-- Confirmed against the live database before fixing: as a normal, suspended
-- account, "update profiles set is_admin = true where id = auth.uid()"
-- returned is_admin = true.
--
-- A trigger rather than a cleverer policy: WITH CHECK can only see the new
-- row, so comparing against the stored value means a subquery back into
-- profiles — which is itself subject to RLS and recurses. A BEFORE UPDATE
-- trigger sees OLD and NEW directly and runs whatever the policy allowed.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins manage these through the console, which runs as an admin session.
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Anything the account holder must not set for themselves is pinned back to
  -- what it already was, silently. Raising here would break the ordinary
  -- profile save, which sends the whole row.
  NEW.id := OLD.id;
  NEW.is_admin := OLD.is_admin;
  NEW.suspended := OLD.suspended;
  NEW.referral_code := OLD.referral_code;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_columns ON public.profiles;
CREATE TRIGGER profiles_protect_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

-- Belt and braces: the row you write must still be your own row.
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
