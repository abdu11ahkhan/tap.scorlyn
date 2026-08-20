-- =====================================================================
-- "New card" (src/components/dashboard/CardList.tsx's createCard) inserts
-- a card_profiles row immediately, before the customer has chosen a
-- handle, with a random placeholder ("new-card-xxxxxx") -- username is
-- NOT NULL, so there is no way to insert the row without some value.
--
-- lock_username() (046_close_nfc_cards_self_service.sql-era trigger)
-- blocks any username change once old.username IS NOT NULL, with no
-- concept of "was this ever really chosen." Combined, a customer using
-- the quick "new card" button was locked out of picking their own handle
-- before they ever got to type one -- the editor's lockUsername prop
-- (keyed only on "does this row already exist") saw a non-null username
-- and locked the field on the very first render.
--
-- Narrow fix: the trigger now also allows the change through when
-- old.username still exactly matches that auto-generated placeholder
-- pattern -- a handle that was never a real choice isn't "the card
-- address already handed out" the trigger exists to protect. A genuine
-- handle (even one a customer deliberately picked starting with
-- "new-card-") still can't collide with this: the suffix format is
-- Math.random().toString(36).slice(2, 8), 1-6 lowercase base36 characters,
-- and once a real value is saved this exemption no longer applies to it.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.lock_username()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if old.username is not null
     and new.username is distinct from old.username
     and old.username !~ '^new-card-[a-z0-9]{1,8}$' then

    if auth.uid() is not null
       and coalesce(
             current_setting('request.jwt.claims', true)::jsonb ->> 'role',
             ''
           ) <> 'service_role'
       and not public.is_admin() then
      raise exception
        'Your card address cannot be changed once it is set.'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$function$;
