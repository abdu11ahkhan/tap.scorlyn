-- A record of admins signing in as customers.
--
-- The console can already read and change everything about a customer, so this
-- grants no power an admin lacked — but "who was in this account" is a
-- different question from "who could have been", and only a log answers it.
-- If a customer ever asks why their card changed, this is where the answer is.
create table if not exists public.admin_impersonations (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  admin_email text,
  target_id uuid references public.profiles(id) on delete set null,
  target_email text,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists admin_impersonations_created_idx
  on public.admin_impersonations (created_at desc);

alter table public.admin_impersonations enable row level security;

-- Admins only, both directions. `using` alone would leave writes open.
drop policy if exists "admins read impersonations" on public.admin_impersonations;
create policy "admins read impersonations" on public.admin_impersonations
  for all
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.admin_impersonations is
  'Audit trail: which admin signed in as which customer, and when.';
