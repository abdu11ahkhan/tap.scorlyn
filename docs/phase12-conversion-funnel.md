# Phase 12 — Physical NFC Conversion & Commerce

## ⚠️ Critical finding, out of scope, fixed separately

While browser-testing this phase with a genuinely cookie-less request, `/u/[username]` and `/api/tap` were returning "not found" for real, published cards. Root cause: a prior-phase migration (`049_reconcile_function_grants.sql`) revoked `anon`'s EXECUTE on `is_admin()`, which is also referenced by the admin SELECT policy on `card_profiles` — Postgres RLS evaluates every applicable policy during planning, so a role that can't even *call* a function referenced in any policy on a table gets a hard error on the whole query, masking the separate "Anyone can view a published card profile" policy. This broke anonymous card viewing and NFC tap resolution — the core no-account path — since that migration was applied. Fixed in `supabase/migrations/053_fix_anon_is_admin_execute.sql`, committed and pushed separately (`48c058e`) ahead of this phase's work, since it's a live P0 unrelated to the conversion-funnel scope. Verified: a cookie-less request to `/u/[username]` went from 404 to 200-with-content after the fix.

## Funnel Audit — What Exists Today

Mapped via four parallel research passes across the codebase (not assumed):

**Entry points**: `/dashboard/nfc` is the single purchase entry point, linked from the dashboard nav, quick actions, a post-publish banner, the corporate dashboard, and — until this phase — a dead-end per-employee link in the team roster. Pricing (`plans` table: `basic` ₨0, `printed` ₨1600, `custom` ₨2200) is shown as a real number up front, no click-through, no urgency/scarcity copy (bare functional framing).

**Checkout**: two screens — a plan/finish chooser (`NfcChooser.tsx`), then `/dashboard/orders`'s `OrderForm.tsx` (design, delivery fields, quantity, total). Server-side price re-derivation only (client price never trusted). No dedicated confirmation page — success redirects straight into the order-detail page, which for a paid plan immediately shows the payment-transfer panel.

**Payment proof**: single upload button, 5MB cap, no progress indicator, no distinct "received, under review" state beyond the button itself.

**Emails**: only three transactional templates existed — welcome, a generic internal notice, and a paid-receipt (sent only when an admin manually marks an order `paid`). **Shipped, delivered, NFC-assigned, and first-tap had zero customer-facing signal** — a customer's only way to learn any of those happened was to open the dashboard themselves.

**Admin fulfillment**: a flat status dropdown (`pending→paid→printing→shipped→delivered→cancelled`), no tracking-number/courier field, and — critically — **no cross-navigation between orders and NFC assignment**: an admin marking an order `delivered` had no reminder anywhere to go assign a physical card. The two screens were entirely disconnected, matching exactly the honest "delivered, unassigned" gap Phase 11 built the customer-facing UI to surface, but which had no operational fix-it path for the person who'd actually close it.

**Reorder**: present on the order-detail page (not the list), but dropped the original `card_design` (finish/fields/accent) — a customer reordering the same card lost their previous design choice and started over.

**Corporate**: no bulk-ordering path existed at all. Every "order NFC" CTA — individual, corporate owner, and the team roster's per-employee link — pointed at the same flow, which only ever orders for the *signed-in account's own* `card_profiles` row. **A corporate owner had no way to place a physical-card order tied to an employee's card.**

