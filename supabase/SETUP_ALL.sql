-- ====================================================================
-- ScorlynTap — complete database setup.
--
-- Paste this whole file into the Supabase SQL Editor and run it once.
-- It is the five migration files concatenated in dependency order.
-- Safe to run on a brand-new project only.
-- ====================================================================


-- --------------------------------------------------------------------
-- schema.sql
-- Base schema: profiles, websites, assets, nfc_cards + RLS
-- --------------------------------------------------------------------
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  subscription_plan TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create websites table
CREATE TABLE public.websites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  template_name TEXT NOT NULL,
  slug TEXT UNIQUE,
  content_json JSONB DEFAULT '{}'::jsonb NOT NULL,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create assets table
CREATE TABLE public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create nfc_cards table
CREATE TABLE public.nfc_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  website_id UUID REFERENCES public.websites(id) ON DELETE SET NULL,
  card_url TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- WEBSITES
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own websites." ON public.websites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own websites." ON public.websites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own websites." ON public.websites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own websites." ON public.websites FOR DELETE USING (auth.uid() = user_id);
-- Allow public viewing of published websites
CREATE POLICY "Public can view published websites." ON public.websites FOR SELECT USING (published = true);

-- ASSETS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own assets." ON public.assets FOR ALL USING (auth.uid() = user_id);

-- NFC CARDS
ALTER TABLE public.nfc_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own NFC cards." ON public.nfc_cards FOR ALL USING (auth.uid() = user_id);

-- Trigger for creating a profile automatically when a user signs up via auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- --------------------------------------------------------------------
-- 001_card_profiles_and_referrals.sql
-- Card profiles, taps, referral events, referral codes
-- --------------------------------------------------------------------
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


-- --------------------------------------------------------------------
-- 002_card_templates.sql
-- Template, buttons, font
-- --------------------------------------------------------------------
-- =====================================================================
-- Carrd-style templates for card profiles
-- Run AFTER 001_card_profiles_and_referrals.sql
-- =====================================================================

-- Which visual template the card renders with.
ALTER TABLE public.card_profiles
  ADD COLUMN IF NOT EXISTS template TEXT NOT NULL DEFAULT 'minimal';

-- Buttons are now first-class and ordered, rather than contact fields being
-- hardcoded above a list of "links". Each entry:
--   { "label": "WhatsApp", "kind": "whatsapp", "value": "923001234567" }
--   { "label": "Portfolio", "kind": "link",     "value": "https://..." }
-- kind ∈ link | whatsapp | phone | email | instagram | linkedin | x | github
ALTER TABLE public.card_profiles
  ADD COLUMN IF NOT EXISTS buttons JSONB DEFAULT '[]'::jsonb NOT NULL;

-- Carry existing `links` over into the new buttons array so nothing is lost.
UPDATE public.card_profiles
SET buttons = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'label', COALESCE(link->>'label', 'Link'),
        'kind', 'link',
        'value', link->>'url'
      )
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(card_profiles.links) AS link
  WHERE link->>'url' IS NOT NULL
)
WHERE jsonb_array_length(COALESCE(links, '[]'::jsonb)) > 0
  AND jsonb_array_length(buttons) = 0;

-- Prepend the contact fields as buttons, so they keep showing up.
UPDATE public.card_profiles
SET buttons = (
  CASE WHEN whatsapp IS NOT NULL AND whatsapp <> ''
    THEN jsonb_build_array(jsonb_build_object('label', 'WhatsApp', 'kind', 'whatsapp', 'value', whatsapp))
    ELSE '[]'::jsonb END
  ||
  CASE WHEN phone IS NOT NULL AND phone <> ''
    THEN jsonb_build_array(jsonb_build_object('label', 'Call', 'kind', 'phone', 'value', phone))
    ELSE '[]'::jsonb END
  ||
  CASE WHEN email IS NOT NULL AND email <> ''
    THEN jsonb_build_array(jsonb_build_object('label', 'Email', 'kind', 'email', 'value', email))
    ELSE '[]'::jsonb END
  || buttons
)
WHERE (whatsapp IS NOT NULL AND whatsapp <> '')
   OR (phone IS NOT NULL AND phone <> '')
   OR (email IS NOT NULL AND email <> '');

-- A secondary font choice, Carrd-style: templates pair one display face with
-- one body face, and this picks the display side.
ALTER TABLE public.card_profiles
  ADD COLUMN IF NOT EXISTS font TEXT NOT NULL DEFAULT 'sans';


-- --------------------------------------------------------------------
-- 003_card_images.sql
-- Cover image, cover mode, gallery
-- --------------------------------------------------------------------
-- =====================================================================
-- Photos on cards: a background/cover image and a small gallery.
-- Run AFTER 002_card_templates.sql
-- =====================================================================

-- Full-bleed background / hero image. Templates that have a cover area use
-- this; the rest ignore it, so it is safe to set on any template.
ALTER TABLE public.card_profiles
  ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- How the cover is treated where a template supports both:
--   'cover'  – fills the hero area
--   'tint'   – sits behind the whole page, dimmed, as a backdrop
ALTER TABLE public.card_profiles
  ADD COLUMN IF NOT EXISTS cover_mode TEXT NOT NULL DEFAULT 'cover'
  CHECK (cover_mode IN ('cover', 'tint'));

-- Portfolio work. [{ "url": "https://...", "caption": "Project", "href": "" }]
ALTER TABLE public.card_profiles
  ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb NOT NULL;


-- --------------------------------------------------------------------
-- 004_admin.sql
-- Admin flag + admin RLS policies
-- --------------------------------------------------------------------
-- =====================================================================
-- Admin access.
-- Run AFTER 003_card_images.sql
-- =====================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------
-- Helper. SECURITY DEFINER so it can read profiles without tripping the
-- table's own RLS, and marked STABLE so Postgres can cache it per statement.
--
-- Every admin policy below calls this instead of sub-querying profiles
-- directly: a policy on profiles that queries profiles recurses forever.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()),
    false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ---------------------------------------------------------------------
-- Read-everything policies for admins.
-- Deliberately SELECT-only: the console reports, it does not rewrite
-- people's cards. Suspension is the one write, handled separately below.
-- ---------------------------------------------------------------------
CREATE POLICY "Admins can view all profiles."
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can view all card profiles."
  ON public.card_profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can view all taps."
  ON public.card_taps FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can view all referral events."
  ON public.referral_events FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can view all nfc cards."
  ON public.nfc_cards FOR SELECT
  USING (public.is_admin());

-- Suspending a user unpublishes their card; that needs an UPDATE path.
CREATE POLICY "Admins can suspend accounts."
  ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can unpublish a card."
  ON public.card_profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- Make yourself an admin (run once, with your own email):
--
--   UPDATE public.profiles SET is_admin = true
--   WHERE email = 'you@example.com';
-- ---------------------------------------------------------------------
