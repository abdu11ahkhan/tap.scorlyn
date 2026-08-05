-- =====================================================================
-- Profile extras + the orders foundation.
-- Run AFTER 006_drop_website_builder.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Profile extras
-- ---------------------------------------------------------------------

-- "Available for work" badge.
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS available_for_work BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS availability_note TEXT;

-- Business hours. [{ "day": "Mon-Fri", "hours": "9am - 6pm" }, ...]
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '[]'::jsonb NOT NULL;

-- A single video to embed (YouTube / TikTok / Vimeo URL).
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Background treatment: 'accent' (default), 'image' (uses cover_url) or a
-- named gradient. Templates that own their background ignore this.
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS background_style TEXT NOT NULL DEFAULT 'accent';

-- Bank / payment details, shown only if the owner opts in.
--
-- These sit on a PUBLIC page, so this is deliberately opt-in and off by
-- default. Account numbers on a public profile are a real fraud surface:
-- anyone can screenshot them, and a scammer can clone the page with their
-- own number substituted. The UI says so plainly.
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS payment_enabled BOOLEAN NOT NULL DEFAULT false;
-- [{ "label": "Meezan Bank", "kind": "bank", "account_name": "...",
--    "account_number": "...", "iban": "..." }]
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[]'::jsonb NOT NULL;

-- ---------------------------------------------------------------------
-- 2. Profile view counter
--
-- card_taps already stores every visit, but counting rows on every page
-- load gets slower as it grows. This is a running total kept by trigger.
-- ---------------------------------------------------------------------
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.bump_view_count()
RETURNS trigger AS $$
BEGIN
  UPDATE public.card_profiles
  SET view_count = view_count + 1
  WHERE id = new.card_profile_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS card_taps_bump_view_count ON public.card_taps;
CREATE TRIGGER card_taps_bump_view_count
  AFTER INSERT ON public.card_taps
  FOR EACH ROW EXECUTE PROCEDURE public.bump_view_count();

-- Backfill from the taps already recorded.
UPDATE public.card_profiles cp
SET view_count = COALESCE(t.n, 0)
FROM (SELECT card_profile_id, COUNT(*) AS n FROM public.card_taps GROUP BY 1) t
WHERE t.card_profile_id = cp.id;

-- ---------------------------------------------------------------------
-- 3. Pricing, editable from the admin console
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_pkr INT NOT NULL DEFAULT 0,
  blurb TEXT,
  perks JSONB DEFAULT '[]'::jsonb NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0
);

INSERT INTO public.plans (id, name, price_pkr, blurb, perks, sort_order) VALUES
  ('basic',   'Digital only', 0,    'The card, hosted. No physical card.',
   '["1 digital card","All templates","Unlimited links","Tap counter"]'::jsonb, 0),
  ('printed', 'Card + setup', 1200, 'A printed NFC card, written and posted to you.',
   '["Everything in digital","Physical NFC card","We write and link it","Referral dashboard"]'::jsonb, 1),
  ('custom',  'Custom design', 2500, 'Your own artwork on the card.',
   '["Everything in Card + setup","Custom print artwork","Priority support"]'::jsonb, 2)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read plans." ON public.plans FOR SELECT USING (true);
CREATE POLICY "Admins manage plans." ON public.plans FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- 4. Orders
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Human-quotable reference. Sequence keeps them short and ordered.
  reference TEXT UNIQUE NOT NULL,

  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  card_profile_id UUID REFERENCES public.card_profiles(id) ON DELETE SET NULL,
  plan_id TEXT REFERENCES public.plans(id),

  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  amount_pkr INT NOT NULL DEFAULT 0,

  -- Delivery
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,

  -- pending → paid → printing → shipped → delivered, or cancelled
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','printing','shipped','delivered','cancelled')),

  -- Payment proof the customer uploads
  payment_proof_url TEXT,
  payment_verified_at TIMESTAMP WITH TIME ZONE,

  -- Admin-only
  internal_note TEXT,
  flagged BOOLEAN NOT NULL DEFAULT false,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  estimated_delivery DATE,
  card_design JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS orders_user_idx ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status, created_at DESC);

CREATE SEQUENCE IF NOT EXISTS public.order_reference_seq START 1001;

CREATE OR REPLACE FUNCTION public.set_order_reference()
RETURNS trigger AS $$
BEGIN
  IF new.reference IS NULL OR new.reference = '' THEN
    new.reference := 'TZ-' || nextval('public.order_reference_seq')::TEXT;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_set_reference ON public.orders;
CREATE TRIGGER orders_set_reference
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.set_order_reference();

DROP TRIGGER IF EXISTS orders_touch_updated_at ON public.orders;
CREATE TRIGGER orders_touch_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

-- Timeline. One row per status change, so the customer sees a real history
-- rather than just the current state.
CREATE TABLE IF NOT EXISTS public.order_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS order_events_order_idx ON public.order_events(order_id, created_at);

-- Record the opening state so the timeline is never empty.
CREATE OR REPLACE FUNCTION public.log_order_status()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_events (order_id, status, note)
    VALUES (new.id, new.status, 'Order placed');
  ELSIF new.status IS DISTINCT FROM old.status THEN
    INSERT INTO public.order_events (order_id, status)
    VALUES (new.id, new.status);
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS orders_log_status ON public.orders;
CREATE TRIGGER orders_log_status
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.log_order_status();

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers see their own orders."
  ON public.orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Customers place their own orders."
  ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Deliberately not an UPDATE policy for customers: status, amount and the
-- verification flag are the shop's to set, not the buyer's. Attaching a
-- payment proof goes through a Server Action instead.
CREATE POLICY "Admins see every order."
  ON public.orders FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins manage orders."
  ON public.orders FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Customers see their own order history."
  ON public.order_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

CREATE POLICY "Admins see all order history."
  ON public.order_events FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins add order history."
  ON public.order_events FOR INSERT WITH CHECK (public.is_admin());
