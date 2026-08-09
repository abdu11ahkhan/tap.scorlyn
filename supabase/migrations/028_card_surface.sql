-- A background colour of the customer's choosing.
--
-- Every template ships one fixed palette, so two people on the same template
-- have identical cards. This lets them pick the ground it sits on.
--
-- Constrained by the editor to the template's own lightness: the templates
-- hardcode roughly two hundred text colours as white-on-dark or black-on-light,
-- so a dark template can take any dark surface and a light one any light
-- surface, but crossing over would make the text unreadable in places nobody
-- would think to check.
alter table public.card_profiles
  add column if not exists surface_color text;

comment on column public.card_profiles.surface_color is
  'Overrides the template background. Null keeps the template as designed.';
