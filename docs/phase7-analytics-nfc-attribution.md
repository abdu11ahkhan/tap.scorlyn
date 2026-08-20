# Phase 7 — Analytics + NFC Attribution

## Current Analytics Architecture (before this phase)

One pipeline, `card_taps`, fed exclusively by `TapTracker` (mounted once on
`/u/[username]`, session-deduped via `sessionStorage`) → `POST /api/tap` →
insert. `referral_events` is a separate, deliberately distinct pipeline for
the viral-loop funnel (banner_view/banner_click/signup/order), tied to a
*referrer*, not to visitor engagement with the card being viewed — correctly
left alone this phase, not a competing system.

`card_taps` already carried `card_profile_id`, `nfc_card_id`, `source`
(`nfc`/`qr`/`link`), `visitor_hash` (salted `sha256(ip:ua:day)`, no raw IP
stored), `referrer`, `user_agent` (truncated to 500 chars), `created_at`. It
never carried anything to say *what kind* of interaction a row was — every
row was implicitly a page view, because that was the only thing ever
inserted.

Two dashboards read it: `/dashboard` (owner's own total tap count, RLS-scoped
via the "Owners can read taps on their own cards" policy — the query has no
explicit filter and doesn't need one) and `/admin` (platform-wide
`created_at, source` for a breakdown chart, admin-only).

## Event/Data-Flow Diagram

```
Visitor action                    Client                          Server / DB
───────────────                   ──────                          ───────────
Opens /u/username    ──────▶  TapTracker (session-dedup)  ──▶  POST /api/tap
                                                                  │ resolve nfcCode via
                                                                  │ resolve_nfc_card() RPC
                                                                  │ validate it belongs to
                                                                  │ THIS profile
                                                                  ▼
                                                              INSERT card_taps
                                                              (event_type='view')

Taps phone/email/
whatsapp/website/
social link, or        ──────▶  OutboundClickTracker         ──▶  POST /api/tap
submits a mailto           (one delegated document          (event_type=
form (Booking/Reply)       click listener, classifies            phone_click/
                            from the href, 800ms dedup)           email_click/…)

Taps Share            ──────▶  ShareButton                  ──▶  POST /api/tap
                            (native share success, or             (event_type='share')
                             copy-link, or WhatsApp-send)

Taps QR code           ──────▶  CardQr (open)                ──▶  POST /api/tap
                                                                    (event_type='qr_open')

Taps Save to contacts  ──────▶  SaveContact / CardQr's own    ──▶  POST /api/tap
(anywhere it appears)       save() — both fire the same            (event_type='contact_save')
                             event before letting the real
                             vCard navigation/download proceed

Physical NFC tap       ──────▶  /api/nfc/[cardId]  ──▶  resolve_nfc_card() RPC
                                     │                    (SECURITY DEFINER —
                                     │                     nfc_cards has no public
                                     │                     SELECT policy at all)
                                     ▼
                            302 → /u/username?src=nfc&nfc={code}
                                     │
                                     ▼
                            (feeds into the "Opens /u/username" flow above,
                             now carrying real NFC attribution)
```

## Event Taxonomy

`card_taps.event_type` (CHECK-constrained, migration 044):

| Event | Fired from | target column |
|---|---|---|
| `view` | TapTracker | — |
| `contact_save` | SaveContact, CardQr's own save() | — |
| `share` | ShareButton (native success, copy-link, WhatsApp-send) | — |
| `qr_open` | CardQr (trigger tap) | — |
| `phone_click` | OutboundClickTracker (`tel:`, `sms:`) | `'sms'` for sms, else null |
| `email_click` | OutboundClickTracker (`mailto:`) | — |
| `whatsapp_click` | OutboundClickTracker (`wa.me`, `api.whatsapp.com`) | — |
| `website_click` | OutboundClickTracker (any other `https?://`) | — |
| `social_click` | OutboundClickTracker (known social hostnames) | the network, e.g. `'instagram'` |
| `booking_click` | OutboundClickTracker (`form[action^="mailto:"]` submit) | — |

