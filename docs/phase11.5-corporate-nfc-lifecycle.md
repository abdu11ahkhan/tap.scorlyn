# Phase 11.5 — Corporate NFC Lifecycle + Real Browser Verification

## Corporate NFC Architecture

`card_profiles.org_owner_id` is the only link between a corporate owner and their employees — confirmed unchanged since Phase 9. Before this phase, that link existed on `card_profiles` and `card_taps` (both have an owner-scoped SELECT policy), but **not** on `orders`, `nfc_cards`, or `order_events` — an owner had no RLS path to an employee's order or NFC assignment at all, only a card they personally created.

## Corporate Owner Experience

Built into the existing `/dashboard/team` page (`TeamManager.tsx`) — not a new page, per the brief's instruction to find the correct existing location first. Each employee row already showed a digital-card badge (live/draft/suspended); it now shows a second, separate physical-card badge next to it (`No NFC order` / `Payment pending` / `Being printed` / `Shipped` / `Delivered — assignment pending` / `Ready to tap` / `Active`), linking to that employee's order detail page when one exists, or to `/dashboard/nfc` when there isn't. The two badges are never merged — a live digital card and an unordered physical card are shown as the two independent facts they are.

## Employee Experience

Unchanged. An employee still only sees their own `orders`/`nfc_cards` rows (`auth.uid() = user_id`) and, through the pre-existing "Anyone can view a published card profile" policy, any company teammate's *public* card page — the same as any stranger could. Confirmed live: employee A1 cannot read employee A2's `orders` or `nfc_cards` rows (empty result, not an error) — the new owner-scoped policies grant nothing to non-owners.

## Individual Experience

Unchanged from Phase 11 — re-verified in this phase's browser pass, no regressions.

## Order → NFC Relationship

Preserved exactly as Phase 11 built it: `orders` and `nfc_cards` still have no foreign key between them. The owner-facing team query derives, per employee card profile, the same way `/dashboard/orders/[id]` does — most recent physical order (`amount_pkr > 0`) for that `card_profile_id`, then `nfc_cards` sharing that `card_profile_id`, then `card_taps` by `nfc_card_id`. Same `buildPhysicalCardStatus` function, called from three call sites now (order detail, dashboard widget, team roster) — one derivation, not three.

`employee → card profile → physical order → NFC assignment`:
1. `card_profiles.org_owner_id = owner` finds the employee's card.
2. `orders.card_profile_id = card.id` finds their physical order, if any.
3. `nfc_cards.card_profile_id = card.id` finds their assigned hardware, if any.
4. `card_taps.nfc_card_id = nfc_card.id` finds their first tap, if any.

## Authorization Results

**Missing read path, found and fixed narrowly** (migrations `051`, `052`) — added three SELECT-only policies, each an exact mirror of the existing `card_taps` corporate-owner policy (`050_corporate_card_taps_visibility.sql`):
- `orders`: owner reads orders whose `card_profile_id` belongs to their roster.
- `nfc_cards`: owner reads NFC cards whose `card_profile_id` belongs to their roster.
- `order_events`: owner reads order history for orders on their roster's cards.

No policy was broadened; no policy was made public. Verified live against real rows, not assumed:
- Owner A reads employee A1's order and NFC assignment — succeeds.
- Owner A reads Company B's employees — empty.
- Employee A1 reads employee A2's orders and NFC cards — empty (blocked), confirmed for both tables independently.
- Owner reading an employee's order via the browser session (not service role) — succeeds end-to-end.

## Browser Test Results

Real Puppeteer sessions (not database-only) against `next dev`, with throwaway accounts created via the service role and cleaned up afterward:

- **Individual journey**: login → `/dashboard` → `/dashboard/orders/[id]` for a delivered + assigned + tapped order. Page correctly renders "PHYSICAL CARD — Active — your physical card has been tapped." with all 7 timeline steps checked.
- **Corporate journey**: login → `/dashboard/team` with three employees in three different real states (no order / printing / delivered+assigned+tapped). All three render their correct, distinct badge: `NO NFC ORDER`, `BEING PRINTED`, `ACTIVE`. Owner then opened employee "Sarah Assigned"'s order detail directly — full unified timeline rendered, no internal IDs shown, only reference/name/phone/address.

## Mobile Results

