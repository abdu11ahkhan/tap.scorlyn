-- A handle is permanent once chosen.
--
-- It is the card's public address: it is printed on NFC cards, saved into
-- contacts as the vCard URL, and shared as a link. Letting someone change it
-- silently breaks every card already in someone else's pocket, and frees the
-- old handle for a stranger to claim — so a QR code printed last month starts
-- resolving to somebody else's profile.
--
-- Enforced here rather than in the editor because the editor is a client: the
-- update goes straight to PostgREST, so a disabled input stops nobody.

create or replace function public.lock_username()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only a *change* is blocked. An update that leaves the handle alone must
  -- pass untouched, because every ordinary card save sends the column back.
  if old.username is not null
     and new.username is distinct from old.username then

    -- Support can still fix a typo or free up a handle: the rule binds signed-in
    -- end users, which is who it is for. auth.uid() is null for the service key
    -- and for direct SQL, and neither of those is reachable from a browser.
    if auth.uid() is not null
       and coalesce(
             current_setting('request.jwt.claims', true)::jsonb ->> 'role',
             ''
           ) <> 'service_role' then
      raise exception
        'Your card address cannot be changed once it is set.'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists lock_username on public.card_profiles;
create trigger lock_username
  before update on public.card_profiles
  for each row
  execute function public.lock_username();
