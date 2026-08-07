-- Deleting a customer account.
--
-- The profile row cascades to their card, their NFC assignments and their
-- referral events, which is what "delete everything" should mean. Orders are
-- deliberately not among them: orders.user_id is ON DELETE SET NULL, so the
-- business record of a sale survives someone asking to be removed.
--
-- This table is what is left behind: enough to answer "whose account was that
-- and when did it go", and nothing that would rebuild the person's profile.
create table if not exists public.deleted_accounts (
  id uuid primary key default gen_random_uuid(),
  -- The account's own id, kept so surviving orders can still be traced back.
  former_user_id uuid,
  email text,
  full_name text,
  username text,
  orders_kept integer not null default 0,
  reason text,
  deleted_by uuid references public.profiles(id) on delete set null,
  deleted_at timestamptz not null default now()
);

create index if not exists deleted_accounts_deleted_at_idx
  on public.deleted_accounts (deleted_at desc);

alter table public.deleted_accounts enable row level security;

-- Admins only, both directions. `using` alone would leave writes open.
drop policy if exists "admins read deletions" on public.deleted_accounts;
create policy "admins read deletions" on public.deleted_accounts
  for all
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.deleted_accounts is
  'Audit trail of removed customer accounts. Holds no profile content — only who was removed, by whom and when.';
