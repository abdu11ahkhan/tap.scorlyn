-- When we sent this account its welcome email.
--
-- Google sign-in has no confirmation step — the address arrives already
-- verified, so nothing is emailed and the person gets no acknowledgement that
-- an account now exists in their name. This marks who has been told, so the
-- mail goes exactly once however many times they sign in.
alter table public.profiles
  add column if not exists welcomed_at timestamptz;

comment on column public.profiles.welcomed_at is
  'Set when the welcome email was sent. Null means it has not been sent yet.';