**Funnel analytics**: none. No event tracking distinct from `card_taps` (which measures a *published card's* visitor engagement, not the purchase path) exists anywhere — no "viewed pricing," "started checkout," or "abandoned" signal. `admin/orders` is a revenue/fulfillment list, not a conversion funnel.

**Mobile checkout, error/empty states**: already solid on inspection — `OrderForm.tsx` is single-column-first with `sm:` breakpoints, real server-side error handling with a clear retry message, and the zero-orders state degrades gracefully (the form itself just becomes the whole page). No duplicate-pending-order guard exists, but this wasn't touched — it wasn't clearly a bug (a customer legitimately might place two orders) and blocking it risked false friction.

## What Was Built — Improving the Existing Machinery, Not Replacing It

Per the brief's explicit constraint, nothing here invents a new payment/order system. Every change reads or writes the existing `orders`/`nfc_cards`/`card_taps`/`plans` tables through the existing action patterns.

**1. Corporate per-employee ordering** (`src/app/dashboard/team/actions.ts` — `placeEmployeeOrder`, `src/app/dashboard/team/OrderForEmployeeModal.tsx`): the team roster's "No NFC order" link is now a button that opens an inline order form scoped to that employee. The new action reuses `ownedEmployeeCard` (the same ownership check `suspendEmployee`/`deleteEmployeeCard` already use) and the same phone/price validation `placeOrder` uses. The resulting order's `user_id` is the **employee's own** id — matching how `assignNfcCard` already sets `nfc_cards.user_id` to the card's owner, not the assigner — so the employee's own dashboard shows it immediately through the existing "Customers see their own orders" policy, and the owner sees it through the corporate-owner orders policy Phase 11.5 already added. No new RLS needed. Writing needs the service role because the INSERT policy on `orders` requires `auth.uid() = user_id`, and the owner's session isn't the employee's — the exact same reason `createEmployee` already uses the service role.

**2. Delivery → assignment handoff, admin side** (`src/app/admin/orders/page.tsx`): a new "delivered, unassigned" stat card — computed by diffing delivered orders' `card_profile_id`s against `nfc_cards` — links to a `?unassigned=1` filter showing exactly the orders needing a card linked. This closes the loop Phase 11 could only expose to the customer; now the operator who can actually fix it has a place to look.

**3. Shipped and delivered emails** (`src/lib/email.ts` — `sendShipped`, `sendDelivered`; wired into `setOrderStatus` in `src/app/admin/actions.ts`): same shape and same "only the rows that actually moved" guard as the existing paid-receipt email. Not extended to `printing` (a waiting state with nothing to act on) or `cancelled` (deserves a human message, not a template) — deliberately scoped to the two states that had a real, silent gap.

**4. First-tap signal** (`src/lib/email.ts` — `sendFirstTap`; wired into `src/app/api/tap/route.ts`): derived, not a new event — before inserting a tap, the route checks whether any `card_taps` row already exists for that `nfc_card_id`; if none, this is genuinely the first, and a one-time email fires after the insert succeeds. No new column, no new event type, no change to `card_taps` semantics (Part 17's constraint from Phase 11, still honored). Verified live: first tap on a fresh NFC assignment recorded exactly one `card_taps` row and the endpoint returned `{ok:true}` without error.

**5. Reorder keeps the card design** (`src/app/orders/actions.ts` — `reorder`): now forwards the original order's `card_design` (finish/fields/accent) into the new order instead of silently discarding it.

## Files Changed
- `src/lib/email.ts` — `sendShipped`, `sendDelivered`, `sendFirstTap`
- `src/app/admin/actions.ts` — wired shipped/delivered emails into `setOrderStatus`
- `src/app/admin/orders/page.tsx` — "delivered, unassigned" stat + filter
- `src/app/api/tap/route.ts` — first-tap detection + notification
- `src/app/orders/actions.ts` — `reorder` forwards `card_design`
- `src/app/dashboard/team/actions.ts` — `placeEmployeeOrder`
- `src/app/dashboard/team/page.tsx` — fetches `plans` for the new modal
- `src/app/dashboard/team/TeamManager.tsx` — wires up the order-for-employee modal
- `src/app/dashboard/team/OrderForEmployeeModal.tsx` (new)
- `supabase/migrations/053_fix_anon_is_admin_execute.sql` (new — the P0 fix, separate commit)

## Database Changes
One migration, the P0 fix above — a grant, not a schema change. Nothing else needed a migration: every Phase 12 feature reads/writes existing columns.

## Security Impact
No RLS weakened. `placeEmployeeOrder` reuses the existing `assertCorporateOwner` + `ownedEmployeeCard` ownership gate and the service role only to write a row whose `user_id` isn't the caller's own — identical posture to `createEmployee`. `notifyFirstTap` uses the service role only to look up an email address for a system-triggered notification, never returns any data to the anonymous caller. The `is_admin()` grant fix restores intended anonymous access (view a published card) without exposing anything — `is_admin()` deterministically returns `false` for a null `auth.uid()`.

## Tests
- `tsc --noEmit`, `eslint` (all touched files), `next build` — all clean.
- Real browser test: corporate owner opened the team roster, clicked "No NFC order — order one" for a throwaway employee, filled and submitted the modal — DB-verified the resulting order has `user_id = employee`, `card_profile_id = employee's card`; the roster badge updated from "No NFC order" to "Payment pending" live.
- Real browser test: admin walked the same order through paid → printing → shipped → delivered via the real admin UI; DB-verified final `status = 'delivered'` and `payment_verified_at` stamped; the new "delivered, unassigned" stat and `?unassigned=1` filter both correctly surfaced the order.
- Real end-to-end tap test: assigned a fresh NFC card, hit `/api/tap` with a resolved code — confirmed exactly one `card_taps` row recorded with the correct `nfc_card_id`, and the endpoint returned `{ok:true}` (first-tap notification path executed without error).
- Server-side phone validation confirmed live (an accidentally malformed test value was correctly rejected with the existing "11 digits starting 03" message before the fix was even applied — proof the existing `placeOrder`-style validation in `placeEmployeeOrder` works).
- All throwaway accounts/orders/cards/taps created for this phase were deleted; confirmed zero leftover rows.

## Commits
- `48c058e` — P0 fix (anon `is_admin()` grant), pushed first and separately.
- This phase's feature commit follows.

## Remaining Gaps (documented, not fabricated as done)
- No purchase-funnel event tracking was added (viewed pricing / started checkout / abandoned) — flagged as a real gap in the audit, but building a new analytics surface for it was judged out of scope for "improve the journey around existing machinery" and would need its own schema decision, not a quick derivation.
- No duplicate/pending-order guard — a customer can still place two paid orders back to back. Not added: it wasn't confirmed to be an actual problem in practice, and a hard block risks blocking legitimate repeat purchases (e.g. a second card for a second location).
- No dedicated post-checkout "order placed!" acknowledgment screen — success still redirects straight to the order-detail/payment page. Left as-is: the order-detail page already states the reference and next step clearly; inserting an extra screen was judged to add a click without removing real confusion.
- Confirmation-email address is always the account email, not a field on the order form — unchanged, consistent with how the existing receipt email already works.
