-- =====================================================================
-- Phase 8 — P0. nfc_cards has carried a self-service "Users can manage
-- their own NFC cards." FOR ALL USING (auth.uid() = user_id) policy since
-- schema.sql, from before physical stock issuance became admin-only
-- (004/005_admin_control.sql). It was never revoked when that changed.
--
-- FOR ALL with no explicit WITH CHECK defaults WITH CHECK to the same
-- clause as USING — so any authenticated user can INSERT/UPDATE/DELETE
-- their OWN nfc_cards rows. The clause only constrains user_id, never
-- card_profile_id, so a user can self-insert (or repoint an existing) row
-- with user_id = themselves but card_profile_id = any other published
-- card's id. Confirmed live: this is exploitable to inject fabricated
-- "physical tap" attribution onto a victim's analytics — resolve_nfc_card()
-- resolves the forged code correctly, because from the database's point of
-- view it's a perfectly legitimate row.
--
-- Fix: drop the self-service FOR ALL policy. Replace with owner SELECT
-- only — dashboard/page.tsx already reads a customer's own nfc_cards count
-- this way, and it's the only legitimate self-service read that exists.
-- Physical card issuance/assignment stays admin-only via the 004/005
-- policies, already correctly scoped and left untouched.
-- =====================================================================

DROP POLICY IF EXISTS "Users can manage their own NFC cards." ON public.nfc_cards;

CREATE POLICY "Owners can view their own NFC cards."
  ON public.nfc_cards FOR SELECT
  USING (auth.uid() = user_id);
