-- 068: new cards are ready to request straight away.
--
-- Before: a freshly generated card was held back (claimable = false) until
-- an admin released it, so scanning one said "This card isn't ready yet".
-- Now cards are released by default: scanning one lets the customer sign
-- in and send an activation request, which an admin approves from
-- Admin → Card requests (unchanged). The activation code on the packaging
-- still activates instantly when used. Admins can still hold cards back.
--
-- Existing unassigned stock is released too. Safe to run more than once.

ALTER TABLE public.nfc_cards ALTER COLUMN claimable SET DEFAULT true;

UPDATE public.nfc_cards
SET claimable = true
WHERE status = 'in_stock' AND card_profile_id IS NULL AND user_id IS NULL AND claimable = false;
