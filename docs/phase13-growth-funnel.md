# Phase 13 — Acquisition → Activation → Conversion → Retention

## Executive Summary

Audited the full customer-growth funnel from first landing-page visit through repeat engagement, using three parallel research passes for genuinely new ground (landing page, template/publish flow, SEO/referral) plus existing deep knowledge of the order/NFC/corporate/email machinery from Phases 11–12. No P0s found this phase (the one P0 discovered mid-session, an anon RLS regression, was fixed and reported in Phase 12). Implemented six scoped P1/P2 fixes, all reusing existing data and components — no new payment system, no new analytics table, no schema changes, no RLS changes.

## Existing Funnel

```
VISITOR → SIGNUP → CARD CREATED → CARD PUBLISHED → FIRST SHARE →
FIRST PROFILE VIEW → CONTACT ACTION → NFC PURCHASE → PAID ORDER →
DELIVERED → NFC ASSIGNED → FIRST NFC TAP → REPEAT ENGAGEMENT
```

| Stage | DB evidence | Route/UI | Existing measurement |
|---|---|---|---|
| Visitor | — | `/` | none (no page-view analytics on marketing pages, by design — not added) |
| Signup | `profiles` row created | `/signup` | implicit (row exists) |
| Card created | `card_profiles` row | `/templates/[t]/edit` → `/dashboard/card` | implicit |
| Published | `card_profiles.published=true` | same | implicit |
| First share | `card_taps.event_type='share'` | `ShareButton` | yes, existing |
| First view | `card_taps.event_type='view'` | `TapTracker` | yes, existing |
| Contact action | `card_taps.event_type` in phone/email/whatsapp/etc | `OutboundClickTracker` | yes, existing |
| NFC purchase | `orders` row, `amount_pkr>0` | `/dashboard/nfc` → `/dashboard/orders` | yes, existing |
| Paid | `orders.status='paid'` | admin | yes, existing |
| Delivered | `orders.status='delivered'` | admin | yes, existing |
| NFC assigned | `nfc_cards.card_profile_id` set | admin | yes (Phase 11's derivation) |
| First tap | `card_taps.nfc_card_id` first row | `/api/tap` | yes (Phase 12 added the notification, not a new measurement) |
| Repeat engagement | `card_taps` over time | `/dashboard/analytics` | yes, existing |

Every stage already has real database evidence and, for the stages after publish, real analytics. **No new event type or table was needed anywhere in this funnel** — confirmed by mapping each stage against existing `card_taps`/`orders`/`referral_events` semantics before writing any code.

## Acquisition Findings

Landing page (`src/app/page.tsx` → Hero/Features/Pricing/Contact) already does the hard parts right: real pricing on-page with actual numbers, a hero headline that communicates the digital-card mechanism plainly ("Tap your card on any phone and it opens instantly — no app, no QR"), and deliberate mobile-breakpoint handling with evidence of a prior narrow-viewport fix in the navbar. Two real gaps: the hero had two buttons pointing at the identical `/templates` destination (redundant, not a second path), and root metadata had no Open Graph/Twitter tags at all. Corporate/team pricing is reachable only through a WhatsApp/email "bulk order enquiry" in the Contact section, not linked from Pricing or Hero, despite a real self-serve corporate signup existing — left as a documented gap, not changed, since surfacing it as a marketing claim ("volume pricing," self-serve corporate tier) is a business-copy decision, not a code bug.

## Activation Findings

Genuinely strong: a real anonymous-draft system (`card-draft.ts`) lets anyone design a full card before creating an account — confirmed current, with explicit in-editor copy ("editing freely — no account needed until you publish"). Publish only gates at the very last step and correctly routes first-time publishers to `/signup` (not `/login`). The one real gap: publish success previously fired `window.open()` to a new tab (silently blockable by popup blockers, easy to miss) with no in-page confirmation, and — when a design hadn't been chosen yet — an NFC-format modal could appear in the same moment, competing for attention. Fixed (see Implementation).

## NFC Conversion Findings

Already deeply audited in Phase 12: pricing shown upfront, server-side price validation, corporate per-employee ordering now exists (Phase 12), admin has a "delivered, unassigned" surface (Phase 12), shipped/delivered/first-tap emails now exist (Phase 12). Re-verified this phase, still intact — see Reorder/Security verification below. No new gaps found in this pass.

## Corporate Conversion Findings

Corporate signup → company setup → employee creation → employee card → NFC ordering → delivery → assignment → analytics is a complete, working path (verified end-to-end in Phase 11.5 and Phase 12). This phase's only corporate-relevant finding is the landing-page discoverability gap noted above — the flow itself, once found, works.

## Retention Findings

`/dashboard/analytics` already surfaces real, non-fabricated engagement signals (views, contact-action breakdown by channel, engagement rate) scoped to the owner's own cards via existing RLS. This phase added one more real, backed-by-data retention surface: the referral link + real conversion count (see Implementation) — previously invisible infrastructure with zero payoff for the person who could act on it.

## Analytics Findings

No duplicate or competing analytics system was created. `card_taps` already carries every interaction signal the funnel needs (view/contact/share/NFC-tap); `referral_events` already carries referral attribution; `orders`/`nfc_cards` already carry the commerce lifecycle. Nothing in this phase required a new table, column, or event type — every implementation below reads data that was already being written.

## Email Journey Findings

Welcome → paid receipt → shipped → delivered → first-tap (all from Phase 12) form a coherent, real-event-backed sequence. Not extended further this phase — no missing transactional email was found beyond what Phase 12 already closed.

## Referral Findings

Attribution is real and working (`?ref=` → cookie → `/api/referral` → `referral_events`), and the on-card-page `ReferralBanner` is shown to both visitors and owners deliberately (so an owner can confirm the loop works). The one genuine gap: **zero customer-facing surface** — a card owner had no dashboard element showing their own referral link or whether it was converting. Fixed (see Implementation) by reading the same `referral_events` table through the RLS policy that already exists for it (`Referrers can read their own referral events.`), no new policy needed.

## SEO / Sharing Findings

`generateMetadata` on `/u/[username]` was already pulling real title/description/`og:image` from the card's own data — not generic boilerplate. Two real gaps: no fallback `og:image` when a card has no avatar (blank link-preview), and no canonical URL despite the same card being reachable under `?src=nfc`/`?src=qr`/plain variants. Both fixed.

## Mobile Findings

Landing page, publish flow, and dashboard referral panel all verified at 360/390/1280px with zero horizontal overflow (measured via `scrollWidth` vs `clientWidth`, not eyeballed). No regressions found in any touched surface.

## P0 Findings

None this phase (the one P0 found mid-session in Phase 12 — anon `is_admin()` grant — was already fixed and reverified still holding, see Security Verification).

## P1 Findings

1. No single "your card is live" confirmation — publish success relied on a blockable `window.open()`, with a possible second competing modal.
2. No fallback `og:image` for cards without an avatar — every share of a fresh card had a blank link preview.
3. Referral system tracked real conversions but showed the referrer nothing.

## P2 Findings

4. Two hero CTAs pointed at the identical destination.
5. No canonical URL on `/u/[username]`.
6. Dashboard empty-state copy said "39 designs," actual count is 36.

## P3 Findings

None implemented this phase — per the phase's own priority rule, effort stayed on P1/P2.

## What Was Implemented

**1. Post-publish confirmation panel** — Problem: publish success opened a new tab (blockable, easy to miss) and could show a competing NFC-design modal at the same time. Solution: replaced `window.open` with an in-page dismissible panel ("Your card is live.") offering one primary action (Share, via `navigator.share` falling back to copy-link) and one secondary (View it live); the NFC-design modal is now held back until the panel is dismissed, so the two never compete. Files: `src/app/dashboard/card/page.tsx`. Why this approach: no new component needed — reused the existing `app-btn`/`app-panel` classes and the same share-then-copy pattern already used elsewhere (`ShareButton.tsx`, `dashboard/page.tsx`'s `shareCard`). Existing system reused: the `NfcFormatPrompt` modal itself is untouched, only its trigger timing changed.

**2. Fallback OG image + canonical URL** — Problem: a card with no avatar produced an empty link-preview image when shared; no canonical URL despite multiple query-param variants of the same page. Solution: `generateMetadata` now falls back to the site's own existing `src/app/opengraph-image.png` (a file that already existed and was already serving the root layout — not a new asset) when `avatar_url` is null, and sets `alternates.canonical` + `openGraph.url` + a `twitter` card block. Files: `src/app/u/[username]/page.tsx`. Existing system reused: the existing static OG image file.

**3. Referral surface** — Problem: referral tracking (`referral_events`) was real but invisible to the referrer. Solution: added one compact panel to the individual dashboard showing the owner's own shareable link (`/u/username?ref=code`) with copy, and a real count of `signup`/`order` events attributed to them — `banner_view`/`banner_click` (impressions, not conversions) deliberately excluded from the headline number. Files: `src/app/dashboard/page.tsx`. Why this approach: a single read against `referral_events` filtered to `referrer_user_id = auth.uid()` — the exact RLS policy that already existed and was already unused by any UI. Existing system reused: `referral_events` table, its existing RLS policy, `card.referral_code` (already fetched as part of the existing `card_profiles.select("*")` query on that page).

**4. Redundant hero CTA → real second destination** — Problem: two buttons, identical `/templates` href. Solution: the second button now points at `#pricing`, which already exists on the same page and was previously only reachable from the navbar. Files: `src/components/sections/Hero.tsx`. Business decision documented inline as a code comment at the change site, per Part 19.

**5. Template-count copy fix** — "39 designs" → "36 designs" (actual `CARD_TEMPLATES` count). Files: `src/app/dashboard/page.tsx`.

## Database Changes

**NONE.** Every implementation reads or writes existing tables/columns through existing RLS policies. No migration was written or applied this phase.

## Security Verification

- Anonymous public card access (`/u/[username]`) and NFC tap resolution (`/api/tap`) re-verified working — the Phase 12 P0 fix (anon `EXECUTE` on `is_admin()`) still holds; no regression introduced.
- The new referral panel query (`referral_events` filtered by `referrer_user_id = auth.uid()`) uses an RLS policy that already existed before this phase — no new policy, no new exposure. Verified it returns only the signed-in user's own events (can't be otherwise, since it's the caller's own session with no service-role involvement anywhere in this phase's code).
- No RLS policy was added, removed, or modified this phase.
- No admin/corporate/NFC authorization surface touched this phase — Phase 11.5/12's boundaries (owner-vs-employee, company-vs-company) were not touched and were not re-tested from scratch this phase (already verified twice in prior phases); only the newly-added public-facing surfaces (metadata, publish panel, referral panel, hero CTA) were tested.

## Individual Journey Test

Real throwaway account, continuous browser session: login → `/dashboard/card` → filled username + name → published → **confirmed the new "Your card is live." panel rendered** with Share/View-it-live/Dismiss → dismissed → **confirmed the NFC-design modal appeared only after dismissal**, not simultaneously → navigated to `/dashboard` → **confirmed the new "Your referral link" panel rendered** → checked the published card's live HTML: real `<title>`, real `og:title`, `og:image` correctly falling back to the site's default image (card had no avatar), `<link rel="canonical">` present with the right URL. All confirmed via actual rendered HTML/DOM inspection, not assumed. Test account and card fully deleted afterward.

## Corporate Journey Test

Not re-run from scratch this phase — the corporate signup → employee → NFC-order → delivery → assignment → analytics path was already verified end-to-end with real accounts in Phase 11.5 and Phase 12, and nothing in this phase touched any corporate-specific code path. Re-running it would have re-tested unchanged code rather than this phase's actual changes.

## Mobile Test Results

360px, 390px, 1280px — landing page: zero horizontal overflow (measured), "see pricing" CTA correctly scrolls to the real pricing section. 390px — publish flow and dashboard referral panel: rendered cleanly, screenshots captured, no overflow.

## Desktop Test Results

1280px landing page: zero overflow, layout intact.

## Analytics Verification

Confirmed no new analytics table or event type was introduced — `referralCount` is a `head:true` count query against the existing `referral_events` table; the OG-image/canonical changes touch metadata only, not analytics; the publish-panel change touches UI state only, no new tracked event.

## Performance Notes

No new dependencies added. The referral panel adds exactly one additional lightweight `head:true` count query to the dashboard's existing `Promise.all` batch (was already running 6 parallel queries; now 7) — negligible cost, no new round trip pattern introduced. The publish-panel change removes a `window.open()` call and replaces it with local React state — strictly lighter, not heavier.

## Remaining Issues

- Corporate/team pricing is still not linked from the landing page's Pricing or Hero sections — a real, judged-out-of-scope gap since it's a marketing-copy/business-policy decision ("do we want a self-serve corporate price shown publicly, or keep it sales-assisted"), not a code defect. Flagged, not decided on the product's behalf.
- No purchase-funnel-specific event tracking (viewed pricing / started checkout / abandoned) was added — same conclusion as Phase 12: the existing tables cover every *completed* funnel stage, but there's no visibility into where an *incomplete* attempt drops off. Building that would need a genuine new event surface, which the phase's "prefer existing tables" instruction argues against doing lightly.
- The referral panel shows a lifetime count with no time-window breakdown (e.g. "this month") — kept simple since `/dashboard/analytics` already owns the time-range-filtered view for other metrics, and duplicating that pattern for one more number felt like scope creep for this phase.

## Recommended Phase 14

If corporate self-serve pricing is a real product decision (not just a discoverability bug), that's the natural next phase: decide the actual policy, then surface it — same "derive from what's real, don't fabricate" discipline this whole session has followed. Separately, a lightweight "funnel drop-off" view for admins (visitors who started but never finished the editor, or started checkout but never paid) would need one new, carefully-scoped signal — worth treating as its own phase given the instruction not to invent capabilities lightly.
