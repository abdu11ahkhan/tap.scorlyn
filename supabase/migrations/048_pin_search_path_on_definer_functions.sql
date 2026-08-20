-- =====================================================================
-- Phase 8 — P2 hardening. Every SECURITY DEFINER function added from
-- 010_branding_and_order_alerts.sql onward sets SET search_path = public;
-- six earlier ones never did. All their internal statements are already
-- schema-qualified (public.profiles, public.card_taps, etc.), which limits
-- real exploitability today — but an unpinned search_path on a SECURITY
-- DEFINER function is the textbook setup for a search-path-hijack
-- privilege escalation if any statement inside is ever added without
-- schema-qualification later. No behavior change; pure defense in depth.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in.'; END IF;
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, email, referral_code,
    account_type, company_name, company_slug, account_type_confirmed
  )
  VALUES (
    new.id, new.raw_user_meta_data->>'full_name', new.email,
    public.generate_referral_code(),
    COALESCE(new.raw_user_meta_data->>'account_type', 'individual'),
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'company_slug',
    (new.raw_user_meta_data ? 'account_type')
  );
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.bump_view_count()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.card_profiles
  SET view_count = view_count + 1
  WHERE id = NEW.card_profile_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_events (order_id, status, note)
    VALUES (new.id, new.status, 'Order placed');
  ELSIF new.status IS DISTINCT FROM old.status THEN
    INSERT INTO public.order_events (order_id, status)
    VALUES (new.id, new.status);
  END IF;
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_card_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  SELECT referral_code INTO new.referral_code
  FROM public.profiles WHERE id = new.user_id;
  RETURN new;
END;
$$;
