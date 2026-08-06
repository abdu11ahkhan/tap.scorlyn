-- ---------------------------------------------------------------------
-- 013 - The shop's own bank accounts, and editable site copy.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- 1. Where customers send money
--
-- Orders are paid by transfer and confirmed by hand, but the account to pay
-- into was placeholder text in a component — so nobody could actually pay.
-- These are the shop's accounts, not a customer's, which is why they live in
-- their own table rather than on a profile.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shop_payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'bank'
    CHECK (kind IN ('bank', 'easypaisa', 'jazzcash', 'other')),
  account_name TEXT,
  account_number TEXT,
  iban TEXT,
  note TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.shop_payment_methods ENABLE ROW LEVEL SECURITY;

-- Readable by signed-in customers only: these appear on the order page, and
-- there's no reason to publish them to anonymous crawlers.
DROP POLICY IF EXISTS "Signed-in users read enabled payment methods." ON public.shop_payment_methods;
CREATE POLICY "Signed-in users read enabled payment methods."
  ON public.shop_payment_methods FOR SELECT
  TO authenticated
  USING (enabled = true);

DROP POLICY IF EXISTS "Admins manage payment methods." ON public.shop_payment_methods;
CREATE POLICY "Admins manage payment methods."
  ON public.shop_payment_methods FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- 2. Site copy
--
-- The landing page headline, subheading and a few other strings, so they can
-- be changed without a deploy. Kept on app_settings rather than a key/value
-- table: there is exactly one site, and a single row keeps reads to one query.
-- NULL means "use what's compiled in", so an empty field can't blank the page.
-- ---------------------------------------------------------------------
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS hero_title TEXT,
  ADD COLUMN IF NOT EXISTS hero_subtitle TEXT,
  ADD COLUMN IF NOT EXISTS pricing_note TEXT,
  ADD COLUMN IF NOT EXISTS support_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS support_email TEXT;

COMMENT ON COLUMN public.app_settings.hero_title IS
  'Landing headline. NULL falls back to the compiled-in copy.';
