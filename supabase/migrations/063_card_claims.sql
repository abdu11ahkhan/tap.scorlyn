-- =====================================================================
-- Customers activate a physical card themselves.
--
-- A card printed in bulk can be scanned by anyone, so claiming is gated two
-- ways, either of which is enough:
--   * the card's activation code (printed on the packaging) → instant
--   * otherwise a request, which an admin approves or rejects
-- and only cards an admin has released for sale (claimable) can be claimed.
--
-- New status 'claimed': owned by a customer who hasn't chosen what it opens
-- yet. Owners can then point it at one of their pages, rename it, or pause it
-- themselves, through narrow SECURITY DEFINER functions — nfc_cards itself
-- stays read-only to them.
-- =====================================================================

-- ------------------------------------------------------- activation codes
-- 8 characters, no I/O/0/1, drawn from gen_random_uuid()'s CSPRNG bytes.
CREATE OR REPLACE FUNCTION public.new_activation_code()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  alphabet CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes BYTEA := uuid_send(gen_random_uuid());
  code TEXT := '';
  i INT;
BEGIN
  FOR i IN 0..7 LOOP
    code := code || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  END LOOP;
  RETURN code;
END;
$$;

ALTER TABLE public.nfc_cards
  ADD COLUMN IF NOT EXISTS activation_code TEXT,
  ADD COLUMN IF NOT EXISTS claimable BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_paused BOOLEAN NOT NULL DEFAULT false;

UPDATE public.nfc_cards SET activation_code = public.new_activation_code() WHERE activation_code IS NULL;
ALTER TABLE public.nfc_cards ALTER COLUMN activation_code SET DEFAULT public.new_activation_code();
ALTER TABLE public.nfc_cards ALTER COLUMN activation_code SET NOT NULL;

ALTER TABLE public.nfc_cards DROP CONSTRAINT IF EXISTS nfc_cards_status_check;
ALTER TABLE public.nfc_cards
  ADD CONSTRAINT nfc_cards_status_check
  CHECK (status IN ('in_stock', 'claimed', 'active', 'suspended', 'retired'));

-- A claimed card becomes active as soon as it is pointed at a page, same as
-- stock does when an admin assigns it.
CREATE OR REPLACE FUNCTION public.nfc_cards_before_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();

  IF TG_OP = 'INSERT' OR NEW.card_profile_id IS DISTINCT FROM OLD.card_profile_id THEN
    IF NEW.card_profile_id IS NULL THEN
      -- A claimed card keeps its owner when its page is cleared.
      IF NEW.status <> 'claimed' THEN
        NEW.user_id := NULL;
      END IF;
      NEW.assigned_at := NULL;
      IF NEW.status = 'active' THEN NEW.status := 'in_stock'; END IF;
    ELSE
      SELECT user_id INTO NEW.user_id FROM public.card_profiles WHERE id = NEW.card_profile_id;
      NEW.assigned_at := now();
      IF NEW.status IN ('in_stock', 'claimed') THEN NEW.status := 'active'; END IF;
    END IF;
  END IF;

  IF NEW.status = 'active' AND NEW.card_profile_id IS NULL THEN
    NEW.status := 'in_stock';
  END IF;

  -- Back in stock means unowned, unclaimable until released again.
  IF NEW.status = 'in_stock' THEN
    NEW.user_id := NULL;
    NEW.owner_paused := false;
  END IF;

  RETURN NEW;
END;
$$;

