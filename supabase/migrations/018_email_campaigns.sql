-- Admin-composed emails: promotional notes, announcements, referral nudges.
--
-- Stored rather than fired straight off the form for three reasons: a send can
-- be scheduled for later, a half-written one can be saved as a draft, and once
-- it has gone out there is a record of exactly what every customer received.
create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body_text text not null,
  -- 'all' = every registered account. 'test' = the admin who wrote it, which
  -- is how you check spam placement without mailing real customers.
  audience text not null default 'test'
    check (audience in ('all', 'customers_with_cards', 'test')),
  -- null means send immediately when the admin presses send.
  scheduled_for timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  sent_at timestamptz,
  recipient_count integer not null default 0,
  last_error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- The scheduler polls for what is due; without this it seq-scans every send
-- ever made on each tick.
create index if not exists email_campaigns_due_idx
  on public.email_campaigns (scheduled_for)
  where status = 'scheduled';

alter table public.email_campaigns enable row level security;

-- Admins only, in both directions. No customer has any reason to read the
-- marketing queue, and `using` alone would leave writes wide open.
drop policy if exists "admins manage campaigns" on public.email_campaigns;
create policy "admins manage campaigns" on public.email_campaigns
  for all
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.email_campaigns is
  'Admin-composed emails. Sent immediately or picked up by the scheduler when scheduled_for falls due.';
