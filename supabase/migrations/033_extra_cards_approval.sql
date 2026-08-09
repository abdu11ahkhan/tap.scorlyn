-- A second card costs money and needs approving before it can go live.
--
-- The first card stays free and instant — that is the product. Every card
-- after it starts unpublished and unapproved: the customer builds it, pays,
-- and admin releases it. All of that is enforced here rather than in the
-- editor, because the editor is a browser talking straight to PostgREST.

alter table public.card_profiles
  add column if not exists approval_status text not null default 'approved',
  add column if not exists approval_fee_pkr integer,
  add column if not exists approval_note text,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users (id);

alter table public.card_profiles
  drop constraint if exists card_profiles_approval_status_check;
alter table public.card_profiles
  add constraint card_profiles_approval_status_check
  check (approval_status in ('approved', 'awaiting_payment', 'awaiting_review', 'rejected'));

-- Everything that already exists was made before this rule and stays live.
update public.card_profiles set approval_status = 'approved' where approval_status is null;

create index if not exists card_profiles_awaiting_idx
  on public.card_profiles (approval_status, created_at desc)
  where approval_status <> 'approved';

-- ---------------------------------------------------------------------
-- The rules.
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
begin
  if tg_op = 'INSERT' then
    -- Admin creating a card on someone's behalf has already agreed the terms
    -- over WhatsApp; the fee is collected outside this table.
    if acting_admin then
      return new;
    end if;

    select count(*) into existing_cards
      from public.card_profiles
      where user_id = new.user_id;

    if existing_cards > 0 then
      -- Set rather than rejected: the customer should be able to build the
      -- card and see it before paying for it. It just cannot go live.
      new.approval_status := 'awaiting_payment';
      new.approval_fee_pkr := coalesce(new.approval_fee_pkr, 500);
      new.published := false;
      new.approved_at := null;
    else
      new.approval_status := 'approved';
    end if;

    return new;
  end if;

  -- Only admin moves a card between states. Without this the customer could
  -- approve their own card with a single PATCH and never pay.
  if new.approval_status is distinct from old.approval_status
     and not acting_admin then
    raise exception 'Only ScorlynTap can approve a card.'
      using errcode = 'insufficient_privilege';
  end if;

  -- The gate itself. Checked on the value being written, so it also catches
  -- a card that was approved, then rejected, and is being re-published.
  if new.published and new.approval_status <> 'approved' then
    raise exception
      'This card is not approved yet, so it cannot be published.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_card_approval on public.card_profiles;
create trigger enforce_card_approval
  before insert or update on public.card_profiles
  for each row
  execute function public.enforce_card_approval();
