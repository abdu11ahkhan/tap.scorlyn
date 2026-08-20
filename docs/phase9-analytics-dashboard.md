# Phase 9 — Analytics + Business Intelligence Dashboard

## Existing Analytics Architecture

`card_taps` (extended in Phase 7, corrected/reconciled in Phases 8/8.5) is
the sole event store. Every row carries `event_type`, `source`
(`nfc`/`qr`/`link`), `nfc_card_id` (nullable, resolved server-side against
`resolve_nfc_card()` — never client-trusted), `card_profile_id`,
`visitor_hash`, `created_at`. Before this phase, the only things surfaced
from it were: `/dashboard`'s single lifetime `taps` count (`event_type =
'view'`, no time window, no breakdown) and `/admin`'s platform-wide 14-day
view chart (hand-rolled div bars, old acid-palette classes). No per-card,
no per-employee, no time-range, no event-type breakdown, no NFC breakdown
existed anywhere in the product.

## Event Taxonomy

| Event | Meaning | Dashboard metric |
|---|---|---|
| `view` | Card page opened | Views |
| `phone_click` | Tapped a phone/tel: link | Contact actions |
| `email_click` | Tapped a mailto: link | Contact actions |
| `whatsapp_click` | Tapped a WhatsApp link | Contact actions |
| `booking_click` | Submitted a mailto-form (Booking/Reply) | Contact actions |
| `contact_save` | Saved the vCard | Contact actions |
| `share` | Completed a native share, copy-link, or WhatsApp-send | Shares |
| `qr_open` | Opened the QR sheet | Event breakdown only (not a top-level stat — opening a QR code isn't itself an outcome) |
| `website_click` | Tapped a generic outbound link | Event breakdown only |
| `social_click` | Tapped a recognized social link (target = network) | Event breakdown only |

No event type was renamed. `nfc_card_id IS NOT NULL` (on any event type,
not just `view`) is what "NFC activity" measures — a phone click that
happened during an NFC-originated visit counts, not just the view itself.

## Metrics Available

Views, contact actions, shares, NFC-attributed activity, total
interactions (everything except `view`), event-type distribution,
daily views/interactions time series, per-card breakdown (views/
interactions/NFC), per-physical-card breakdown (ordinal-labeled, no raw
codes), engagement rate (defined below) — all computed server-side from
real `card_taps` rows, scoped by the authenticated session.

## Metrics NOT Available

Stated explicitly rather than approximated:
- **Unique visitors.** `visitor_hash` is `sha256(salt:ip:ua:day)` —
  salted *per day*, by design (Phase 7's own privacy choice: no raw IP
  ever stored). The same real person visiting on two different days
  produces two different hashes. Any "unique visitors over N days" number
  built from this would systematically over-count real humans and imply a
  precision the data can't support. **Not currently measurable from
  existing telemetry.**
- **Bounce rate / time on page.** No duration or scroll-depth tracking
  exists. **Not currently measurable.**
- **Geographic breakdown.** No location data is stored anywhere.
  **Not currently measurable.**
- **"Leads."** No CRM/lead concept exists in the schema. This word is not
  used anywhere in the new dashboard.
- **Conversion funnels below the account level** (e.g. "which specific
  visitor viewed then called") — `visitor_hash` isn't a stable per-visit
  identifier across event types in a way that's safe to stitch into a
  funnel without risking a false individual-level correlation. Only
  aggregate counts are shown.

## Dashboard Information Architecture

One page, `/dashboard/analytics`, not five: Overview (4 stat cards) →
Engagement rate → Trends (one chart) → Event breakdown → Cards (only
when the account has more than one) → Physical cards (only when more
than one NFC card exists). Empty sections don't render — a single-card
account never sees an empty "Cards" table.

## Individual Dashboard

Server component. Cards scoped by `card_profiles.user_id = auth.uid()`.
An account with one card sees Overview + Trends + Event breakdown; an
account with several (the schema already permits multiple cards per
individual, confirmed via the existing `CardList` component) additionally
sees the per-card table, each row linking to the live public card.

## Corporate Dashboard

Reached by the same page and route — no separate page, no duplicated
layout. `profiles.account_type === 'corporate'` switches the query scope
from `user_id` to `org_owner_id`, aggregating every employee card the
owner has. This required one new RLS policy (see below) since none
existed for a corporate owner to read employee `card_taps` at all before
this phase. An **employee's own login** never hits this branch — their
`profiles.account_type` defaults to `'individual'` (confirmed in
`createEmployee`'s `auth.admin.createUser` call, which sets no
`account_type` in user metadata) — so an employee sees exactly the
Individual Dashboard, scoped to their own single card, via the pre-existing
"Owners can read taps on their own cards" policy. No new code path was
needed to enforce this separation; it falls out of the existing account
model correctly.

## NFC Analytics

`nfc_card_id IS NOT NULL` drives the "NFC activity" stat and the optional
"Physical cards" section (only rendered when an account has more than one
NFC card — with exactly one, the top-level stat already says everything
there is to say). Physical cards are labeled `"Physical card 1"`,
`"Physical card 2"`, ... by issuance order — never the raw `card_url` code
or the internal `nfc_card_id` UUID, matching Phase 8's enumeration-
resistance posture.

## Mobile UX

Primary target 360-430px, verified at 390px live. Stat cards:
`grid-cols-2` (2-up) below `sm:`, matching the existing dashboard's own
stat-grid convention. Time-range pills: horizontally scrollable, `min-h-11`
tap targets. The per-card table reuses the app's existing `.app-table`
mobile card-collapse CSS verbatim (confirmed compatible before writing any
markup — `data-label="Card"` is already special-cased in that stylesheet
as the leading identity cell). Zero horizontal overflow confirmed live at
390px and 1280px for every account tested.

## Authorization Model

No query on this page ever trusts a client-supplied id. Which
`card_profile_id`s are ever considered is derived exclusively from
`auth.uid()` via the session, filtered server-side by `user_id` or
`org_owner_id` depending on account type — the same columns RLS itself
checks, so this is belt-and-suspenders on top of the database's own
enforcement, not a substitute for it. The only client-influenced input is
`?range=`, validated against a fixed 4-value allowlist (`7d`/`30d`/`90d`/
`all`) and used only to pick a time window, never to select which cards or
rows are visible.

**One new migration was required** — `050_corporate_card_taps_visibility.sql`
— because `card_taps`' only pre-existing non-admin SELECT policy checked
`card_profiles.user_id = auth.uid()`, which has no path from a corporate
owner to their employees' cards. Added a second SELECT policy checking
`card_profiles.org_owner_id = auth.uid()`, mirroring the exact pattern
already used for `card_profiles` itself (`040_corporate_accounts.sql`) —
same relationship, same shape, applied to the sibling table. Verified live
after applying: an owner correctly sees their employees' combined data;
a second, unrelated company's owner sees none of it.

## Database Queries

Per page load: one `card_profiles` query (id/username/full_name, scoped by
session), one bounded `card_taps` query (`event_type, created_at,
card_profile_id, nfc_card_id, source`, filtered by `card_profile_id IN
(...)` and the time-range cutoff, capped at 10,000 rows — the same
bounded-fetch-then-aggregate-in-JS pattern the platform-wide admin
dashboard already uses, just scoped per-account and time-windowed rather
than fetching everything), one `nfc_cards` query (id/created_at only).
Three queries total, no N+1, no per-row round trips, nothing shipped to
the client beyond the page's own rendered HTML (this is a Server
Component — the raw rows never reach the browser as JSON).

## Test Data

Two individual accounts, one 4-employee corporate structure across two
companies, real Supabase auth users, real `card_taps` rows inserted
directly (bypassing the app, to control exact counts):

- **Account A**: 10 views (3 NFC-sourced), 3 phone, 2 WhatsApp, 1 email, 2
  shares — 18 rows, 3 NFC-attributed.
- **Account B**: 5 views, 1 phone — 6 rows.
- **Company A**: Employee A (8 views, 2 email), Employee B (4 views, 1
  WhatsApp) — 15 rows combined.
- **Company B**: Employee C (3 views) — must never appear for Company A.

## Exact Expected vs Actual Results

All verified live via real logins (Puppeteer, isolated browser contexts
per account — reusing one context across logins was tried first and
correctly failed, since an already-authenticated session redirects away
from `/login` before the form even renders, which is itself a correct
security property, not a bug) reading the rendered DOM, not screenshots
alone:

| Account | Metric | Expected | Actual |
|---|---|---|---|
| A | Views | 10 | **10** |
| A | Contact actions | 6 | **6** |
| A | Shares | 2 | **2** |
| A | NFC activity | 3 | **3** |
| A | Engagement rate | 60% | **60%** |
| B | Views | 5 | **5** |
| B | Contact actions | 1 | **1** |
| B | Engagement rate | 20% | **20%** |
| Corp Owner A | Views (combined) | 12 | **12** |
| Corp Owner A | Contact actions | 3 | **3** |
| Corp Owner A | Engagement rate | 25% | **25%** |
| Corp Owner A | Per-employee table | Emp A: 8v/2i, Emp B: 4v/1i | **Emp A: 8/2, Emp B: 4/1** |
| Corp Owner A | Mentions Company B anywhere | No | **No** |
| Employee A | Views (own card only) | 8 | **8** |
| Employee A | Contact actions | 2 | **2** |
| Corp Owner B | Views | 3 | **3** |
| Corp Owner B | Mentions Company A/Employee A/B | No | **No** |

A real bug was found and fixed during this testing, not before it: the
trend chart's bars computed the correct percentage height (confirmed via
the rendered `title`/`style` DOM attributes — `height:55.5%` was already
correct) but rendered visually as a flat empty line, because the outer
row used `items-end`, which left each day-column's height indeterminate —
a percentage height can't resolve against an indeterminate parent, so it
silently collapsed regardless of the number. Fixed by removing `items-end`
so each column stretches to the chart's fixed height; re-verified with a
direct screenshot of just the chart panel showing the correct gold/gray
stacked bar on the one day with real activity.

A second, unrelated issue was found in the test harness itself, not the
product: seeding the corporate owners' `account_type` via `.upsert()`
without including `email` caused PostgREST to null-fill the omitted
NOT-NULL `email` column and silently roll back the whole upsert (the test
script hadn't checked the error). Switched to `.update()` since the
profile row already existed via the signup trigger — not an app bug, a
test-script bug, corrected before drawing any conclusion from the result.

All test accounts, cards, NFC cards, and `card_taps` rows deleted after
verification.

## Commits

1. `fix: grant corporate owners read access to employee analytics` —
   migration `050`.
2. `feat: add analytics dashboard` — `src/lib/analytics.ts`,
   `src/app/dashboard/analytics/page.tsx`,
   `src/components/dashboard/analytics/TimeRangeTabs.tsx`,
   `src/components/dashboard/analytics/TrendChart.tsx`, sidebar nav link.

## Remaining Limitations

- The 10,000-row cap per page load is generous for current volume but not
  infinite — an account with genuinely enormous `all time` activity would
  eventually need a real SQL aggregation RPC instead of fetch-then-reduce.
  Not built speculatively; the existing platform-wide admin dashboard uses
  the identical pattern at a lower cap (5,000) today, so this isn't a new
  class of risk.
- No dashboard visualization of `source` (`nfc`/`qr`/`link`) breakdown
  beyond what feeds the NFC activity stat — the admin platform-wide
  dashboard already has a coarser version of this; a per-account version
  was considered out of scope for "a small number of useful summary cards"
  and left undone rather than added speculatively.
- Corporate "top-performing employee" is answerable today only as "highest
  views/interactions in the per-employee table," sorted by views — there's
  no separate ranked "leaderboard" widget, since the table already answers
  the question without a second, redundant view of the same numbers.
