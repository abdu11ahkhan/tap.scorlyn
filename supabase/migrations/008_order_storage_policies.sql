-- =====================================================================
-- Storage policies for payment proofs, plus the order fields the UI needs.
-- Run AFTER 007_profile_extras_and_orders.sql
--
-- The `payment-proofs` bucket is created through the Storage API (it is
-- private). These policies decide who can put things in it and read them.
-- =====================================================================

-- Files are stored as <user_id>/<order_ref>-<timestamp>.<ext>, so the first
-- path segment is the owner. That's what these policies key off.
DROP POLICY IF EXISTS "Owners upload their own payment proof" ON storage.objects;
CREATE POLICY "Owners upload their own payment proof"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owners read their own payment proof" ON storage.objects;
CREATE POLICY "Owners read their own payment proof"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins need to look at every proof to verify payments.
DROP POLICY IF EXISTS "Admins read every payment proof" ON storage.objects;
CREATE POLICY "Admins read every payment proof"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs' AND public.is_admin());

-- A customer replacing a proof they already uploaded.
DROP POLICY IF EXISTS "Owners replace their own payment proof" ON storage.objects;
CREATE POLICY "Owners replace their own payment proof"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'payment-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------
-- Attaching a proof is the one field a customer may change on their own
-- order, and only while it is still unpaid. 007 deliberately gave them no
-- UPDATE policy at all, which meant even that was impossible.
-- ---------------------------------------------------------------------
CREATE POLICY "Customers attach a payment proof to a pending order."
  ON public.orders FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Where the customer wants it delivered, free text, plus an optional note.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_note TEXT;