-- --------------------------------------------------------------- claims
CREATE TABLE IF NOT EXISTS public.card_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nfc_card_id UUID NOT NULL REFERENCES public.nfc_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  method TEXT NOT NULL DEFAULT 'approval' CHECK (method IN ('approval', 'code')),
  note TEXT CHECK (note IS NULL OR char_length(note) <= 300),
  decided_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS card_claims_one_pending
  ON public.card_claims(nfc_card_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS card_claims_status_idx ON public.card_claims(status, created_at DESC);
CREATE INDEX IF NOT EXISTS card_claims_user_idx ON public.card_claims(user_id, created_at DESC);

ALTER TABLE public.card_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their own card claims." ON public.card_claims;
CREATE POLICY "Users can see their own card claims."
  ON public.card_claims FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can see all card claims." ON public.card_claims;
CREATE POLICY "Admins can see all card claims."
  ON public.card_claims FOR SELECT
  USING (public.is_admin());

-- ------------------------------------------------ what the activate page sees
CREATE OR REPLACE FUNCTION public.card_claim_status(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.nfc_cards%ROWTYPE;
  me UUID := auth.uid();
  mine TEXT;
BEGIN
  SELECT * INTO c FROM public.nfc_cards WHERE card_url = p_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('exists', false);
  END IF;

  IF me IS NOT NULL THEN
    SELECT status INTO mine FROM public.card_claims
    WHERE nfc_card_id = c.id AND user_id = me
    ORDER BY created_at DESC LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'exists', true,
    'id', CASE WHEN me IS NOT NULL AND c.user_id = me THEN c.id END,
    'serial', c.serial,
    'status', c.status,
    'claimable', c.claimable AND c.status = 'in_stock',
    'pending_other', EXISTS (
      SELECT 1 FROM public.card_claims
      WHERE nfc_card_id = c.id AND status = 'pending' AND user_id IS DISTINCT FROM me
    ),
    'my_claim', mine,
    'is_owner', me IS NOT NULL AND c.user_id = me
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.card_claim_status(TEXT) TO anon, authenticated;

-- --------------------------------------------------------- request a claim
-- With the right activation code: claimed instantly. Without one: a pending
-- request for an admin. Returns 'claimed' or 'pending'.
CREATE OR REPLACE FUNCTION public.request_card_claim(p_code TEXT, p_activation TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me UUID := auth.uid();
  c public.nfc_cards%ROWTYPE;
  given TEXT := upper(regexp_replace(coalesce(p_activation, ''), '[^A-Za-z0-9]', '', 'g'));
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'Sign in first.';
  END IF;

  SELECT * INTO c FROM public.nfc_cards WHERE card_url = p_code FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This card does not exist.';
  END IF;
  IF c.user_id = me THEN
    RETURN 'claimed';
  END IF;
  IF c.status <> 'in_stock' THEN
    RAISE EXCEPTION 'This card is already in use.';
  END IF;
  IF NOT c.claimable THEN
    RAISE EXCEPTION 'This card has not been released yet. Contact ScorlynTap.';
  END IF;

  IF given <> '' THEN
    IF given <> c.activation_code THEN
      RAISE EXCEPTION 'That activation code is not right.';
    END IF;
    UPDATE public.card_claims SET status = 'cancelled', decided_at = now()
    WHERE nfc_card_id = c.id AND status = 'pending';
    INSERT INTO public.card_claims (nfc_card_id, user_id, status, method, decided_at)
    VALUES (c.id, me, 'approved', 'code', now());
    UPDATE public.nfc_cards SET status = 'claimed', user_id = me, claimable = false WHERE id = c.id;
    RETURN 'claimed';
  END IF;

  IF EXISTS (SELECT 1 FROM public.card_claims WHERE nfc_card_id = c.id AND status = 'pending' AND user_id = me) THEN
    RETURN 'pending';
  END IF;
  IF EXISTS (SELECT 1 FROM public.card_claims WHERE nfc_card_id = c.id AND status = 'pending') THEN
    RAISE EXCEPTION 'Someone has already asked to activate this card. Contact ScorlynTap if it is yours.';
  END IF;

  INSERT INTO public.card_claims (nfc_card_id, user_id) VALUES (c.id, me);
  RETURN 'pending';
END;
$$;

REVOKE ALL ON FUNCTION public.request_card_claim(TEXT, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.request_card_claim(TEXT, TEXT) TO authenticated;

-- ------------------------------------------------------- admin decision
CREATE OR REPLACE FUNCTION public.decide_card_claim(p_claim UUID, p_approve BOOLEAN, p_note TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cl public.card_claims%ROWTYPE;
  c public.nfc_cards%ROWTYPE;
BEGIN
  IF NOT coalesce(public.is_admin(), false) THEN
    RAISE EXCEPTION 'Admins only.';
  END IF;

  SELECT * INTO cl FROM public.card_claims WHERE id = p_claim FOR UPDATE;
  IF NOT FOUND OR cl.status <> 'pending' THEN
    RAISE EXCEPTION 'This request has already been handled.';
  END IF;

  IF NOT p_approve THEN
    UPDATE public.card_claims
    SET status = 'rejected', decided_by = auth.uid(), decided_at = now(), note = nullif(trim(p_note), '')
    WHERE id = p_claim;
    RETURN;
  END IF;

  SELECT * INTO c FROM public.nfc_cards WHERE id = cl.nfc_card_id FOR UPDATE;
  IF c.status <> 'in_stock' THEN
    RAISE EXCEPTION 'That card is no longer in stock.';
  END IF;

  UPDATE public.card_claims
  SET status = 'approved', decided_by = auth.uid(), decided_at = now(), note = nullif(trim(p_note), '')
  WHERE id = p_claim;
  UPDATE public.nfc_cards SET status = 'claimed', user_id = cl.user_id, claimable = false WHERE id = c.id;
END;
$$;

REVOKE ALL ON FUNCTION public.decide_card_claim(UUID, BOOLEAN, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.decide_card_claim(UUID, BOOLEAN, TEXT) TO authenticated;

-- ---------------------------------------------------- owner self-service
-- Point my card at one of my own pages (or nothing, while I decide).
CREATE OR REPLACE FUNCTION public.set_my_card_page(p_card UUID, p_profile UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me UUID := auth.uid();
  c public.nfc_cards%ROWTYPE;
BEGIN
  SELECT * INTO c FROM public.nfc_cards WHERE id = p_card FOR UPDATE;
  IF NOT FOUND OR c.user_id IS DISTINCT FROM me OR me IS NULL THEN
    RAISE EXCEPTION 'That card is not yours.';
  END IF;
  IF c.status IN ('suspended', 'retired') THEN
    RAISE EXCEPTION 'This card has been switched off by ScorlynTap.';
  END IF;

  IF p_profile IS NULL THEN
    UPDATE public.nfc_cards SET status = 'claimed', card_profile_id = NULL WHERE id = p_card;
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.card_profiles WHERE id = p_profile AND user_id = me) THEN
    RAISE EXCEPTION 'That page is not yours.';
  END IF;
  UPDATE public.nfc_cards SET card_profile_id = p_profile WHERE id = p_card;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_my_card(p_card UUID, p_nickname TEXT, p_paused BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me UUID := auth.uid();
BEGIN
  UPDATE public.nfc_cards
  SET nickname = nullif(left(trim(coalesce(p_nickname, '')), 80), ''),
      owner_paused = coalesce(p_paused, false)
  WHERE id = p_card AND user_id = me AND me IS NOT NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'That card is not yours.';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_my_card_page(UUID, UUID) FROM public;
REVOKE ALL ON FUNCTION public.update_my_card(UUID, TEXT, BOOLEAN) FROM public;
GRANT EXECUTE ON FUNCTION public.set_my_card_page(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_my_card(UUID, TEXT, BOOLEAN) TO authenticated;

-- ----------------------------------------------------- public tap lookup
-- Adds claimable, and reports an owner-paused card as suspended so the tap
-- route treats it as switched off without needing to know the difference.
DROP FUNCTION IF EXISTS public.resolve_nfc_card(TEXT);

CREATE OR REPLACE FUNCTION public.resolve_nfc_card(code TEXT)
RETURNS TABLE (
  nfc_card_id UUID,
  card_profile_id UUID,
  username TEXT,
  is_single_purpose BOOLEAN,
  redirect_kind TEXT,
  redirect_value TEXT,
  redirect_message TEXT,
  status TEXT,
  claimable BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    nc.id,
    nc.card_profile_id,
    cp.username,
    cp.is_single_purpose,
    (cp.buttons -> 0 ->> 'kind'),
    (cp.buttons -> 0 ->> 'value'),
    (cp.buttons -> 0 ->> 'message'),
    CASE WHEN nc.owner_paused AND nc.status = 'active' THEN 'suspended' ELSE nc.status END,
    nc.claimable
  FROM public.nfc_cards nc
  LEFT JOIN public.card_profiles cp ON cp.id = nc.card_profile_id
  WHERE nc.card_url = code;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_nfc_card(TEXT) TO anon, authenticated;
