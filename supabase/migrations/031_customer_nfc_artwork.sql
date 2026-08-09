-- Customers supplying their own card artwork.
--
-- Some people already have a design — a company card, something a designer
-- made — and want that printed rather than one of ours. Until now the only
-- way was to email it and hope it reached the right order.
--
-- Private, not public like card-images: a print file is the customer's own
-- work and often carries a logo they do not want served from a guessable URL.

insert into storage.buckets (id, name, public, file_size_limit)
values ('nfc-artwork', 'nfc-artwork', false, 20971520)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

-- Stored as <user_id>/<filename>, so the first path segment is the owner —
-- the same shape the payment proofs use.
drop policy if exists "Owners upload their own card artwork" on storage.objects;
create policy "Owners upload their own card artwork"
  on storage.objects for insert
  with check (
    bucket_id = 'nfc-artwork'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owners read their own card artwork" on storage.objects;
create policy "Owners read their own card artwork"
  on storage.objects for select
  using (
    bucket_id = 'nfc-artwork'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owners replace their own card artwork" on storage.objects;
create policy "Owners replace their own card artwork"
  on storage.objects for update
  using (
    bucket_id = 'nfc-artwork'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Changing your mind about a design you uploaded. Without this the old file
-- stays in the bucket for ever and the customer cannot clear it.
drop policy if exists "Owners delete their own card artwork" on storage.objects;
create policy "Owners delete their own card artwork"
  on storage.objects for delete
  using (
    bucket_id = 'nfc-artwork'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin has to open the file to print it.
drop policy if exists "Admins read every card artwork" on storage.objects;
create policy "Admins read every card artwork"
  on storage.objects for select
  using (bucket_id = 'nfc-artwork' and public.is_admin());

-- The storage path, not a public URL: the bucket is private, so the file is
-- reached through a signed URL minted when someone with permission asks.
alter table public.card_profiles
  add column if not exists nfc_artwork_path text,
  -- Kept so admin sees what the customer called it rather than a uuid.
  add column if not exists nfc_artwork_name text;
