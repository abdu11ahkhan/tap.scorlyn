# Phase 14 — Brand + Marketing Experience

## What Was Audited

Read the live marketing surface end to end: `src/app/page.tsx`, `Hero.tsx`, `Features.tsx`, `Marquee.tsx`, `Pricing.tsx`, `Contact.tsx`, `Navbar.tsx`, the footer, `globals.css`'s design tokens, `src/lib/card.ts`'s template/category data, `src/app/signup/page.tsx`, and every image file in `public/`. Verified the actual template count (36, exact) and the actual category taxonomy in code rather than assuming one.

**What's already strong** (kept untouched):
- The marketing visual identity — acid green / hotpink / violet-pop, neo-brutalist "sticker" cards with hard offset shadows, hand-tuned tilt, CSS/motion-drawn visuals instead of stock photography — is deliberate and already documented in its own code comments (`globals.css`: *"Landing page kit... no photography"*; `Hero.tsx`: *"No photography, no pinned scroll sequence"*). It already avoids the exact cliché this phase warns against (no dark-purple-gradient-glowing-blob SaaS look).
- Hero copy, real on-page pricing, and mobile breakpoint discipline — confirmed solid in Phase 13's audit, re-confirmed here.
- Template architecture (`CARD_TEMPLATES`, `TEMPLATE_CATEGORIES`) is rich and ready to be shown — it just wasn't being shown anywhere on the landing page.

**What was weak/wrong**, in priority order:
1. **Bug**: `Features.tsx` said *"Five templates that actually slap"* — the real count is 36. A visitor reading this would think the product has almost nothing to choose from.
2. No dedicated "how it works" sequence — the NFC concept is implied by the hero visual (a phone + card with a tap-ping animation) but never stated as a clear, ordered demonstration.
3. **No template showcase on the landing page at all** — a visitor never sees any of the 36 designs unless they click through to `/templates`. For a product whose whole differentiator is visual variety, that's a real conversion gap.
4. No individual-vs-corporate positioning — corporate existed only as a WhatsApp "bulk order" link buried in the Contact section, despite a real, working corporate product (Phase 11.5/12) behind it.
5. Root layout had no Open Graph/Twitter metadata at all, and no `metadataBase` (confirmed by a recurring build warning). Only `/u/[username]` got proper share metadata, in Phase 13 — the landing page itself had none.
6. Several orphaned image files in `public/` (`nfc-hero.png`, `hero-bg.png`, and files named after people — `ahmad_sachyar.png`, `alexa_jackson.png`, `riya_sam.png`, etc.) turned out, on inspection, to be AI-stock imagery for a **different, fake brand** ("NexusLink") with a **fabricated customer name** ("Sarah Jenkins") baked into the image itself — confirmed unusable and confirmed **not referenced anywhere** in the code already. Correctly left untouched and unused.

## What Was Changed, and Why

**1. Fixed the template-count bug** — `Features.tsx`: "Five templates" → "36 templates". One-line correction of a factual error.

**2. New section: `HowItWorks.tsx`** (`#how-it-works`, placed right after the first marquee) — a real four-step sequence: *create your card → get your NFC card → tap your phone → they connect*. Built as a product demonstration, not a feature list, using the exact same sticker/tilt/color-block language `Features.tsx` already established — same component patterns, same palette, no new visual system introduced. Includes two contextual CTAs at the end ("create your card" / "get your NFC card") rather than repeating the hero's primary CTA with no distinction.

**3. New section: `TemplateShowcase.tsx`** (`#designs`, placed after Features) — groups all 36 templates by their real, existing categories (`Profile`, `Landing`, `Portfolio`, `Sectioned`, `Form` — from `TEMPLATE_CATEGORIES` in `card.ts`, not an invented taxonomy), each tile using that template's own real accent color and name from `CARD_TEMPLATES`, with a "use this design" hover state linking straight into `/templates/[id]/edit`. Horizontally scrollable rows on mobile so 36 tiles stay real, tappable sizes instead of shrinking to fit a fixed grid.

