-- =====================================================================
-- NFC digital business cards + viral referral loop
-- Run this AFTER supabase/schema.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Referral codes on profiles
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Short, URL-safe, case-insensitive-ish code. Collisions are avoided by the
-- UNIQUE constraint + retry loop in the generator below.
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  alphabet TEXT := 'abcdefghijkmnpqrstuvwxyz23456789'; -- no l/o/0/1, easier to read aloud
  candidate TEXT;
  i INT;
BEGIN
  LOOP
    candidate := '';
    FOR i IN 1..7 LOOP
      candidate := candidate || substr(alphabet, floor(random() * length(alphabet) + 1)::INT, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = candidate);
  END LOOP;
  RETURN candidate;
END;
$$ LANGUAGE plpgsql;

-- Backfill existing users
UPDATE public.profiles
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL;

-- ---------------------------------------------------------------------
-- 2. card_profiles — the thing an NFC tap actually opens
--    Deliberately separate from `websites`: this is a fast, single-screen
--    contact card, not a full portfolio site.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.card_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  username TEXT UNIQUE NOT NULL
    CHECK (username ~ '^[a-z0-9][a-z0-9_-]{2,29}$'),

  full_name TEXT NOT NULL,
  headline TEXT,
  company TEXT,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,

  -- WhatsApp-first: this is the primary CTA on the card.
  -- Stored in E.164 without the '+' (e.g. 923001234567) for wa.me links.
  whatsapp TEXT,
  phone TEXT,
  email TEXT,

  -- [{ "label": "LinkedIn", "url": "https://...", "icon": "linkedin" }, ...]
  links JSONB DEFAULT '[]'::jsonb NOT NULL,

  accent_color TEXT DEFAULT '#22D3EE',
  published BOOLEAN DEFAULT true NOT NULL,

  -- Mirror of the owner's profiles.referral_code.
  -- Denormalized on purpose: `profiles` is only readable by its own owner, so
  -- an anonymous visitor tapping this card could never resolve the code there.
  -- Kept in sync by sync_card_referral_code() below.
  referral_code TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS card_profiles_user_id_idx ON public.card_profiles(user_id);

-- Let a physical card point at a card_profile (previously only at a website)
ALTER TABLE public.nfc_cards
  ADD COLUMN IF NOT EXISTS card_profile_id UUID
  REFERENCES public.card_profiles(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- 3. card_taps — every time someone opens a card
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.card_taps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_profile_id UUID REFERENCES public.card_profiles(id) ON DELETE CASCADE NOT NULL,
  nfc_card_id UUID REFERENCES public.nfc_cards(id) ON DELETE SET NULL,

  -- how the visitor arrived
  source TEXT NOT NULL DEFAULT 'link' CHECK (source IN ('nfc', 'qr', 'link')),
  referrer TEXT,
  user_agent TEXT,

  -- salted hash of ip+ua+day. Lets us count uniques without storing IPs.
  visitor_hash TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS card_taps_profile_created_idx
  ON public.card_taps(card_profile_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 4. referral_events — the viral loop funnel
--    banner_view -> banner_click -> signup -> order
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referral_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ref_code TEXT NOT NULL,
  card_profile_id UUID REFERENCES public.card_profiles(id) ON DELETE SET NULL,

  event_type TEXT NOT NULL
    CHECK (event_type IN ('banner_view', 'banner_click', 'signup', 'order')),

  -- set once the referred visitor actually becomes a user
  referred_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  visitor_hash TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS referral_events_referrer_idx
  ON public.referral_events(referrer_user_id, created_at DESC);

-- A given referred user should only ever count as one signup conversion.
CREATE UNIQUE INDEX IF NOT EXISTS referral_events_unique_signup
  ON public.referral_events(referred_user_id)
  WHERE event_type = 'signup';

-- ---------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------

-- CARD PROFILES
ALTER TABLE public.card_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their own card profiles."
  ON public.card_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- The whole point: anyone who taps the card can read it.
CREATE POLICY "Anyone can view a published card profile."
  ON public.card_profiles FOR SELECT
  USING (published = true);

-- CARD TAPS
ALTER TABLE public.card_taps ENABLE ROW LEVEL SECURITY;

-- Anonymous visitors must be able to record their own tap. They can never
-- read taps back, so this only exposes write-only append.
CREATE POLICY "Anyone can record a tap on a published card."
  ON public.card_taps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.card_profiles cp
      WHERE cp.id = card_profile_id AND cp.published = true
    )
  );

CREATE POLICY "Owners can read taps on their own cards."
  ON public.card_taps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.card_profiles cp
      WHERE cp.id = card_taps.card_profile_id AND cp.user_id = auth.uid()
    )
  );

-- REFERRAL EVENTS
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a referral event."
  ON public.referral_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Referrers can read their own referral events."
  ON public.referral_events FOR SELECT
  USING (auth.uid() = referrer_user_id);

-- ---------------------------------------------------------------------
-- 6. Give every new signup a referral code automatically
--    (replaces the handle_new_user() from schema.sql)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, referral_code)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    public.generate_referral_code()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- 7. keep updated_at honest on card_profiles
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at := timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS card_profiles_touch_updated_at ON public.card_profiles;
CREATE TRIGGER card_profiles_touch_updated_at
  BEFORE UPDATE ON public.card_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 8. Keep card_profiles.referral_code mirroring the owner's code
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_card_referral_code()
RETURNS trigger AS $$
BEGIN
  SELECT referral_code INTO new.referral_code
  FROM public.profiles
  WHERE id = new.user_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS card_profiles_sync_referral_code ON public.card_profiles;
CREATE TRIGGER card_profiles_sync_referral_code
  BEFORE INSERT OR UPDATE OF user_id ON public.card_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.sync_card_referral_code();

-- Backfill any rows created before this trigger existed
UPDATE public.card_profiles cp
SET referral_code = p.referral_code
FROM public.profiles p
WHERE p.id = cp.user_id AND cp.referral_code IS DISTINCT FROM p.referral_code;
