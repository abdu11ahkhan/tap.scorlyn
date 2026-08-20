# Phase 6 — Public Card UX + Conversion Audit

## Public Card Architecture

**Route:** `src/app/u/[username]/page.tsx`, `dynamic = "force-dynamic"`.

1. **Data load.** `getCard(username)` queries `card_profiles` by lowercased
   username with `.eq("published", true)`. Unpublished or unknown usernames
   → `notFound()`. No caching — every open is a fresh read.
2. **Source detection.** `src` search param (`nfc`/`qr`/else `link`) — set by
   `/api/nfc/[cardId]`, which redirects a physical tap to `/u/{username}?src=nfc`
   (`nfc_cards.card_url` → `card_profile_id` → `username`; unassigned/unknown
   codes redirect to `/?card=unassigned` rather than erroring).
3. **Buttons.** `resolveButtons(card.buttons)` turns stored `{kind, value}`
   pairs into `{href, external}` — `whatsapp`→`wa.me` (via `normalizeWhatsapp`,
   which fixes the Pakistani-local-number-resolves-to-Belgium bug), `phone`→`tel:`,
   `sms`→`sms:`, `email`→`mailto:`, everything else → `withProtocol(value)`
   with `external: true`. No click-level tracking on any of these (see Action
   Matrix).
4. **Template selection + render.** `renderCardTemplate({card, buttons})` in
   `src/components/card-templates/index.tsx`: looks up `TEMPLATES[card.template]`
   (falls back to `MinimalCard` for an unknown id — a card can never render
   blank from a bad template string), wraps it in `.card-template.contents`
   (the shared line-clamp/wrap CSS system), and conditionally adds:
   - `CoverBand` — only if `cover_url` is set AND the template isn't one of the
     6 that build its own full-bleed cover.
   - `LogoMark` — only if `logo_url` is set.
   - `CardQr` — unless the owner explicitly disabled it (`show_qr === false`).
   - a `surface` div — only if the owner picked a custom `surface_color`.
5. **Platform-owned overlays**, mounted directly on the page (not inside the
   template):
   - `TapTracker` — client, fires `POST /api/tap` once per browser session
     (sessionStorage-gated), `keepalive: true`, swallows all errors.
   - `ShareButton` — client, fixed top-right.
   - `ProfileExtras` — server-rendered, appends hours/video/payment/
     save-contact blocks below the template, only when the owner filled at
     least one in.
   - `ReferralBanner` — client, fixed bottom, appears 1.8s after mount unless
     dismissed in the last 7 days (localStorage).
6. **Save Contact.** No writable browser Contacts API exists, so this is
   entirely vCard-handoff. On `/u/*` the button is a real `<a href="/api/vcard/{username}">`
   and the click is allowed to navigate normally — the server responds
   `Content-Type: text/vcard`, which iOS/Android recognize and hand straight
   to Contacts. Everywhere else (editor, template preview) the same click
   is intercepted and turned into a client-built blob download instead,
   because `/api/vcard/*` only sees `published` rows and would 404 on an
   unsaved draft or a demo persona.
7. **vCard content** (`src/lib/vcard.ts`, `buildVCard`): v3.0, RFC-2426-folded
   at 75 UTF-8 octets, escaped correctly. `N`/`FN`/`ORG`/`TITLE`/`TEL`/`EMAIL`/
   `ADR`/`NOTE`/`PHOTO` (only a real `https://` URL — a `data:` avatar is
   skipped since most importers reject an inline PHOTO). WhatsApp gets its own
   `item0.TEL` + `X-ABLabel:WhatsApp` (a custom `TYPE=WhatsApp` token would get
   the whole vCard rejected on MIUI/EMUI/ColorOS). Every other button is
   deduped against phone/email/whatsapp by digits-or-value, then added as a
   labelled `TEL`/`EMAIL`/`URL` (+ `X-SOCIALPROFILE` for Instagram/X/Facebook/
   LinkedIn). Nothing here is fabricated — every field traces to a real
   column or a real button the owner entered.
