-- ---------------------------------------------------------------------
-- 015 - Price orders in the database, not in the form.
--
-- placeOrder() reads the price from `plans` and never trusts the browser,
-- which is right — but the Server Action is not the only way in. The client
-- holds the anon key and its own session, and the RLS policy on orders is
-- "you may insert a row where user_id = auth.uid()". Nothing said what the
-- other columns had to be.
--
-- Confirmed against the live database: as a normal account,
--
--   insert into orders (user_id, plan_id, quantity, amount_pkr, ...)
--   values (auth.uid(), 'custom', 99, 1, ...)
--
-- was accepted — the Rs.2,200 plan, ninety-nine of them, for one rupee. It
-- also walked past the 1-50 quantity clamp the action applies.
--
-- So the rules move to where they cannot be walked around. The action keeps
-- its copy for the error messages; this is the backstop that decides.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.price_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_price INT;
  plan_enabled BOOLEAN;
  has_card BOOLEAN;
BEGIN
  -- Admins adjust orders through the console; only guard what customers send.
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  SELECT price_pkr, enabled INTO plan_price, plan_enabled
  FROM public.plans WHERE id = NEW.plan_id;

  IF plan_price IS NULL OR NOT plan_enabled THEN
    RAISE EXCEPTION 'That plan is not available.';
  END IF;

  -- One to fifty. Fifty is already generous for a hand-posted product.
  NEW.quantity := LEAST(GREATEST(COALESCE(NEW.quantity, 1), 1), 50);

  -- The price is whatever the plans table says today, times the quantity.
  NEW.amount_pkr := plan_price * NEW.quantity;

  -- A printed card is a chip holding a link to a page. With no page there is
  -- nothing to write onto it and nothing an admin can assign it to.
  IF plan_price > 0 THEN
    SELECT EXISTS (
      SELECT 1 FROM public.card_profiles
      WHERE user_id = NEW.user_id AND username IS NOT NULL
    ) INTO has_card;

    IF NOT has_card THEN
      RAISE EXCEPTION 'Make your card first - a printed card has to point at one.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_price ON public.orders;
CREATE TRIGGER orders_price
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.price_order();
