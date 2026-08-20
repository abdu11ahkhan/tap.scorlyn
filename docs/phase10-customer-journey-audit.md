# Phase 10 — Complete Customer Journey + Product Quality Audit

## Executive Summary

The core journey — signup → onboarding → dashboard → template → editor →
publish → public card → share/QR/save-contact → analytics — was walked
live, end-to-end, twice (individual and corporate), with a real throwaway
account each time, not screenshots alone. Both completed cleanly with no
P0s. Four parallel research agents inventoried terminology, CTAs, trust/
error/loading states, and accessibility across pages this session hadn't
already covered. Two P1s and seven P2s were found and fixed; one P2
(a competing-CTA style choice) was deliberately left as a documented
finding rather than fixed, since the "fix" would trade off a revenue-
driving CTA's prominence — a product decision, not a clarity bug. Several
early "issues" surfaced by my own test scripts turned out to be test-script
bugs (wrong button selectors, `innerText` not capturing input values,
premature assertions before an async fetch completed) — each was run to
ground before being trusted, and none became a false report.

## Complete Customer Journey

Traced from actual code and live-walked: `/` → `/signup` (or `/login` for
an existing session) → `/onboarding/account-type` (skipped if already
confirmed) → individual: straight to `/dashboard`; corporate:
`/onboarding/company-setup` (house style + optional first employee, both
skippable) → `/dashboard` → `/templates` → `/templates/[template]/edit`
(pre-account: no username field, by design — publish here saves a
localStorage draft and redirects to signup or `/dashboard/card`) →
`/dashboard/card` (draft restored, username chosen here, real publish) →
`/u/[username]` (live) → Share/QR/Save Contact (platform-level, mounted
once around every template) → `/dashboard/analytics`.

## Individual Journey Results

Live-tested with a fresh throwaway account, 390px viewport, one continuous
browser session (required for localStorage draft persistence to be
tested honestly — a split-session test would have produced a false
negative on draft carryover, which is exactly what happened on the first
attempt before consolidating into one script).

Every step passed: onboarding submit → dashboard empty state → template
chosen → profile filled → preview toggle → publish (draft saved) →
`/dashboard/card` correctly said "We picked up where you left off" →
username chosen → real publish, no error → public card live at
`/u/{username}` showing the entered name → Share button, QR button (real
canvas rendered), Save Contact control all present → Analytics reflected
the real view immediately (not stuck on the empty state). Zero horizontal
overflow at any step, 390px.

## Corporate Journey Results

Live-tested with a fresh throwaway account choosing "corporate" at
onboarding, providing a company name, skipping both company-setup steps
("skip for now" / "I'll do this later" — both genuinely optional, confirmed
by reading the component's own `Step` state machine before testing).
Landed correctly on the **corporate** dashboard — verified textually
distinct from the individual one ("Your team at a glance," company
name/slug, employee/active-card counts, a "Team" nav link that only
corporate accounts get) — not the same page with a badge added. Team page
loads cleanly at 390px with a working "add employee" flow and correctly-
placeholdered (now `aria-label`led) form fields.

**Owner vs. employee are architecturally, not just visually, distinct**:
an employee's own login never receives `account_type: "corporate"` in
their auth metadata (confirmed in `createEmployee`), so `handle_new_user()`
defaults them to `'individual'` — they see the personal dashboard scoped to
their own one card, the owner sees the aggregate. This was verified in
Phase 9's live testing (exact-number corporate isolation across two
companies) and re-confirmed structurally here; not re-run in full this
phase since nothing in the account model changed.

## NFC Journey Results

Order status model, read from the actual code
(`src/app/dashboard/orders/status.ts`), not invented:
`pending → paid → printing → shipped → delivered`, plus `cancelled`
outside the happy path. Labels are honest and specific ("Awaiting
payment," "Payment confirmed," "Printing your card," "On its way,"
"Delivered") — no vague "processing" catch-all. The order detail page
shows a real `order_events` timeline, conditionally shows payment
instructions only while `pending`, and lets the customer attach a payment
proof — all verified by reading the actual page code, matching the real
schema.