Deliberately **not** added: hover, scroll, animation, or any other
non-action signal (explicitly excluded per the brief), and a separate
generic `LINK_CLICK` bucket — `website_click` already serves as the catch-all
for any non-social external link (covers `maps`/`calendar`/`shop`/`resume`/
`pay`/generic `link` kinds), and a second bucket meaning almost the same
thing would be noise, not insight.

## Current Tap Tracking (extended, not replaced)

`TapTracker` still owns the page-view event exclusively — same
session-dedup, same fire-and-forget contract. It gained one prop: `nfcCode`,
threaded from the page's `?nfc=` search param (only present, and only
trusted, when `src=nfc` is also present). Nothing about its own logic
changed beyond passing that one extra field through.

## NFC Attribution Flow

```
Admin issues blank stock (nfc_cards: card_url random, card_profile_id NULL)
    → Admin assigns a card_url to a username (nfc_cards.card_profile_id set)
    → [no auto-link from orders — see "The NFC ID model" below]
    → Tag is physically written with {origin}/api/nfc/{card_url}
    → Someone taps it (always anonymous)
    → /api/nfc/[cardId] resolves card_url → {nfc_card_id, card_profile_id}
      via resolve_nfc_card() RPC (see Problems Found — this used to be a
      direct table query that silently returned nothing for anyone who
      wasn't the card's own owner, i.e. every real tap)
    → redirect to /u/{username}?src=nfc&nfc={card_url}
    → page reads nfc, passes it to TapTracker + OutboundClickTracker
    → every event this session fires with nfcCode in the POST body
    → /api/tap re-resolves it via the same RPC and validates
      nfc_card.card_profile_id === the profile actually being tapped
      (a client can only ever hand back the same public code it was
      redirected with — but the server never trusts that claim without
      re-checking it)
    → card_taps.nfc_card_id set only if that check passes
```

## Problems Found

| Severity | Problem | Root Cause | Recommendation |
|---|---|---|---|
| **P0** | Real physical NFC taps have likely never correctly resolved for an anonymous visitor | `nfc_cards` RLS has only ever had an owner-scoped policy (`auth.uid() = user_id`) plus admin policies — no public SELECT. `/api/nfc/[cardId]` used the anon-key server client to query the table directly. Confirmed empirically: an anon-key client reading a known `card_url` returned `null`, not an error — RLS silently filtering the row. A physical tap is always anonymous, so this redirect has been falling through to `/?card=unassigned` regardless of whether the card is actually assigned, for every real tap, since the feature shipped. | **Fixed** — `resolve_nfc_card(code)`, a narrow `SECURITY DEFINER` RPC returning only `{nfc_card_id, card_profile_id}` for one code, granted to `anon`/`authenticated`. Not a broad `USING (true)` SELECT policy, which would expose the whole table (batch labels, every card_url, every assignment) to enumeration — RLS is row-level, not column-level, so a blanket policy can't be scoped to "just these two columns." |
| P3 (pre-existing, now closed) | `card_taps.nfc_card_id` always null | Downstream symptom of the P0 above, plus the redirect never forwarded any identifier for `TapTracker` to send even if the lookup had worked. | **Fixed** as part of the same change — the redirect now forwards `?nfc={code}`, the page threads it to `TapTracker`/`OutboundClickTracker`, and `/api/tap` resolves + validates it via the same RPC. |
| P3 (pre-existing, now closed) | No click-level analytics on outbound actions | Every button in every template is a hand-rolled `<a>`/`<form>`, never wired to any tracking. | **Fixed** — `OutboundClickTracker`, one delegated listener, zero template changes. |
| Informational | `orders` and `nfc_cards` have no relationship at all | Physical card issuance/assignment is entirely admin-driven (`issueNfcCards`/`assignNfcCard` in `admin/actions.ts`) — an order records what a customer bought, but nothing auto-creates or links an `nfc_cards` row from it. This isn't a bug to fix; it's how the product currently operates (print stock ahead of sales, assign by hand once it ships) and changing it would be a real feature, not an attribution fix. | No action — documented for awareness only. |
| Informational | `/api/tap` has no rate limiting or abuse protection | Pre-existing on the `view` event before this phase; the new click/interaction events share the same characteristic. Anyone could script repeated POSTs to inflate a card's numbers. | No action this phase — out of scope ("do not over-engineer"); worth a future phase if abuse is ever actually observed. |

