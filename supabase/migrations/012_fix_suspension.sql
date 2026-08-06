-- ---------------------------------------------------------------------
-- 012 - Make suspension actually suspend.
--
-- The public read policy on card_profiles excluded suspended owners like this:
--
--   published = true
--   AND NOT EXISTS (SELECT 1 FROM profiles p
--                   WHERE p.id = card_profiles.user_id AND p.suspended)
--
-- which reads correctly and does nothing. A policy's subquery runs with the
-- *caller's* permissions, and anonymous visitors have no SELECT policy on
-- profiles — so the subquery returned no rows for everyone, NOT EXISTS was
-- always true, and every suspended card stayed public. Suspending an account
-- appeared to work in the console and changed nothing on the internet.
--
-- Same trap as card_profiles.referral_code: anything a public policy needs to
-- know has to live on the row the public can actually read. So suspension is
-- mirrored onto card_profiles and the policy checks the local column.
-- ---------------------------------------------------------------------

ALTER TABLE public.card_profiles
  ADD COLUMN IF NOT EXISTS owner_suspended BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.card_profiles.owner_suspended IS
  'Mirror of profiles.suspended. Denormalised because RLS on the public read path cannot see profiles.';

-- Backfill.
UPDATE public.card_profiles c
SET owner_suspended = p.suspended
FROM public.profiles p
WHERE p.id = c.user_id AND c.owner_suspended IS DISTINCT FROM p.suspended;

-- Keep it in step when an admin suspends or restores someone.
CREATE OR REPLACE FUNCTION public.sync_card_suspension()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.card_profiles
  SET owner_suspended = NEW.suspended
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_sync_suspension ON public.profiles;
CREATE TRIGGER profiles_sync_suspension
  AFTER UPDATE OF suspended ON public.profiles
  FOR EACH ROW
  WHEN (OLD.suspended IS DISTINCT FROM NEW.suspended)
  EXECUTE FUNCTION public.sync_card_suspension();

-- And when a card is created by an already-suspended owner.
CREATE OR REPLACE FUNCTION public.set_card_suspension()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT COALESCE(p.suspended, false) INTO NEW.owner_suspended
  FROM public.profiles p
  WHERE p.id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS card_profiles_set_suspension ON public.card_profiles;
CREATE TRIGGER card_profiles_set_suspension
  BEFORE INSERT ON public.card_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_card_suspension();

-- The policy, now reading a column the public can actually see.
DROP POLICY IF EXISTS "Anyone can view a published card profile." ON public.card_profiles;
CREATE POLICY "Anyone can view a published card profile."
  ON public.card_profiles FOR SELECT
  USING (published = true AND owner_suspended = false);
