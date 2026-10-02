-- =====================================================================
-- Run AFTER the code that reads public_card_profiles (065) is deployed.
--
-- Removes the policy that let anyone read every column of a published
-- card_profiles row. Public pages now read the public_card_profiles view;
-- the full row stays readable by its owner, their company owner and admins
-- through the policies that already exist for them.
-- =====================================================================

DROP POLICY IF EXISTS "Anyone can view a published card profile." ON public.card_profiles;