## The NFC ID Model (Part 7)

**What identifies a physical card:** `nfc_cards.card_url` — the public,
non-secret 8-character code already printed on the tag (`makeCardCode()`,
33-character alphabet, 1.4 trillion combinations, not sequential/guessable).
`nfc_cards.id` is the internal UUID, never exposed to a client directly;
`card_url` is the only thing that ever leaves the server, exactly as it
already worked before this phase.

**One profile → many physical cards:** already fully supported by the
existing schema — `nfc_cards.card_profile_id` has no uniqueness constraint,
only `card_url` does. Verified live: two separate `nfc_cards` rows pointing
at the same `card_profile_id`, tapped independently, produced two `card_taps`
rows with the *same* `card_profile_id` but *different* `nfc_card_id` — an
owner can already tell which of their physical cards drove which visit. No
schema change was needed for this requirement; it was already there.

**Public URL structure:** unchanged. `/u/[username]` is exactly the same
route; the only addition is an optional `?nfc=` query param carried through
the existing `?src=nfc` mechanism, not a new path segment.

## Privacy (Part 5)

Nothing new is collected beyond what `card_taps` already stored for page
views: no fingerprinting, no new PII, no raw IP (the existing salted
`visitorHash` is reused verbatim for click events). The `target` column
stores a button *kind* (e.g. `"instagram"`), never a value, phone number, or
email address. `resolve_nfc_card()` returns two UUIDs and nothing else — no
`batch`, `note`, or `user_id` ever reaches the client, closing a real
exposure surface a blanket policy would have opened.

## Duplicate Events (Part 9)

- **Page view:** unchanged — `TapTracker`'s existing `sessionStorage` guard
  already handled React Strict Mode / remounts correctly before this phase;
  verified still true (no duplicate `view` rows in any live test this phase).
- **Click events:** `OutboundClickTracker` registers exactly one
  `document`-level listener per mount (Strict Mode's mount→unmount→remount
  in dev nets to one attached listener, standard cleanup-function behavior).
  A lightweight 800ms same-target debounce (a `useRef`, not a database
  round-trip) additionally guards against a genuine fat-finger double-tap.
  Verified live: two synthetic click events dispatched back-to-back on the
  same link produced exactly one `card_taps` row.
- **Never over-engineered:** no distributed lock, no idempotency key, no
  extra table — a directional count doesn't need click-level exactness, and
  the brief explicitly asked not to over-build this.

## Failure Behavior (Part 13)

Every tracking call site follows the same shape: fire the `fetch(...,
{keepalive: true}).catch(() => {})` call, then (or already having) let the
real action proceed untouched. No call site calls `preventDefault()` on an
outbound link. No call site `await`s the tracking call before the real
action. If `/api/tap` is down, slow, or errors, every one of call, email,
WhatsApp, website visit, booking, share, and save-contact still works
exactly as before this phase — verified implicitly by every live test in
this phase succeeding at the real action regardless of what the tracking
call did.

## Implementation

**Migrations:**
- `044_card_tap_event_types.sql` — `card_taps.event_type` (CHECK-constrained,
  default `'view'`), `card_taps.target`, and a covering index
  `(card_profile_id, event_type, created_at DESC)`.
- `045_nfc_card_lookup_rpc.sql` — `resolve_nfc_card(code)`, `SECURITY
  DEFINER`, granted to `anon`/`authenticated`. The actual P0 fix.

