-- Invoices admin writes by hand.
--
-- The only invoice that existed was rendered from an order, so anything not
-- sold through the shop — a bulk NFC run quoted over WhatsApp, a design fee,
-- a corporate batch — had no invoice at all.

-- A sequence, not max(number)+1: two invoices created in the same second
-- would otherwise both read the same maximum and one would lose the insert
-- to the unique index.
create sequence if not exists public.invoice_number_seq start 1;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,

  customer_name text not null,
  customer_phone text,
  customer_email text,
  customer_address text,

  issued_on date not null default current_date,
  due_on date,

  -- [{ description, quantity, unit_price_pkr }]
  -- Totals are not stored: they are derived from these by one shared helper,
  -- so a stored total can never disagree with the lines printed above it.
  items jsonb not null default '[]'::jsonb,

  discount_pkr integer not null default 0,
  shipping_pkr integer not null default 0,
  tax_percent numeric(5, 2) not null default 0,

  notes text,
  status text not null default 'unpaid'
    check (status in ('unpaid', 'paid', 'void')),

  -- Optional: an invoice may still relate to a shop order.
  order_id uuid references public.orders (id) on delete set null,

  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_created_idx on public.invoices (created_at desc);
create index if not exists invoices_status_idx on public.invoices (status);

alter table public.invoices enable row level security;

-- Admin only, in every direction. Invoices carry customer names, phone
-- numbers and addresses; nothing here should be readable by a signed-in
-- customer, let alone anonymously.
drop policy if exists "Admins manage invoices" on public.invoices;
create policy "Admins manage invoices"
  on public.invoices for all
  using (public.is_admin())
  with check (public.is_admin());

-- Numbering. SECURITY DEFINER so the sequence does not need to be granted
-- to every authenticated role.
create or replace function public.next_invoice_number()
returns text
language sql
security definer
set search_path = public
as $$
  select 'INV-' || to_char(now(), 'YYYY') || '-' ||
         lpad(nextval('public.invoice_number_seq')::text, 4, '0');
$$;

revoke all on function public.next_invoice_number() from public;
grant execute on function public.next_invoice_number() to authenticated;

create or replace function public.invoices_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists invoices_touch_updated_at on public.invoices;
create trigger invoices_touch_updated_at
  before update on public.invoices
  for each row execute function public.invoices_touch_updated_at();