8. **QR** (`CardQr`, mounted once around the template, not per-template):
   modal with `role="dialog" aria-modal="true"`, Escape + backdrop + X all
   close it, body scroll is locked while open. `QRCodeCanvas` value is the
   current page URL (or an explicit `url` prop). "Save to contacts" inside
   the sheet reuses the exact same published/blob branching as the standalone
   button. "Download QR" exports the canvas as a PNG client-side.
9. **Share** (`ShareButton`): tries `navigator.share({title, url})` first;
   any rejection (including a user-cancelled share) falls through to a manual
   sheet with copy-link and a `wa.me` deep link. Copy-link uses the real
   Clipboard API with a 1.8s "copied" confirmation.
10. **Referral tracking** (`ReferralBanner` + `/api/referral`): `banner_view`
    fires once per "full" reveal; `banner_click`/`order` fire on the two CTA
    links. Resolves the referrer via `card_profiles.referral_code` (not
    `profiles`, which is owner-only-readable) so an anonymous visitor's fetch
    can still attribute correctly. Unknown codes are silently accepted (`ok:
    true`) rather than erroring, so probing for valid codes gets no signal.
11. **Tap tracking** (`/api/tap`): inserts into `card_taps` with `source`,
    `referrer`, a truncated `user_agent`, and `visitor_hash` (salted
    `sha256(ip:ua:day)` — no raw IP stored). `nfcCardId` is accepted by the
    route but **never sent** by `TapTracker` — see Action Matrix.

## Action Matrix

| Action | Templates | Destination | Tracking | Status |
|---|---|---|---|---|
| Page open | all | — | `POST /api/tap` (session-deduped) | Working |
| WhatsApp | most | `wa.me/{e164}` | none | Working, untracked |
| Call | most | `tel:` | none | Working, untracked |
| Email | most | `mailto:` | none | Working, untracked |
| Website/social link | most | `withProtocol(value)`, `target=_blank rel=noopener noreferrer` | none | Working, untracked |
| Booking slot request | Booking | `mailto:` GET form | none | Working, untracked |
| Quote request | Quote | contact-method links (no form) | none | Working, untracked |
| Save Contact | all (button) + QR sheet + ProfileExtras | `/api/vcard/{username}` (published) or client blob (preview/draft) | none | Working |
| Share | all (platform overlay) | native share sheet → fallback copy/WhatsApp panel | none | Working (native path unverifiable in headless — see Mobile/real-device note) |
| QR | all except `show_qr === false` | modal, value = current URL | none | Working |
| Referral "make mine" | all (banner) | `/templates/{template}/edit?ref={code}` | `POST /api/referral` (`banner_click`) | Working |
| Referral "order a card" | all (banner) | `/signup?ref={code}&next=/dashboard/orders` | `POST /api/referral` (`order`) | Working |
| Pay (bank details) | owner-enabled only | `<details>` disclosure, no navigation | none | Working |

**Two real tracking gaps, documented rather than fixed (see severity below):**
- Every outbound action button (WhatsApp/Call/Email/Website/social/booking/
  quote) is a plain `<a>` with zero click instrumentation. The owner can see
  *that* their card was opened, never *what the visitor did next*.
- `card_taps.nfc_card_id` exists specifically to distinguish which physical
  card triggered a tap, but `/api/nfc/[cardId]`'s redirect never forwards the
  card id as a query param, and `TapTracker` never reads or sends one — the
  column is permanently null in practice.

## UX Findings

