-- Sending an invoice to the customer.
--
-- Invoices are admin-only and must stay that way: they carry names, phone
-- numbers and addresses. So sharing is opt-in per invoice and goes through an
-- unguessable token rather than by opening the table up.

alter table public.invoices
  add column if not exists share_token text unique;

-- Reading one by token. SECURITY DEFINER so the row can be returned without
-- granting any customer or visitor select on the table itself, and it returns
-- only the fields the printed invoice shows — never created_by or order_id.
create or replace function public.invoice_by_token(token text)
returns table (
  id uuid,
  number text,
  customer_name text,
  customer_phone text,
  customer_email text,
  customer_address text,
  issued_on date,
  due_on date,
  items jsonb,
  discount_pkr integer,
  shipping_pkr integer,
  tax_percent numeric,
  notes text,
  status text,
  display jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select i.id, i.number, i.customer_name, i.customer_phone, i.customer_email,
         i.customer_address, i.issued_on, i.due_on, i.items, i.discount_pkr,
         i.shipping_pkr, i.tax_percent, i.notes, i.status, i.display
  from public.invoices i
  -- A blank or short token must never match: without this an empty string
  -- would return every invoice that had not been shared.
  where token is not null
    and length(token) >= 20
    and i.share_token = token;
$$;

revoke all on function public.invoice_by_token(text) from public;
grant execute on function public.invoice_by_token(text) to anon, authenticated;