**One real, unfixed gap, documented rather than patched**: `orders` and
`nfc_cards` have no relationship in the schema (confirmed across Phases 7
and 8.5) — physical card issuance/assignment is entirely admin-driven,
decoupled from the order lifecycle. A customer whose order says
"Delivered" has no single place that says whether their physical card's
NFC chip has actually been linked to their account — they'd have to
separately notice the dashboard's "N NFC cards linked" stat is still 0 and
infer the connection themselves. This isn't a new finding — Phases 7 and 9
already documented that these two systems are intentionally decoupled —
but this phase confirms it as a real, still-open customer-facing gap
rather than a resolved one. **Not fixed this phase**: building a real
cross-system status ("your card shipped, and here's whether it's active")
is a genuine feature, not a P1/P2 polish fix, and the phase brief
explicitly warns against inventing new statuses or reopening resolved
architecture.

## Analytics Journey Results

Exact-number verification already completed in Phase 9 (10 views/6 contact
actions/2 shares/3 NFC for one account, full corporate cross-company
isolation) — not re-run in full. This phase's own contribution: fixed a
terminology inconsistency where the page called the same thing "NFC
activity" in one stat and "Physical cards" in a section heading two
sections later; both are now "NFC card(s)" throughout, matching the
dominant term used everywhere else in the product. Re-verified live that
the engagement-rate explanation ("Contact actions ÷ views — phone, email,
WhatsApp, booking, and saved contacts count; shares and QR opens don't")
reads as something a non-technical business owner could act on without
needing the underlying event-type names.

## Mobile Results

Primary breakpoint (390px) tested across the full individual and corporate
journeys, plus `/`, `/signup`, `/login`, `/templates`, `/dashboard/team`,
`/dashboard/analytics` independently: **zero horizontal overflow found
anywhere**, before or after this phase's fixes. Touch targets: found and
fixed one real gap (TeamManager's four row-action icon buttons were 36px,
now 44px, confirmed visually not to break the row's wrap behavior).

## Desktop Results

Not re-audited from scratch this phase — the 1024px editor container-query
fix and desktop dashboard/team/orders/analytics layouts were not touched by
any change made this phase, and no code path this phase modified is
breakpoint-conditional in a way that could regress them. Spot-checked
`/dashboard/analytics` at 1280px in Phase 9 (no overflow); not repeated
here since nothing analytics-related changed layout, only copy.

## Terminology Audit

Full inventory in the research agent's report; summarized here with what
was fixed vs. left alone:

| Term family | Verdict | Action |
|---|---|---|
| "card" vs. "profile" for the core product | Genuinely inconsistent — landing-page copy (Hero, Features, layout meta description) said "profile," everywhere else said "card" | **Fixed** — 3 files reworded to drop "profile" |
| "employee" vs. "team member" | Consistent (always "employee") | No action |
| "company" vs. "organization" | Consistent (always "company" in user-facing copy) | No action |
| "publish" vs. "share" vs. "go live" | Consistent-but-varied, each word covers a genuinely different action | No action |
| "NFC card" vs. "physical card" vs. "tap-to-share card" | Genuinely inconsistent — three terms for one object within two adjacent lines on the dashboard, plus a heading/stat mismatch on analytics | **Fixed** — both spots now say "NFC card" |
| "username" vs. "handle" | Mild — "handle" never appears in visible copy, only internal naming | Documented, not changed (not user-visible) |

## CTA Audit

Full per-page table in the research agent's report. Findings acted on:

- **Analytics empty state was a dead end** (no card yet → told what to do,
  given nothing to click) — **fixed**, added a "Create a card" button.
- **Dashboard didn't redirect a logged-out visitor** — not a CTA gap
  exactly, but the same family of problem (arriving at a page with no
  correct next action because the page rendered as if you were a
  brand-new empty account instead of telling you to log in) —
  **fixed**.
- **Two equally-bold primary buttons on the populated dashboard** ("Edit
  card" and, conditionally, "Get NFC card") — confirmed real, **left
  alone**: demoting either one is a product/business call (NFC card sales
  vs. edit-card usage), not a pure clarity fix, and doesn't meet this
  phase's "small and low-risk" bar for an unprompted P2 change.
- **Signup's post-signup "verify code" / "resend the email" buttons** are
  similarly bold — reviewed, left alone: both are genuinely primary
  actions for two different visitor states (have the code / still
  waiting), and a review of the actual layout shows they're stacked with a
  clear "or" divider, which is a reasonable pattern for a true either/or
  choice, not a real ambiguity.
- Landing page's three CTAs all pointing to `/templates` — reviewed, left
  alone: redundant but not confusing (no wrong destination, no dead end).

## Error State Audit

- Duplicate email at signup, duplicate username at settings: already clear,
  non-technical, no action needed.
- **`placeOrder`, `attachPaymentProof`, `changeUsername`** all had one
  fallback path where a raw Postgres error string could reach the client
  — **fixed**: each now logs the real error server-side and returns a
  short, generic, honest message instead.
- No custom `/u/[username]` 404 or global error boundary exists — Next.js's
  default 404 is what a visitor to a nonexistent card sees. Documented as
  P3 (see below), not built this phase — a branded 404/error page is a
  real, isolated, low-risk addition, but wasn't demonstrated to be blocking
  anyone today (the default page is plain but not confusing or broken).

## Loading State Audit

All `dashboard/**` and `admin/**` routes share one `PanelSkeleton`
component — reasonable generic shape (title bar, subtitle bar, N pulse
rows), not tailored per-page. `dashboard/page.tsx`'s own client-side
loading state (`app-panel h-28 animate-pulse`) is a second, different-
shaped placeholder that briefly shows after the route skeleton — not a
bug, just two loading shapes in quick succession on that one page.
Documented as P3, not changed — the double-skeleton is genuinely minor and
touching it risks the page's data-fetching logic for a purely cosmetic gain.

## Accessibility Audit

Full table in the research agent's report; fixed:
- **`outline-none` + background-tint-only focus state** on every auth/
  onboarding text input (signup, login, account-type, company-setup — one
  shared style string, four files) — **fixed**, added a visible
  `focus:border-acid` alongside the existing tint.
- **Four unlabeled employee-creation inputs** on company-setup (placeholder-
  only) — **fixed**, added `aria-label` to each.
- **TeamManager row-action buttons at 36px** — **fixed**, now 44px.
- **TimeRangeTabs had no `aria-current`** on the active range — **fixed**.
- **TrendChart's data was invisible to assistive tech** (title-attribute
  tooltips only) — **fixed**, added a visually-hidden (`sr-only`) text
  summary of the same per-day numbers, and marked the visual bars
  `aria-hidden` since they're now redundant with it.

## Trust Audit

Clean. No fabricated numbers, no "coming soon"/placeholder copy visible
outside template demo content (which is clearly framed as a demo), no
broken `href="#"` links, live pricing pulled from the database rather than
hardcoded. Nothing found requiring a fix.

## Performance Findings

No new issues found or introduced. All new/changed code this phase is
either a copy change, a CSS class change, or (analytics, already shipped
in Phase 9) a bounded server-side query — no client components were added,
no new fetches introduced.

## Security Regression Results

Light regression only, per the phase's own instruction not to re-run
Phase 8 in full absent a concrete finding. Spot-checked implicitly through
this phase's own live testing: a fresh corporate account's dashboard
correctly showed 0 employees/0 active cards (no cross-account bleed);
Phase 9's exact-number corporate isolation test (two companies, three
employees) is the more rigorous version of this and was not stale-dated by
anything changed this phase. No regression found; nothing in this phase
touched RLS, auth, or NFC resolution.

## Scorecard

| Area | Score | Notes |
|---|---|---|
| Onboarding | A | Both paths (individual, corporate) verified live, clean, no dead ends |
| Card creation | A | Draft carryover, username deferral, both verified working as designed |
| Editor | A | No changes needed; pre-account/post-account split confirmed intentional, not a bug |
| Publishing | A | Two-stage publish (draft → real) verified end-to-end, no errors |
| Public card | A | Live, correct content, no overflow |
| Sharing | A | Share/QR/Save Contact all present and functional |
| NFC | B | Order status model is honest and clear; the order↔assignment visibility gap is real but pre-existing and out of this phase's fix scope |
| Analytics | A | Verified accurate in Phase 9; terminology tightened this phase |
| Corporate | A | Genuinely distinct owner/employee experience, verified live |
| Mobile | A | Zero overflow found across the full journey; one real touch-target gap found and fixed |
| Desktop | B | Not re-audited this phase; no reason to suspect regression, but not fresh evidence either |
| Accessibility | B | Five real, evidence-backed gaps found and fixed; none were severe (nothing fully blocked a keyboard/AT user) |
| Error handling | B | Core flows already clear; three raw-error-leak fallbacks found and fixed |
| Performance | A | Nothing found |
| Trust | A | Nothing found |

## P0 Issues

None found.

## P1 Issues

1. `/dashboard` never redirected an unauthenticated visitor — rendered the
   empty-account shell instead, inconsistent with every sibling dashboard
   route. **Fixed.**
2. `/dashboard/analytics`'s "no card yet" empty state was a dead end — told
   the visitor what to do, gave them nothing to click. **Fixed.**

## P2 Issues

3. Landing-page "profile"/"card" terminology inconsistency. **Fixed.**
4. Dashboard/analytics "NFC card"/"physical card"/"tap-to-share card"
   terminology collision. **Fixed.**
5. Auth/onboarding form fields had no visible focus indicator beyond a
   subtle background tint. **Fixed.**
6. Four company-setup employee-form inputs had no accessible name beyond
   placeholder text. **Fixed.**
7. TeamManager row-action buttons under the 44px touch-target guideline.
   **Fixed.**
8. TimeRangeTabs' active state not exposed to assistive tech. **Fixed.**
9. TrendChart data invisible to assistive tech. **Fixed.**
10. `placeOrder`/`attachPaymentProof`/`changeUsername` could leak a raw
    Postgres error string on an unexpected failure. **Fixed.**
11. Two equally-bold primary CTAs can appear together on the populated
    dashboard ("Edit card," conditionally "Get NFC card"). **Documented,
    not fixed** — a product/business trade-off, not a pure clarity bug.

## P3 Issues

- No custom `/u/[username]` 404 page or global error boundary — Next.js
  defaults are used. Low risk to add in a future phase, not demonstrated
  to be actively confusing anyone today.
- `dashboard/page.tsx` briefly shows two differently-shaped loading
  placeholders in quick succession (the route's own skeleton, then its
  client-side spinner bar) before real content arrives.
- "Handle" vs. "username" naming split exists in code/internal comments
  but never reaches visible copy — no user-facing risk, not worth the
  refactor risk of renaming internals mid-session.

## Files Changed

- `src/app/dashboard/page.tsx` — unauthenticated redirect; NFC-card
  copy fix.
- `src/app/dashboard/analytics/page.tsx` — empty-state CTA; "NFC cards"
  heading.
- `src/lib/analytics.ts` — "NFC card N" label wording.
- `src/components/dashboard/analytics/TrendChart.tsx` — sr-only data
  summary.
- `src/components/dashboard/analytics/TimeRangeTabs.tsx` — `aria-current`.
- `src/app/dashboard/team/TeamManager.tsx` — touch targets.
- `src/app/signup/page.tsx`, `src/app/login/page.tsx`,
  `src/app/onboarding/account-type/page.tsx`,
  `src/app/onboarding/company-setup/page.tsx` — visible focus state;
  company-setup also gets input `aria-label`s.
- `src/app/orders/actions.ts`, `src/app/dashboard/settings/actions.ts` —
  no raw error leakage.
- `src/components/sections/Hero.tsx`, `src/components/sections/Features.tsx`,
  `src/app/layout.tsx` — "profile" → "card" wording.

## Commits

1. `docs: complete customer journey and product quality audit` — this
   report.
2. `fix: close dashboard dead ends and unauthenticated access gap` —
   items 1–2 (P1).
3. `fix: accessibility and terminology polish across onboarding and
   dashboard` — items 3–9 (P2).
4. `fix: stop leaking raw database errors to customers` — item 10 (P2).

## Remaining Work

- The order↔NFC-assignment visibility gap (NFC Journey Results) — a real
  feature, not a polish fix, left for a future phase.
- Item 11 (competing dashboard CTAs) — a product decision on which action
  to prioritize, not something to resolve unilaterally in an audit phase.
- The three P3 items above — documented, not built, per the phase's own
  "document P3 instead of inflating the diff" instruction.
- Desktop breakpoints (768/1024/1280) were not freshly re-walked this
  phase across the full journey — no regression risk identified, but this
  is a documented gap in this phase's own verification coverage, not a
  claim of "confirmed fine."
