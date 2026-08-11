-- Which parts of an invoice actually get printed.
--
-- Not every invoice wants every field. A corporate batch billed to an account
-- has no use for a home address; a cash sale has no due date; some customers
-- should not see a unit price broken out at all, only a line total. Choosing
-- per invoice beats one house style that is wrong half the time.
--
-- Defaults live in the app, not here: an empty object means "everything on",
-- so an invoice written before this existed prints exactly as it did.
alter table public.invoices
  add column if not exists display jsonb not null default '{}'::jsonb;
