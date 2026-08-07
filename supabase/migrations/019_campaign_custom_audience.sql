-- Sending to a typed-in address: one customer, or someone who has no account
-- at all (a lead, a reseller). The three fixed audiences couldn't express it.
alter table public.email_campaigns
  drop constraint if exists email_campaigns_audience_check;

alter table public.email_campaigns
  add constraint email_campaigns_audience_check
  check (audience in ('all', 'customers_with_cards', 'test', 'custom'));

-- Who it went to, when the audience is 'custom'. Null for the fixed audiences,
-- where the recipient list is derived rather than typed.
alter table public.email_campaigns
  add column if not exists custom_recipients text;
