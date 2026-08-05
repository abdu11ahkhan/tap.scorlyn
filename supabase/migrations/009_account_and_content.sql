-- =====================================================================
-- Account controls, notification preferences, FAQ and maintenance mode.
-- Run AFTER 008_order_storage_policies.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- Notification preferences + a number to reach people on.
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_email BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_whatsapp BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;

-- ---------------------------------------------------------------------
-- Username changes.
--
-- Changing a handle breaks every printed card pointing at /u/<old>, so it
-- is allowed exactly once and the timestamp records that it was used.
-- ---------------------------------------------------------------------
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMP WITH TIME ZONE;

-- Custom background for templates that honour it.
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS background_gradient TEXT;

-- ---------------------------------------------------------------------
-- Maintenance mode
-- ---------------------------------------------------------------------
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS maintenance_message TEXT;

-- ---------------------------------------------------------------------
-- FAQ
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published FAQs."
  ON public.faqs FOR SELECT USING (published = true OR public.is_admin());

CREATE POLICY "Admins manage FAQs."
  ON public.faqs FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.faqs (question, answer, sort_order) VALUES
  ('Do people need an app to read my card?',
   'No. Tapping an NFC card opens the link in the phone''s browser. There is a QR code on the card as a fallback for older phones.', 0),
  ('Can I change my card design after it is printed?',
   'Yes. The chip stores a link, not your details, so you can change template, colours and links whenever you like and the same card keeps working.', 1),
  ('How long does delivery take?',
   'Usually 3 to 5 working days once payment is confirmed.', 2)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- Account deletion.
--
-- Runs as the definer so a signed-in user can remove their own auth row;
-- the ON DELETE CASCADE from profiles clears their card, taps and orders.
-- Guarded so it can only ever delete the caller.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in.';
  END IF;

  DELETE FROM auth.users WHERE id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.delete_own_account() FROM public;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
