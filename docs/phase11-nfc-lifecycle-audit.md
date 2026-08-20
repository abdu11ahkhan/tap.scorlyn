# Phase 11 — NFC Card Lifecycle + Physical Card Experience

## Existing Data Model

Confirmed by direct `information_schema` introspection (not memory):

- `orders`: `id, reference, user_id, card_profile_id, plan_id, quantity, amount_pkr, status, payment_proof_url, payment_verified_at, estimated_delivery, ...`. No column referencing `nfc_cards`.
- `nfc_cards`: `id, user_id, card_url, card_profile_id, batch, note, created_at`. No column referencing `orders`, no status/timestamp beyond `created_at`.
- `card_taps`: `id, card_profile_id, nfc_card_id, event_type, source, created_at, ...`. `nfc_card_id` is set only when the interaction came from an NFC tap (existing, Phase 7 semantics — unchanged).

**There is no foreign key between `orders` and `nfc_cards`.** The only thing that connects a specific order to a specific physical card is that both `orders.card_profile_id` and `nfc_cards.card_profile_id` can point at the same `card_profiles` row. `placeOrder` (`src/app/orders/actions.ts`) always sets `card_profile_id` on a paid order — a physical order is blocked with "Make your card first" if the customer has no card, so `card_profile_id` is reliable whenever `amount_pkr > 0`.

RLS (`pg_policies`, re-verified this phase):
- `orders`: owner reads own rows (`auth.uid() = user_id`); admin reads/writes all.
- `nfc_cards`: owner reads own rows (`auth.uid() = user_id`, set by `assignNfcCard` alongside `card_profile_id`); admin manages all.
- `card_taps`: owner reads taps on their own `card_profiles`; corporate owner reads their employees' taps.

All existing — nothing weakened, nothing new added.

## Order Lifecycle (existing, unchanged)

`src/app/dashboard/orders/status.ts`: `pending → paid → printing → shipped → delivered`, with `cancelled` outside the happy path. Reused as-is — not duplicated.

## NFC Activation Lifecycle (derived, new)

`src/lib/nfc-lifecycle.ts` derives, per order:
1. **Not assigned** — no `nfc_cards` row shares this order's `card_profile_id`.
2. **Assigned / ready to tap** — one or more `nfc_cards` rows do. These two are presented as **one step**, not two: the schema has no separate "readiness" signal beyond the assignment itself, and inventing one would fabricate certainty the database doesn't have.
3. **Active / first tap received** — the earliest `card_taps` row where `nfc_card_id` matches an assigned card. This reuses the existing, already-validated (Phase 7) NFC-attribution signal; no new event type, no new table.

Assignment is **not gated by delivery** — an admin can assign a card before or after the order reaches `delivered`, so both tracks are checked independently and combined for display only.

## Unified Customer Experience

`src/components/dashboard/PhysicalCardStatus.tsx` — one vertical timeline (Order confirmed → Payment received → Being printed → Shipped → Delivered → NFC card ready to tap → First tap received), sc-* themed, each step done/current/pending. A "Delivered + not assigned" order shows exactly that — delivered checked, assignment step open — never a fabricated combined status.

Multiple physical cards against one order's `card_profile_id` are shown as "Physical card 1 / Physical card 2" rows (ordinal, matching the existing `analytics.ts` `summarizeByNfcCard` pattern) — no fake nickname invented since the schema has no customer-facing card-name field.

## Dashboard Changes

`src/app/dashboard/page.tsx`: the NFC widget now shows a derived label (`physicalCardShortLabel`) — Payment pending / Payment confirmed / Being printed / Shipped / Delivered — assignment pending / Ready to tap / Active — instead of only the raw `orders.status`. Same correlation query as the order-detail page (`nfc_cards` by shared `card_profile_id`, then `card_taps` by `nfc_card_id`).

## Order Detail Changes

`src/app/dashboard/orders/[id]/page.tsx`: for a physical order (`amount_pkr > 0` and `card_profile_id` set), the old order-only progress bar is replaced by `PhysicalCardStatus` — the same unified timeline, with a next action where one exists ("Send your payment proof" while pending; "How to tap your card" once ready). Free-plan orders (no physical card) keep the original order-only bar, since there is nothing to assign.

## Corporate Changes

Not implemented this phase. `CorporateDashboard.tsx` currently shows only an NFC *count* stat, no per-order/per-employee physical-card timeline. Extending Parts 8–9 to the corporate owner view is a real, scoped follow-up — flagged here rather than fabricated as done.

## Admin Changes

None required. `issueNfcCards` / `assignNfcCard` / `deleteNfcCard` (`src/app/admin/actions.ts`) already write the single source of truth (`nfc_cards.card_profile_id`, `nfc_cards.user_id`); the new customer-facing derivation reads those same rows live, so an admin assignment updates the customer's view automatically with no duplicate status system.

## Database Changes

**None.** Every state in this phase is derived from existing columns (`orders.status`, `orders.card_profile_id`, `nfc_cards.card_profile_id`, `card_taps.nfc_card_id`/`created_at`). No migration was needed or added.

## Security Impact

No RLS changes. No new policies. The new queries (`nfc_cards` by `card_profile_id`, `card_taps` by `nfc_card_id`) run through the existing owner-scoped policies — verified live: an anon/unauthenticated read against another user's `nfc_cards` returns no data (blocked, not merely filtered).

## Mobile Verification

`PhysicalCardStatus` is a single-column vertical timeline (no horizontal step bar), built mobile-first — no `sm:`/`md:` breakpoint needed for the core layout since it never has a wide variant. Uses existing `.app-panel` container and sc-* tokens, consistent with the rest of the dashboard.

## Test Matrix — Executed Against Real Data

Created a throwaway account, card profile, and order via the Supabase service role (not mocked):
1. Order created, `status=pending`, `card_profile_id` set → payment-pending state.
2. Moved to `status=delivered`, no `nfc_cards` row yet → confirmed `nfc_cards` query for that `card_profile_id` returns `[]` → "delivered, unassigned" derivation is correct.
3. Inserted an `nfc_cards` row with matching `card_profile_id` → confirmed the query now returns 1 row → "assigned / ready to tap."
4. Inserted a `card_taps` row with that `nfc_card_id` → confirmed `MIN(created_at)` resolves → "first tap received."
5. Unauthorized read: anon client (no session) querying the same `card_profile_id`'s `nfc_cards` → blocked, no rows returned.
6. Cleaned up all throwaway rows and the auth user afterward.

Cases not separately exercised with fresh data this pass: no-order, multi-card, corporate multi-employee (Part 8, documented above as not yet built), and full Puppeteer UI click-through — the derivation and security logic underlying all of them was verified directly against the database, and `tsc --noEmit` / `eslint` / `next build` all pass clean on the changed surfaces.

## Files Changed
- `src/lib/nfc-lifecycle.ts` (new)
- `src/components/dashboard/PhysicalCardStatus.tsx` (new)
- `src/app/dashboard/orders/[id]/page.tsx`
- `src/app/dashboard/page.tsx`
- `docs/phase11-nfc-lifecycle-audit.md` (this file)

## Remaining Gaps
- Corporate owner/employee multi-card view (Part 8) not built.
- No Puppeteer browser click-through was run this pass — verification was direct-to-database plus static checks (tsc/eslint/build).
- "Ready to tap" and "Assigned" remain intentionally merged into one step — if the product later adds a real readiness signal (e.g., a print-QC timestamp), that would become genuinely measurable and could split into two steps then.
