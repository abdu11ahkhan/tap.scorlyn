-- The product was renamed from Tapzar to ScorlynTap. Migration 010 wrote the
-- old name into a column comment, which is the one place the rename survived
-- in the live database rather than only in the source.
comment on column public.orders.branding is
  'branded = small ScorlynTap mark on the card back (included). unbranded = customer artwork only, costs unbranded_surcharge_pkr per card.';
