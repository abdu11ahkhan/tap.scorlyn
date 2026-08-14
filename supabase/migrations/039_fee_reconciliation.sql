-- What was actually paid, so approving is checkable against a bank statement.
--
-- The fee had a receipt image and nothing else: no amount, no transaction
-- reference. Approving meant eyeballing a screenshot and trusting it. These
-- two fields do not verify anything on their own — nothing here talks to a
-- bank — but they turn "looks right" into "matches line 14 of the statement",
-- and they record who accepted it.
alter table public.card_profiles
  add column if not exists approval_amount_pkr integer,
  add column if not exists approval_reference text;
