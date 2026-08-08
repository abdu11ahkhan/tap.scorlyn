-- Safepay is removed; payment is back to bank transfer with an uploaded proof.
--
-- Two orders were left holding a tracker for a gateway that no longer exists,
-- which would read as "awaiting payment provider" forever. They go back to the
-- manual flow, where an admin verifies the transfer.
--
-- payment_verified_at and payment_proof_url already carry everything the
-- manual flow needs, so these columns have no remaining reader.
drop index if exists orders_payment_tracker_idx;

alter table public.orders
  drop column if exists payment_provider,
  drop column if exists payment_tracker,
  drop column if exists payment_state,
  drop column if exists paid_at;
