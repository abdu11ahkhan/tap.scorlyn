-- =====================================================================
-- Phase 11.5 continued — 051 gave a corporate owner the order and NFC
-- rows themselves, but /dashboard/orders/[id] also reads order_events for
-- the history timeline, and that table's only non-admin SELECT policy
-- checks orders.user_id = auth.uid() (the order's own owner, i.e. the
-- employee) — an owner opening an employee's order would see the order but
-- silently get an empty history section. Same fix, same shape, one more
-- sibling table.
-- =====================================================================

CREATE POLICY "Corporate owners can view their employees' order history."
  ON public.order_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.card_profiles cp ON cp.id = o.card_profile_id
      WHERE o.id = order_events.order_id AND cp.org_owner_id = auth.uid()
    )
  );
