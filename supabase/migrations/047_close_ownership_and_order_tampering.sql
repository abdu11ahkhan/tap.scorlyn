-- =====================================================================
-- Phase 8 — P1 findings.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. card_profiles: org_owner_id was never constrained on INSERT.
--
-- lock_card_ownership() (040_corporate_accounts.sql) already blocks a
-- non-privileged UPDATE from changing user_id/org_owner_id, but it only
-- runs BEFORE UPDATE. A regular authenticated user could self-insert their
-- own card with org_owner_id set to an arbitrary corporate account's id —
-- confirmed live. The corporate owner's own org_owner_id-scoped policies
-- would then treat that card as one of their employees': visible in their
-- team list, editable, deletable by them. The attacker gains nothing
-- directly, but it's a real spoofing/pollution path into a company's own
-- roster, and it undermines the entire point of the ownership lock.
--
-- The legitimate corporate flow (createEmployee, dashboard/team/actions.ts)
-- already inserts via the service-role client with org_owner_id stamped
-- server-side from the authenticated caller's session — never from a
-- client-supplied field — so it goes through the "service_role" branch
-- below unaffected by this tightening.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lock_card_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.org_owner_id IS NOT NULL
       AND auth.uid() IS NOT NULL
       AND COALESCE(
             current_setting('request.jwt.claims', true)::jsonb ->> 'role',
             ''
           ) <> 'service_role'
       AND NOT public.is_admin() THEN
      RAISE EXCEPTION
        'org_owner_id cannot be set directly.'
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  IF (NEW.user_id IS DISTINCT FROM OLD.user_id
      OR NEW.org_owner_id IS DISTINCT FROM OLD.org_owner_id)
     AND auth.uid() IS NOT NULL
     AND COALESCE(
           current_setting('request.jwt.claims', true)::jsonb ->> 'role',
           ''
         ) <> 'service_role'
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION
      'Card ownership cannot be changed from the dashboard.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS card_profiles_lock_ownership ON public.card_profiles;
CREATE TRIGGER card_profiles_lock_ownership
  BEFORE INSERT OR UPDATE ON public.card_profiles
  FOR EACH ROW EXECUTE FUNCTION public.lock_card_ownership();

-- ---------------------------------------------------------------------
-- 2. orders: the customer UPDATE policy (008_order_storage_policies.sql)
-- is a full-row policy. Its own comment states the intent — "attaching a
-- proof is the ONE field a customer may change" — but RLS is row-level,
-- not column-level, and unlike profiles (protect_profile_columns(),
-- 014) nothing ever enforced that. Confirmed live: a customer can rewrite
-- amount_pkr, quantity, internal_note, flagged, assigned_to, and more on
-- their own pending order.
--
-- application code (orders/actions.ts:attachPaymentProof) only ever sets
-- payment_proof_url, matching the policy's own stated intent — so this
-- trigger just makes that the only thing the database will actually let
-- a non-privileged UPDATE change, mirroring protect_profile_columns()'s
-- existing pattern.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_order_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin()
     OR COALESCE(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'service_role'
  THEN
    RETURN NEW;
  END IF;

  NEW.reference := OLD.reference;
  NEW.user_id := OLD.user_id;
  NEW.card_profile_id := OLD.card_profile_id;
  NEW.plan_id := OLD.plan_id;
  NEW.quantity := OLD.quantity;
  NEW.amount_pkr := OLD.amount_pkr;
  NEW.full_name := OLD.full_name;
  NEW.phone := OLD.phone;
  NEW.address := OLD.address;
  NEW.city := OLD.city;
  NEW.status := OLD.status;
  NEW.payment_verified_at := OLD.payment_verified_at;
  NEW.internal_note := OLD.internal_note;
  NEW.flagged := OLD.flagged;
  NEW.assigned_to := OLD.assigned_to;
  NEW.estimated_delivery := OLD.estimated_delivery;
  NEW.card_design := OLD.card_design;
  NEW.customer_note := OLD.customer_note;
  NEW.branding := OLD.branding;
  -- payment_proof_url is deliberately left assignable — it's the one field
  -- a customer legitimately changes on their own pending order.
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_protect_columns ON public.orders;
CREATE TRIGGER orders_protect_columns
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.protect_order_columns();
