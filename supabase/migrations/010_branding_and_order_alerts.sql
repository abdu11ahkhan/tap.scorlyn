-- ---------------------------------------------------------------------
-- 010 — Card branding option, and telling the admin an order arrived.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- 1. Branding choice on an order
--
-- A card carries a small Tapzar mark by default; paying removes it. The
-- surcharge lives in app_settings so it can be changed without a deploy,
-- and the amount charged is still computed server-side from that value —
-- never from the form.
-- ---------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS branding TEXT NOT NULL DEFAULT 'branded'
    CHECK (branding IN ('branded', 'unbranded'));

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS unbranded_surcharge_pkr INT NOT NULL DEFAULT 300
    CHECK (unbranded_surcharge_pkr >= 0);

COMMENT ON COLUMN public.orders.branding IS
  'branded = small Tapzar mark on the card back (included). unbranded = customer artwork only, costs unbranded_surcharge_pkr per card.';

-- ---------------------------------------------------------------------
-- 2. New-order alerts for the admin console
--
-- No email provider is wired up yet, so the signal is in-app: an order is
-- unseen until an admin opens it. A nullable timestamp rather than a
-- boolean, because "when did we notice" is worth keeping.
-- ---------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS admin_seen_at TIMESTAMP WITH TIME ZONE;

-- Partial index: the badge only ever counts the unseen ones, and that set
-- stays small while the table grows.
CREATE INDEX IF NOT EXISTS orders_unseen_idx
  ON public.orders (created_at DESC)
  WHERE admin_seen_at IS NULL;

-- ---------------------------------------------------------------------
-- 3. Outbound notification queue
--
-- Rows are written by a trigger when an order lands, so the record of "we
-- owe this person an email" exists even though nothing sends yet. Once a
-- provider is configured it drains this table; until then it is the
-- admin's unread list and nothing is lost in the meantime.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('order_placed', 'order_status')),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  -- Denormalised so the queue still reads correctly if the order is deleted.
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS notifications_unsent_idx
  ON public.notifications (created_at)
  WHERE sent_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Admin-only. Customers have no business reading the outbound queue.
CREATE POLICY "Admins read notifications."
  ON public.notifications FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins manage notifications."
  ON public.notifications FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- 4. Queue a notification whenever an order is created
--
-- SECURITY DEFINER because the customer placing the order cannot insert
-- into notifications under RLS — and shouldn't be able to.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.queue_order_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (kind, order_id, subject, body)
  VALUES (
    'order_placed',
    NEW.id,
    'New order ' || NEW.reference || ' - Rs. ' || NEW.amount_pkr,
    NEW.full_name || ' (' || NEW.phone || ') ordered ' || NEW.quantity ||
      ' x ' || COALESCE(NEW.plan_id, 'unknown plan') ||
      ', ' || NEW.branding ||
      '. Deliver to: ' || NEW.address || ', ' || NEW.city || '.'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_created ON public.orders;
CREATE TRIGGER on_order_created
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.queue_order_notification();
