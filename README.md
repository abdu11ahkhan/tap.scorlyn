# Klyro

NFC digital business cards with a built-in referral loop.

Tap a card on any phone and the owner's profile opens instantly — no app, no QR.
Every card carries a "get your own" prompt, so each tap is a chance at a new
customer.

Built for the Pakistani market: WhatsApp-first contact options, PKR pricing.

---

## What's here

**21 templates across 5 sectors** — profile cards, landing pages, portfolios,
sectioned mini-sites, and contact forms. Every template is a single screen that
paints instantly on a mid-range phone over mobile data.

**Edit before you sign up.** Pick a template and customise it with no account.
The draft lives in `localStorage` and follows you through login, so the signup
wall sits at *publish*, not at the door.

**Referral tracking.** Every tap is recorded, and the funnel
(`banner_view → banner_click → signup`) is attributed to the card owner.

**Admin console** at `/admin` — platform totals and a searchable card list.

---

## Running it

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase keys
npm run dev
```

Open <http://localhost:3000>.

With placeholder keys the landing page, templates, previews and the anonymous
editor all work. Login, dashboard and publishing need a real Supabase project.

### Environment

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public by design; RLS is what protects data |
| `TAP_HASH_SALT` | **Server-only.** Salts the visitor hash used for tap analytics |

Never add the `service_role` key. Nothing here uses it, and one stray
`NEXT_PUBLIC_` prefix would expose every row in the database.

---

## Database

Run these in the Supabase SQL Editor, in order:

1. `supabase/schema.sql`
2. `supabase/migrations/001_card_profiles_and_referrals.sql`
3. `supabase/migrations/002_card_templates.sql`
4. `supabase/migrations/003_card_images.sql`
5. `supabase/migrations/004_admin.sql`

Row Level Security is on for every table. A few things worth knowing:

- `card_profiles.referral_code` is denormalised from `profiles`. An anonymous
  visitor can't read `profiles`, so a referral code could never be resolved
  there — the mirror is what makes attribution work at all.
- Admin policies call an `is_admin()` SECURITY DEFINER function rather than
  sub-querying `profiles`. A policy *on* profiles that queries profiles
  recurses forever.

---

## Layout

```
src/
  app/
    admin/                  console (RLS-backed, is_admin gated)
    api/nfc/[cardId]/       physical tap → redirect to the owner's card
    api/tap/                records a tap
    api/referral/           records a funnel event
    api/vcard/[username]/   .vcf export
    preview/card/[template] template preview + device toggle
    templates/              gallery, and the no-account editor
    u/[username]/           the live card
  components/
    card-templates/         the 21 templates
    card-editor/            shared editor fields, picker, device preview
  lib/card.ts               button kinds, template registry, colour helpers
supabase/                   schema + migrations
```

---

## Notes for whoever works on this next

- **Template motion is CSS-only.** A card is opened by a physical tap, so it has
  to paint immediately. No animation library ships to a business card.
- **The editor preview renders inside an iframe.** CSS media queries resolve
  against the viewport, not the element — a narrow `div` still matches `md:`, so
  a scaled container showed desktop layouts under a "mobile" label.
- **`readableOn()`** picks black or white text per accent colour using WCAG
  luminance. Templates that print text *on* the accent must use it; hardcoded
  white is unreadable on a pale accent.

## Not built yet

- **Payments.** Stripe is a dependency but there is no checkout, webhook, or
  orders table.
- **Image uploads.** The editor takes image URLs; real uploads need a Supabase
  Storage bucket.
- The contact forms in the Reply and Booking templates submit via `mailto:`.

See [DEPLOYMENT.md](DEPLOYMENT.md) for going live.
