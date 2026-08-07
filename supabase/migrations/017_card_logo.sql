-- A company logo, separate from the personal avatar.
--
-- The avatar is the person; a lot of cards are handed over on behalf of a
-- business that has its own mark. Kept as its own column rather than reusing
-- cover_url, because a logo is drawn small and transparent over the card while
-- a cover is a photograph behind the header.
alter table public.card_profiles
  add column if not exists logo_url text;

comment on column public.card_profiles.logo_url is
  'Optional company logo, shown as a small watermark on the card. Distinct from avatar_url, which is the person.';
