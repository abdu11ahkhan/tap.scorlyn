-- Let admins change a handle, which 029 blocked along with everyone else.
--
-- 029 made a handle permanent because it is the card's printed address. That
-- rule is for the customer: it stops someone breaking every card already in
-- circulation. Support is exactly who should be able to override it — fixing
-- a typo in a handle before the cards are printed, or freeing a name.
--
-- The exception was written as "service_role or no auth.uid()", which an admin
-- signed in through the browser is neither of: they are an ordinary
-- authenticated user who happens to pass is_admin().

create or replace function public.lock_username()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.username is not null
     and new.username is distinct from old.username then

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
$$;
