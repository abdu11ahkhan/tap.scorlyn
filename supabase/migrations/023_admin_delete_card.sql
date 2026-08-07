-- Admins can remove a card.
--
-- They could already read every card and unpublish one, but unpublishing only
-- hides it and keeps the handle reserved. Without a DELETE policy the delete
-- would match zero rows and report success, which is worse than refusing.
drop policy if exists "Admins can delete a card." on public.card_profiles;
create policy "Admins can delete a card."
  on public.card_profiles
  for delete
  using (public.is_admin());
