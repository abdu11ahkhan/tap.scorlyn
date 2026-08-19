-- ---------------------------------------------------------------------
-- 043 - Google sign-in never asked individual vs. corporate.
--
-- handle_new_user() (040_corporate_accounts.sql) defaults account_type to
-- 'individual' "whenever the new keys are absent, so Google OAuth ... keeps
-- working exactly as before" — but "as before" meant nobody signing in with
-- Google was ever asked at all. The email/password form on /signup always
-- sends account_type explicitly (even for "individual" — see handleSignup in
-- src/app/signup/page.tsx), so it's a reliable signal: the key's presence in
-- raw_user_meta_data means a real person chose, its absence means Google
-- OAuth defaulted it silently.
--
-- account_type_confirmed lets /auth/callback tell the two apart and route a
-- confirmed-false account through a one-time /onboarding/account-type step
-- before it ever reaches the dashboard, without re-asking anyone who already
-- chose (including every existing row, backfilled true below — this is only
-- for signups from here on).
-- ---------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type_confirmed BOOLEAN NOT NULL DEFAULT FALSE;

-- Existing accounts already went through some signup path or have been
-- using the product — re-litigating their account type now would be a
-- surprise interstitial for people who did nothing wrong. Only new rows
-- created after this migration (via the trigger below) start unconfirmed.
UPDATE public.profiles SET account_type_confirmed = TRUE WHERE account_type_confirmed = FALSE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, email, referral_code,
    account_type, company_name, company_slug, account_type_confirmed
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    public.generate_referral_code(),
    COALESCE(new.raw_user_meta_data->>'account_type', 'individual'),
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'company_slug',
    (new.raw_user_meta_data ? 'account_type')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
