-- =====================================================================
-- "Order an NFC card" — a fast-track order flow (destination link + a
-- physical card finish + delivery details, one page) that skips the
-- profile-builder/template-editor entirely. It still creates a real
-- account-owned card and a real order (Q: "still requires an account"),
-- but these need a look from admin before printing since nobody walked
-- through the normal template/preview flow to double-check anything.
--
-- is_quick_order tags exactly that: which orders came through the fast
-- path, so admin can filter to them as their own queue rather than mixing
-- them anonymously into every other order.
-- =====================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS is_quick_order BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS orders_quick_order_idx
  ON public.orders (created_at DESC)
  WHERE is_quick_order = true;