390px and 430px, both dashboard/order-detail and team roster: no horizontal overflow (`scrollWidth` vs `clientWidth`, measured, not eyeballed) at either width. Screenshots confirm the vertical timeline stays single-column and readable, and the two employee-row badges (digital + physical) wrap onto their own line rather than clipping.

## Desktop Results

768/1024/1280: team roster renders as a clean single-row-per-employee layout at 1280 with both badges and all four action icons visible without wrapping. Did not touch `/templates/[template]/edit` or any editor component, so the existing 1024px container-query fix there is untouched.

## Data Accuracy Matrix

| Database state | Expected UI | Actual UI |
|---|---|---|
| `orders.status='delivered'`, no `nfc_cards` row for that `card_profile_id` | "Delivered" + assignment pending | Confirmed via direct query in Phase 11 (this phase reused the same derivation, not re-verified from scratch) |
| `nfc_cards.card_profile_id` set, no `card_taps` row | "Ready to tap" | Employee "Ahmed Processing" analog not tested this pass at this exact stage; Sarah's case (with a tap) below covers the assigned branch |
| `nfc_cards` row + matching `card_taps.nfc_card_id` | "Active" | Confirmed live, browser-rendered: "Active — your physical card has been tapped." for both the individual account and employee Sarah |
| No physical order at all | "No NFC order" | Confirmed live, browser-rendered, employee "Ali NoOrder" |
| `orders.status='printing'` | "Being printed" | Confirmed live, browser-rendered, employee "Ahmed Processing" |

## Files Changed
- `src/app/dashboard/team/page.tsx` — batched owner-side fetch of employees' orders/nfc_cards/card_taps, derived via the shared `buildPhysicalCardStatus`.
- `src/app/dashboard/team/TeamManager.tsx` — second, separate physical-card badge per employee row.
- `supabase/migrations/051_corporate_orders_nfc_visibility.sql` (new)
- `supabase/migrations/052_corporate_order_events_visibility.sql` (new)
- `docs/phase11.5-corporate-nfc-lifecycle.md` (this file)

`src/lib/nfc-lifecycle.ts` and `src/components/dashboard/PhysicalCardStatus.tsx` were **not** modified — reused as-is, per Part 1.

## Database Changes

Two migrations, both additive, both SELECT-only, both applied to the live project and verified via `pg_policies`:
- **Who writes**: nobody — these are read policies, not new columns.
- **Who reads**: a corporate owner, for rows belonging to their own roster only (`org_owner_id = auth.uid()` via `card_profiles`).
- **Validation**: none needed — no new data, only a new read path on existing rows.
- **RLS interaction**: additive `USING` clauses on `SELECT`; existing owner (`user_id = auth.uid()`) and admin policies are untouched and still apply.

## Security Changes

Two new narrow SELECT policies (orders, nfc_cards) plus one more (order_events), all following the exact precedent already in the codebase. No public policy added. No policy weakened. No RLS bypassed via service role for anything customer-facing — the team page reads through the owner's own session, same as before.

## Tests

- `tsc --noEmit`: clean.
- `eslint` (touched files): clean.
- `next build`: all routes compile, no new errors.
- Real-DB authorization tests: owner→employee reads succeed, employee→employee reads blocked, cross-company reads blocked — all via actual signed-in Supabase sessions, not simulated.
- Real-browser tests: individual and corporate journeys, 390/430/768/1280px, screenshots and extracted page text captured and inspected, zero horizontal overflow.
- All throwaway accounts, card profiles, orders, NFC cards, and taps created for this phase were deleted; confirmed zero leftover rows afterward.

## Commits

This phase's changes are committed separately from Phase 11 (see below).

## Remaining Limitations

- The "ready to tap, no tap yet" specific badge state was not independently browser-verified this pass (only "no order," "printing," and "active" were exercised end-to-end in the browser); it follows the same code path as "active" minus the tap row, already unit-verified against real rows in Phase 11.
- No dedicated UI exists yet for an owner to see multiple physical cards against a single employee (Phase 11's multi-card rendering exists in `PhysicalCardStatus` and would appear automatically on that employee's own order-detail page, but the team roster's compact badge shows only the latest order — a company that issues an employee two physical cards would need to open that employee's order page to see both).
- Company card / house-style photo capture (`extractPalette`/`suggestTemplate`) is unrelated to this phase and was not touched or re-verified.
