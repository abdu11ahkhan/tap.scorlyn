-- A record of what admin changed on someone else's card.
--
-- Until now an admin editing a customer's card was indistinguishable from the
-- customer doing it: same table, same columns, no trace of who typed what. That
-- is fine with one admin and unauditable with three.
--
-- Written by a trigger rather than by the server actions, because the admin
-- editor talks straight to PostgREST — anything that logs in application code
-- is bypassed by the very writes most worth recording.

create table if not exists public.admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id),
  actor_email text,
  action text not null check (action in ('insert', 'update', 'delete')),
  entity text not null,
  entity_id uuid,
  /** Human-readable target, so a deleted row still says whose it was. */
  entity_label text,
  /** {column: {from, to}} — only what actually changed. */
  changed jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_created_idx on public.admin_audit (created_at desc);
create index if not exists admin_audit_entity_idx on public.admin_audit (entity, entity_id);

alter table public.admin_audit enable row level security;

-- Readable by admins, written only by the trigger below (which is SECURITY
-- DEFINER). Deliberately no insert/update/delete policy: an audit trail that
-- its subjects can edit is not an audit trail.
drop policy if exists "Admins read the audit trail" on public.admin_audit;
create policy "Admins read the audit trail"
  on public.admin_audit for select
  using (public.is_admin());

create or replace function public.log_admin_card_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  diff jsonb := '{}'::jsonb;
  col text;
  old_j jsonb;
  new_j jsonb;
  owner uuid;
  label text;
begin
  -- Only when an admin touches a card that is not their own. A customer
  -- editing their own card is ordinary use, not something to record.
  owner := coalesce(new.user_id, old.user_id);
  if auth.uid() is null or auth.uid() = owner or not coalesce(public.is_admin(), false) then
    return coalesce(new, old);
  end if;

  old_j := to_jsonb(old);
  new_j := to_jsonb(new);
  label := coalesce(new.username, old.username);

  if tg_op = 'UPDATE' then
    for col in select jsonb_object_keys(new_j) loop
      -- updated_at moves on every write and would bury the real changes.
      if col in ('updated_at') then continue; end if;
      if new_j -> col is distinct from old_j -> col then
        diff := diff || jsonb_build_object(
          col, jsonb_build_object('from', old_j -> col, 'to', new_j -> col)
        );
      end if;
    end loop;

    -- Nothing actually changed: a save that rewrote identical values.
    if diff = '{}'::jsonb then
      return new;
    end if;
  elsif tg_op = 'DELETE' then
    diff := jsonb_build_object('username', jsonb_build_object('from', label, 'to', null));
  end if;

  insert into public.admin_audit (actor_id, actor_email, action, entity, entity_id, entity_label, changed)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    lower(tg_op),
    'card_profiles',
    coalesce(new.id, old.id),
    label,
    diff
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists log_admin_card_change on public.card_profiles;
create trigger log_admin_card_change
  after insert or update or delete on public.card_profiles
  for each row
  execute function public.log_admin_card_change();
