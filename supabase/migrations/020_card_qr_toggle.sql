-- Whether the public card offers a QR code.
--
-- The card is handed over by tapping, but a QR covers the phones that will not
-- read a tag and the case where someone wants to show the card on screen for
-- another person to scan. On by default: it costs nothing until tapped, and a
-- card that cannot be shared any other way is the worse default.
alter table public.card_profiles
  add column if not exists show_qr boolean not null default true;

comment on column public.card_profiles.show_qr is
  'Shows the QR button on the public card. Owner-controlled from the editor.';
