-- The NFC card design a person chose, kept on their profile.
--
-- Until now the chosen finish only existed on an order. That meant nobody knew
-- what to print for someone who had published a card but not yet ordered, and
-- the choice had to be made again from scratch at order time. Asking once, at
-- publish, and keeping the answer on the profile means admin can see and print
-- what a customer wants without waiting for an order to carry it.

alter table public.card_profiles
  add column if not exists nfc_finish text,
  -- Which fields to print (phone, email, avatar, QR...). Shape matches
  -- CardFields; kept as jsonb so adding a printable field needs no migration.
  add column if not exists nfc_fields jsonb,
  add column if not exists nfc_chosen_at timestamptz;

-- Only the finishes the art can actually render. A typo here becomes a card
-- that silently falls back to "minimal" at the printer, which nobody notices
-- until the box arrives.
alter table public.card_profiles
  drop constraint if exists card_profiles_nfc_finish_check;
alter table public.card_profiles
  add constraint card_profiles_nfc_finish_check
  check (
    nfc_finish is null or nfc_finish in (
      'minimal','bold','gradient','midnight','sticker','split','frame','mono',
      'luxe','executive','ivory','steel','holo','tag','pixel'
    )
  );

-- Admin lists "who has chosen a design and is waiting to be printed", which is
-- otherwise a sequential scan of every profile.
create index if not exists card_profiles_nfc_chosen_idx
  on public.card_profiles (nfc_chosen_at desc)
  where nfc_finish is not null;
