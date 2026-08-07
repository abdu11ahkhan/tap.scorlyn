-- Is a handle free?
--
-- A plain select cannot answer this: RLS hides unpublished cards, so the
-- browser would be told a taken handle is available and the person would only
-- find out when saving failed on the unique index.
--
-- SECURITY DEFINER to see past RLS, but it returns a single boolean and takes
-- the candidate as its only input, so it discloses nothing beyond whether the
-- name is free — which the public /u/<name> address space already reveals.
create or replace function public.username_available(candidate text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (
    select 1
    from public.card_profiles
    where lower(username) = lower(trim(candidate))
      -- Editing your own card must not report your own handle as taken.
      and (auth.uid() is null or user_id is distinct from auth.uid())
  );
$$;

revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;