Both applied directly to the linked production project via `supabase db
push` (the CLI's local migration-history table was never populated — 001-043
were reconciled with `supabase migration repair --status applied` first,
since they were already live but never tracked by the CLI; 044 and 045 were
then pushed for real and verified applied).

**API:**
- `src/app/api/tap/route.ts` — accepts `eventType` (CHECK-set-validated,
  defaults to `'view'`), `target` (free text, length-capped), `nfcCode`
  (resolved + ownership-validated server-side via the RPC, never trusted
  as-is).
- `src/app/api/nfc/[cardId]/route.ts` — the P0 fix: table query → RPC call;
  redirect now also forwards `?nfc={code}`.

**Components:**
- `src/components/nfc/OutboundClickTracker.tsx` — new. One delegated click
  listener, href-based classification, 800ms dedup.
- `src/components/nfc/TapTracker.tsx` — `nfcCode` prop added.
- `src/components/nfc/ShareButton.tsx` — `username` prop added; fires
  `share` on native success, copy-link, and WhatsApp-send.
- `src/components/nfc/CardQr.tsx` — fires `qr_open` on trigger tap,
  `contact_save` from its own inline save().
- `src/components/card-templates/SaveContact.tsx` — fires `contact_save`.
- `src/lib/track-event.ts` — new. The one shared `trackCardEvent()` helper
  every client call site above uses, so the fire-and-forget contract lives
  in exactly one place.

**Pages:**
- `src/app/u/[username]/page.tsx` — parses `?nfc=`, threads it to
  `TapTracker`/`OutboundClickTracker`, adds `username` to `ShareButton`,
  mounts `OutboundClickTracker`.
- `src/app/dashboard/page.tsx`, `src/app/admin/page.tsx` — added
  `.eq("event_type", "view")` to their existing `card_taps` queries. Not a
  dashboard redesign — a required correctness fix so the "taps" numbers they
  already show don't silently start counting clicks too.

**No dashboard visualization work done** — per the brief, correct data
first; the new event types are queryable but nothing new is rendered.

## Verification

`tsc --noEmit`, `eslint src`, `next build` — all clean after every change.

Live, against a throwaway Supabase project data (created and deleted per
test), dev server, real Puppeteer:

| Test | Result |
|---|---|
| A. Digital profile, no NFC | `view`, `source='link'`, `nfc_card_id=null` — correct |
| B. NFC-linked profile, real `/api/nfc/[code]` redirect | Redirected to `/u/{username}?src=nfc&nfc={code}`; resulting `view` row has `source='nfc'` and the correct `nfc_card_id` |
| C. Two physical cards → one profile | Both taps recorded, same `card_profile_id`, two distinct `nfc_card_id` values |
| D. Outbound clicks: phone/email/whatsapp/website/social | Each correctly classified (`phone_click`/`email_click`/`whatsapp_click`/`website_click`/`social_click` with `target='instagram'`) |
| D2. Duplicate click guard | Two rapid clicks on the same link → exactly one `card_taps` row |
| E. Share (fallback panel) | `copy link` correctly fires `share`; native-success branch verified by code review only — `navigator.share()`'s promise never settles in headless Chrome, a testing-environment limitation confirmed by direct isolation, not a product defect |
| F. QR open + save-inside-QR | `qr_open` then `contact_save`, both recorded |
| G. SaveContact (published route) | `contact_save` fires; page stays on `/u/{username}` because the vCard response is `Content-Type: text/vcard`, not a redirect — correct, matches the existing documented behavior |
| H. Booking form submit (mailto form) | `booking_click` fires |
| Security: forged cross-profile `nfcCode` | POST succeeds (200 — tapping still gets recorded), but `nfc_card_id` is `null`, not the forged card's real id — the server-side ownership check rejects the fabricated attribution |

All test data (throwaway users, profiles, nfc_cards, card_taps rows) deleted
after each run.
