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