| Severity | Template/Route | Problem | Evidence | Recommendation | Status |
|---|---|---|---|---|---|
| **P1** | Platform-wide (`ReferralBanner` × `CardQr`/`LogoMark`) | The referral banner's "full" stage (`fixed inset-x-0 bottom-0 z-50`) renders directly over the QR trigger (`fixed bottom-4 left-1/2 z-30`) and the logo watermark (`fixed bottom-4 left-4 z-30`) on every card, ~1.8s after page load, for as long as it's shown | Reproduced live: `getBoundingClientRect()` overlap check on a real render confirmed the collision before the fix, `false`/`false` after | Fixed — `ReferralBanner` now measures its own height via `ResizeObserver` and publishes it as `--sc-referral-offset` on `<html>`; `CardQr` and `LogoMark` read it to lift their `bottom` offset clear of the banner | **Fixed** |
| **P1** | Platform-wide (`ReferralBanner` × document flow) | Because the banner is `position:fixed` with no reserved space in the document, it also sits on top of whatever a visitor has scrolled to the bottom of — on nearly every template that's the card's own last button or "Save to contacts", i.e. the platform's own banner blocking the customer's own primary action | Reproduced live at 390px, `body` had `padding-bottom: 0`, Save-to-contacts rendered under the banner | Fixed — `body { padding-bottom: var(--sc-referral-offset, 0px) }` in `globals.css`, fed by the same measured value; 0px everywhere the banner never mounts | **Fixed** |
| **P2** | AgencyCard, StackCard | Both are "sectioned mini-site" templates with no `<main pb-24>` wrapper (unlike every other template) — their last section only carries `py-14` (56px), short of the ~96px the rest of the family reserves to clear the permanent QR trigger | Reproduced live, scrolled-to-bottom, viewport-clipped screenshot | Fixed — both sections' bottom padding bumped to match the family convention | **Fixed** |
| P3 | Platform-wide | No click-level tracking on any outbound action (see Action Matrix) | Code review — every button is a plain `<a>` | Out of scope for this phase (analytics architecture change); documented for a future phase | Not fixed |
| P3 | `/api/nfc/[cardId]` × `TapTracker` | `card_taps.nfc_card_id` is always null — the redirect never forwards it and the tracker never sends it | Code review | Out of scope (analytics architecture); documented | Not fixed |
| P4 | `ShareButton` native path | `navigator.share()`'s real behavior (the OS share sheet) cannot be exercised in headless Chrome — it either silently resolves or the object exists without a backing UI | Verified via code review: correctly wrapped in try/catch with a working fallback path; the fallback panel itself was exercised live | No action — this is a headless-testing limitation, not a product defect | N/A |

## Mobile Findings

| Width | Template | Problem | Status |
|---|---|---|---|
| 360/390/430 | All 10 representative templates (Minimal, Neon, Booking, Quote, Menu, Masonry, Filmstrip, Agency, Studio, Glass) | None — 0 horizontal overflow across 30 checks with long-content stress data (long name/company/headline/email/URL) | Pass |
| 360/390/430 | 5 minimal/empty-profile scenarios (bare name + one link, no bio/company, no social/photo) | None — no overflow, no orphan headings, no broken dividers; empty sections correctly don't render (`hasProfileExtras`, conditional gallery/hours/payment blocks all confirmed absent-when-empty) | Pass |
| 390 | Agency, Stack (bottom clearance) | See P2 above | Fixed |

## Accessibility Findings

| Component | Problem | Severity | Status |
|---|---|---|---|
| `CardQr` modal | `role="dialog"`, `aria-modal="true"`, `aria-label="QR code"`, Escape closes, body scroll locked, focus stays reachable via Tab (native button elements) | — | Pass, no issue |
| `ShareButton` | `aria-label="Share this card"` on trigger, `aria-label="Close"` on the panel's close button, panel is a plain overlay div without `role="dialog"` | P3 | Not fixed this phase — panel is simple (two buttons, no ambient content), functions correctly with a screen reader via labelled controls; recommend `role="dialog"` in a future accessibility-focused pass, not required for this phase's P0-P2 gate |
| `TapTracker`, `RefCatcher` | Render nothing, no interactive surface | — | N/A |
| All button/link touch targets audited in Phase 5D | ≥44px, confirmed again in this phase's screenshots | — | Pass (carried over from Phase 5D) |
| `SaveContact` | Renders as a real `<a>` with a real `href`, not a `<button>` masquerading as a link or vice versa | — | Pass |

