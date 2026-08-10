-- Paying for a second card, against that card.
--
-- 033 left the fee collected somewhere off-system: the card sat at
-- awaiting_payment until admin happened to know money had arrived. The
-- customer now attaches the transfer receipt to the card itself, which is
-- what tells admin there is something to check.
--
-- Reuses the payment-proofs bucket rather than a new one — it is already
-- private, already keyed on <user_id>/, and admin already has a reader.

alter table public.card_profiles
  add column if not exists approval_proof_path text,
  add column if not exists approval_proof_name text,
  add column if not exists approval_submitted_at timestamptz;

-- ---------------------------------------------------------------------
-- One extra move for the customer: "I have paid, please check".
--
-- 033 refused every status change by anyone but admin, which is right for
-- approving — but it also blocked the customer from ever saying they had
-- paid, leaving the fee with no way into the system at all.
-- ---------------------------------------------------------------------
create or replace function public.enforce_card_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_admin boolean := coalesce(public.is_admin(), false)
    or auth.uid() is null
    or coalesce(
         current_setting('request.jwt.claims', true)::jsonb ->> 'role', ''
       ) = 'service_role';
  existing_cards integer;
  owner_submitting_payment boolean;
begin
  if tg_op = 'INSERT' then
    if acting_admin then
      return new;
    end if;

    select count(*) into existing_cards
      from public.card_profiles
      where user_id = new.user_id;

    if existing_cards > 0 then
      new.approval_status := 'awaiting_payment';
      new.approval_fee_pkr := coalesce(new.approval_fee_pkr, 500);
      new.published := false;
      new.approved_at := null;
    else
      new.approval_status := 'approved';
    end if;

    return new;
  end if;

  -- The one transition an owner may make, and only with a receipt attached:
  -- awaiting_payment -> awaiting_review. It grants nothing on its own, it
  -- just puts the card in front of admin.
  owner_submitting_payment :=
    old.approval_status = 'awaiting_payment'
    and new.approval_status = 'awaiting_review'
    and new.approval_proof_path is not null
    and auth.uid() = old.user_id;

  if new.approval_status is distinct from old.approval_status
     and not acting_admin
     and not owner_submitting_payment then
    raise exception 'Only ScorlynTap can approve a card.'
      using errcode = 'insufficient_privilege';
  end if;

  if new.published and new.approval_status <> 'approved' then
    raise exception
      'This card is not approved yet, so it cannot be published.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;