**4. New section: `AudienceSplit.tsx`** — a two-column "for you" / "for your team" comparison. Every bullet on both sides is a real, shipped feature (cross-checked against Phase 11.5/12's actual corporate implementation — centralized employee management, house style, team NFC ordering, team analytics are all real). The corporate side's CTA is **"Talk to us," linking to the existing `#contact` section** — not a fabricated pricing tier or an invented `/contact-sales` route. Per the phase brief's own instruction, this is flagged below as a business decision rather than decided in code.

**5. Hero CTA alignment** — primary button relabeled "start building" → **"create your card"** (the phase's own suggested copy); secondary button, which Phase 13 had pointed at `#pricing` (fixing an earlier redundant-CTA bug), now points at **`#how-it-works`** — a genuine second path now that the page has something to demonstrate, matching the phase's explicit CTA-hierarchy instruction (Primary: Create Your Card, Secondary: See How It Works).

**6. Root layout SEO/OG metadata** (`src/app/layout.tsx`) — added `metadataBase` (fixes a real build warning that existed before this phase), a real title/description using natural phrasing around "digital business card," "NFC contact sharing" (not keyword-stuffed), and full Open Graph + Twitter card tags reusing the site's own existing default image (`opengraph-image.png` — already existed, not a new asset).

## Files Changed
- `src/components/sections/HowItWorks.tsx` (new)
- `src/components/sections/TemplateShowcase.tsx` (new)
- `src/components/sections/AudienceSplit.tsx` (new)
- `src/components/sections/Features.tsx` (bug fix)
- `src/components/sections/Hero.tsx` (CTA copy/destinations)
- `src/app/page.tsx` (wired the three new sections in)
- `src/app/layout.tsx` (SEO/OG metadata)

## Routes Changed
None. All new sections live on the existing `/` route as in-page anchors (`#how-it-works`, `#designs`); no new pages, no new dynamic routes.

## Database Changes
**NONE.** Every new section reads static, already-defined data (`CARD_TEMPLATES`, `TEMPLATE_CATEGORIES` from `src/lib/card.ts`) or is pure copy/layout. No table, column, or RLS policy was touched.

## Tests Performed
- `tsc --noEmit` — clean.
- `eslint` on all seven touched/new files — clean.
- `next build` — succeeds, all routes compile, and the pre-existing `metadataBase` warning is now gone (confirmed by grepping the build output for it).
- Real browser verification (Puppeteer against the running dev server) at **360, 390, 430, 768, 1024, 1280px** — zero horizontal overflow at every width, measured via `scrollWidth` vs `clientWidth`, not eyeballed.
- Confirmed via rendered page text: "four steps," "explore 36 designs," and "built for one" all present; "Five templates" and any stray "39" are both gone.
- Confirmed the hero's "see how it works" link actually scrolls to the new section (`window.scrollY` measured before/after click).
- Confirmed live HTML output: real `<title>`, `og:title`, `og:description`, `og:url`, `og:image` (falls back to the existing site image), and Twitter card tags all render correctly on `/`.
- Visually inspected screenshots of all three new sections at both mobile (390px) and desktop (1280px) — vertical stack on mobile, four-column grid with connecting arrows on desktop for How It Works; horizontally-scrollable category rows on mobile for the template showcase; two-column stack-to-side-by-side for the audience split.

## Mobile Verification
360/390/430/768/1024/1280px all checked for overflow (see Tests Performed). Screenshots confirm: How It Works stacks to one column with each step readable and touch targets intact; the template showcase's horizontal scroll keeps tiles at a real tappable size instead of shrinking; the audience-split cards stack vertically with each CTA full-width. No section required a mobile-specific redesign beyond what the existing responsive patterns (`sm:`/`md:` grid classes, `overflow-x-auto`) already handle.

## Remaining Issues
- Footer is still thin (brand mark, three links, copyright) — not touched this phase; the phase's priority list didn't flag it as a conversion blocker, and it wasn't broken.
- No display typeface — the whole site (dashboard and marketing) uses Inter only, confirmed during the audit. A distinct display face for marketing headlines could strengthen the premium feel further, but changing typography site-wide is a bigger, separate decision with real bundle/FOUC tradeoffs — not attempted this phase.
- The marketing video section from the brief (Part 12) was **not built** — there is no video asset in the repository, and building an empty "video coming soon" placeholder felt like exactly the kind of unbacked promise the phase explicitly warns against ("do not create claims not supported by the actual product"). If/when a real video exists, it has a natural home right after the new How It Works section.

## Business Decisions That Still Require Your Input
1. **Corporate pricing** — genuinely undecided, correctly not invented. The new Audience Split section's corporate CTA points at the existing `#contact` bulk-order flow. If you want a self-serve corporate price shown publicly instead, that's a real product decision to make first.
2. **Whether the orphaned `public/` images should be deleted.** They depict a different, fake brand and a fabricated customer name — they were not used, but they're still sitting in the repository. I left them in place since deleting files wasn't part of this phase's scope, but they're worth a deliberate cleanup decision.
3. **Marketing video** — not built (see above). Confirm this is genuinely on the roadmap before any placeholder or "coming soon" language is added anywhere.