## Performance Findings

| Area | Finding | Evidence | Recommendation |
|---|---|---|---|
| Images | All template `<img>` tags use plain `object-cover`/`object-contain` with real `alt` text; no `next/image` usage found in any of the 36 templates (pre-existing, out of this phase's scope to change without strong justification) | Code review across all card-templates in Phases 5D/6 | No action — switching 36 templates to `next/image` is a real project, not a Phase 6 fix, and nothing here demonstrated a real performance problem to justify it |
| Client components | `ShareButton`, `CardQr`, `TapTracker`, `ReferralBanner`, `RefCatcher` are client — each has a concrete interactive/browser-API reason (share sheet, canvas QR, sessionStorage, localStorage + ResizeObserver, cookie write). No unnecessary `"use client"` found | Code review | No action |
| Repeated fetches | `getCard()` runs once per request (`force-dynamic`, no double-fetch found); the "cheapest plan" query runs once alongside it | Code review | No action |
| New dependencies | None added this phase — the banner-fix uses the platform's own `ResizeObserver` (no library) | — | N/A |

## Conversion Findings

**Strongest experiences:** Booking (real slot-picker mailto form, unambiguous
CTA), Menu (dotted-leader price list + promoted CTA), Minimal (quiet but the
hierarchy is immediately legible: name → role → bio → actions, nothing
competes).

**Weakest experience (pre-fix):** every template, briefly — the referral
banner physically blocking the QR trigger and the card's own final CTA ~1.8s
after any visit was the single largest conversion leak in the whole public
card, precisely because it hit 100% of visits on every template, not one
template's design choice. Now fixed.

**Buried CTAs:** none found among the 10 representative templates — each has
a clearly promoted primary action appropriate to its own purpose (Booking →
book, Menu → order/contact, business templates → call/save).

**Unnecessary friction:** none found beyond the two P1s above. Forms
(Reply/Booking) are short, labelled, and honest about what happens next
(Phase 5D already fixed the one place copy overpromised an automatic
confirmation).

## Implementation

Commits:
- `audit: public card ux and conversion` — this document.
- `fix: public card critical ux issues` — the two P1 banner-collision fixes
  (`ReferralBanner`, `CardQr`, `LogoMark`, `globals.css`) and the two P2
  bottom-padding fixes (`AgencyCard`, `StackCard`).

No P3/P4 items were fixed, per Part 14 — they're documented above for a
future phase.

## Final Quality Gate

- [x] Public card architecture traced from actual code, not assumed.
- [x] Key actions verified: Save Contact (published + preview/draft paths),
      Share (fallback panel live-tested, native path verified via code
      review), QR (open/close/Escape/backdrop, canvas value, no overflow),
      tap tracking (fires once per session, fails silently, verified by
      reading the route + client together).
- [x] No major mobile overflow — 0 failures across all live checks this
      phase (30 stress-data checks + 5 minimal-profile checks + the
      before/after banner checks).
- [x] No major accessibility issues — one P3 (Share panel's missing
      `role="dialog"`) documented, not required for this phase's gate.
- [x] Minimal profiles render cleanly — verified live, no orphan headings,
      no empty cards, no broken dividers.
- [x] Long content renders cleanly — verified live with the exact Part 9
      stress dataset.
- [x] Platform branding no longer overpowers customer identity — the actual,
      concrete instance of this (the referral banner covering the card's own
      CTA) is fixed.
- [x] No P0/P1/P2 issues remain — all four fixed and re-verified live.
- [x] tsc passes, eslint passes, `next build` passes.
- [x] Live browser verification performed throughout (throwaway Supabase
      accounts, real Puppeteer sessions, real screenshots reviewed —
      including catching and correcting a `fullPage`-screenshot artifact
      that would have misreported the Agency/Stack finding as more severe
      than it truly was at real scroll positions).
