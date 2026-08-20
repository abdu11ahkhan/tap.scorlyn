# Phase 5D — 36-Template Audit

Read-only classification pass, no code changed for this commit. Produced by four
parallel read-only audits (one per family group), synthesized and re-normalized
against the A/B/C/D definitions below (a couple of the raw agent reports used "D"
loosely to mean "no action needed" — those are corrected to A here; **D is reserved
for genuine structural problems**, of which this pass found none).

- **A** — excellent, leave alone
- **B** — minor polish
- **C** — needs meaningful redesign or a real fix (bug, policy violation, or
  identity confusion), not just polish
- **D** — structural problem (none found)

## Master table

| Template | Family | Visual identity | Primary use case | Current quality | Mobile quality | Differentiation | Issues | Recommended action |
|---|---|---|---|---|---|---|---|---|
| MinimalCard | Minimalist | Centred paper card, thin type, one hairline accent rule | Restrained "safe default" | High craft, no decoration for its own sake | Good, min-h-11 everywhere | Distinct quiet posture | None | **[A]** leave alone |
| BoldCard | Expressive/Loud | Oversized black display name, gradient-shine buttons | Maximal personal-brand presence | Strong type, but 2 decorative blurred orbs (anti-pattern) | Fine | Orb device shared with Glass/Mono — some risk | Two purely decorative floating orbs | **[B]** drop or justify the orbs |
| NeonCard | Expressive/Dark | Black bg, one glowing accent rule, wrapping pill chips | After-dark/nightlife personal brand | Well controlled, single glow only | min-h-11 borderline-compliant | High | None | **[A]** leave alone |
| MonoCard | Dev/Technical | Terminal dl/dt rows, blinking caret, prompts | Developers/technical founders | Strong structural identity; one stray orb undercuts it | min-h-11 borderline | High | One decorative orb doesn't fit the CRT metaphor | **[B]** drop the orb |
| EditorialCard | Editorial | Warm paper, serif, drop cap, numbered rows | Writers/consultants | High craft, genuine editorial devices | Comfortable | Very high | None | **[A]** leave alone |
| GlassCard | Glassmorphism | Dark frosted panel, three drifting orbs | Users wanting the "marketing site" look | Competent but decorative-heavy | Fine | **Weakest in batch** — reads as Scorlyn's own site chrome; 3rd orb hardcodes a fixed indigo `#818CF8`, not accent-derived | Fixed non-accent color breaks the "everything follows owner's accent" rule every other template observes; brand-bleed risk | **[C]** replace/remove the fixed-indigo orb, cut to one purposeful glow |
| SplitCard | Structured | Left accent panel + right action panel | Two-zone "profile card" | Solid | No `max-w-*` cap on mobile `<main>` before `md:` | Good, distinct structure | Missing max-width wrapper (only template lacking one) | **[B]** add `max-w-sm` to mobile main |
| StickerCard | Brutalist | Thick outlines, hard shadows, white paper chips | Loud DTC/creator brands | High, every white surface anchors its own text color | Good | High | None | **[A]** leave alone |
| TapeCard | Scrapbook | Tilted polaroid + washi tape, taped link strips | Casual/creative personal brand | High, playful without genericism | Good | High | None | **[A]** leave alone |
| GridCard | Photo/Portfolio — gallery-grid | Photo strip + icon-tile button grid | Scannable icon-forward link grid | Solid, but button grid is still the boxed-card anti-pattern the rest of the family just moved away from | Fine, long page with 5+ photos+buttons but nothing breaks | Overlaps Mosaic's "avatar+bio+2-col grid+nav" shape; button treatment now inconsistent with siblings | Boxed button-tile grid inconsistent with ContactSheet/Mosaic/Frames' new hairline nav | **[B]** simplify button grid to match siblings' hairline treatment |
| ShowcaseCard | Photo/Portfolio — full-bleed hero | Large cover photo, name overlay, link "plate" rows | One statement photo + link list | High craft | Fine | **Near-duplicate of Lookbook's hero mechanic** (img + scrim + bottom-left name, nearly identical structure) | Closest pair in the whole family; no gallery grid distinguishes it enough on its own | **[C]** differentiation pass vs. Lookbook (Part 5) |
| ReelCard | Photo/Portfolio — scroll-reel | Sticky header, full-bleed stacked photos, numbered scrim captions | IG-feed-style vertical scroll | High, smart placeholder fallback | Good, handles 0/5+ photos cleanly | Clearly distinct (only sticky-header + edge-to-edge stack) | None | **[A]** leave alone |
| MasonryCard | Photo/Portfolio — folio wall | CSS-columns masonry, native aspect ratios | Many photos, varied ratios | Strong, already redesigned in 5B | Good | Intentional, well-executed pairing with Filmstrip | None | **[A]** leave alone (already redesigned) |
| FilmstripCard | Photo/Portfolio — cinematic reel | Title-card hero, horizontal snap-scroll, frame counter | Cinematic portfolio intro | Strong, already redesigned in 5B | Good | Well distinguished from Masonry/Lookbook/Reel | None | **[A]** leave alone (already redesigned) |
| LookbookCard | Photo/Portfolio — full-bleed sequential | Hero image + subsequent full-bleed images, captions carry weight | Small set of hero-quality images | Good craft, `-mx-5` breakout technique | Can get very long with 5+ images, no pacing device | **Near-duplicate of Showcase's hero**; also conceptually close to Case | Long unbounded scroll with no numbering/pacing unlike Filmstrip/Case/ContactSheet | **[C]** differentiation pass vs. Showcase (Part 5) |
| ContactSheetCard | Photo/Portfolio — darkroom sheet | Bold masthead, dense 3-col numbered grid | Photographer wanting visible volume | Good, redesign in prior phase landed well | Nav rows `py-3` no min-h, borderline <44px | Clearly distinguished by density (3-col) + bordered-avatar treatment | Nav touch target borderline | **[B]** add `min-h-11` to nav rows |
| CaseCard | Photo/Portfolio — narrative case-study | Numbered sections, substantial captions, accent-border bio quote | One project told as a story | High, distinct visual grammar | Fine | Distinct — only template with narrative-weight captions | Nav still boxed/bordered, inconsistent with family's now-lighter chrome | **[B]** switch nav to hairline treatment for family consistency |
| MosaicCard | Photo/Portfolio — staggered rhythm | 2-col grid, every 3rd tile spans width | Rhythm over uniform grid | Good, touch-up landed well | Nav rows `py-3` no min-h, borderline | Legitimate differentiation from Grid (periodic wide-tile rule vs. single lead tile) | Nav touch target borderline | **[B]** add `min-h-11` to nav rows |
| ReplyCard | Business/Forms — written inquiry | Avatar header + boxed white "send a message" mailto form | Freelancer wanting a direct written inquiry | Real form, required fields, clear CTA | Inputs comfortably >44px; "save to contacts" link is sub-44px | Clearly the "free-text" mechanism vs. Booking/Quote | **White-card text-inheritance bug**: form heading/labels/input text use dynamic `theme.fg` inside a hardcoded `bg-white` card — invisible on a dark-themed card | **[C]** hardcode the white card's own text color (same fix pattern as Booking/App) |
| BookingCard | Business/Forms — slot booking | Cover photo + white "book a slot" card, 4-up time-slot radio grid | Service pro signalling availability | Correctly hardcodes dark text already (safe from the inheritance bug); real mailto form | Slot cells exactly at 44px floor, no margin; optional `cc` field unlabeled as optional | Distinct structured-picker mechanism vs. Reply/Quote | Minor: no "optional" cue on cc field; confirmation copy slightly overpromises | **[B]** label the optional field, minor copy tweak |
| QuoteCard | Business/Forms — quote request | Headline + checklist card + stacked contact-method buttons | Structured but backend-free quote request | No actual form — visitor must remember checklist items after leaving the page | Buttons well-sized | Meaningfully different mechanism (channel-picker vs. free text) but weaker as a "conversion tool" | Same **white-card text-inheritance bug** as Reply (checklist `<li>` inherits `theme.fg` on white card) | **[C]** fix the inheritance bug; template's core mechanism is intentionally weaker than Reply and that's fine, not itself a defect |
| PitchCard | Landing — pitch narrative | Dark hero, one big CTA, 3-stat proof strip | One-shot "here's my thing" pitch | Good, CTA hierarchy very clear | Primary CTA 64px, fine | Clearly distinct — no form, no slot grid | Stat strip is decorative filler, not real data (borderline "unnecessary decoration") | **[B]** consider trimming or grounding the stat strip in real content |
| AppCard | Landing — app-store shaped | Icon+rating header, primary CTA, screenshot, feature checklist | App/service presented like an App Store listing | Good framing | Comfortable | Distinct app-store metaphor | **Fabricated "4.8" star rating** — violates the standing "never fabricate stats/reviews" rule | **[C]** remove or clearly restyle the rating as non-data decoration |
| PosterCard | Landing — full-bleed photo | Full-bleed cover, oversized name, one CTA pill | Bold photo-first card | Strong, already redesigned in 5A | Good | High, nothing else is full-bleed photo | None | **[A]** leave alone (already redesigned) |
| WaitlistCard | Waitlist/Launch | Dark gradient hero, real inline email-capture form | Pre-launch email collection | Strongest small-form example in the set; honest, no fake headcount | Good, inputs/buttons sized well | Distinct single-field mechanism | None | **[A]** leave alone (already redesigned) |
| LaunchCard | Landing — single-CTA hero | Centered hero, one oversized pill CTA, demoted secondary text | Single-product/single-link launch | Textbook-clear CTA hierarchy | Secondary/save links are sub-44px by design (demotion) | Distinct radial-glow + dominant-CTA pattern | Secondary tap targets small but intentionally de-emphasized | **[B]** pad secondary link tap areas slightly |
| MenuCard | Print-menu | Dotted-leader price list from gallery captions, promoted CTA | Barber/tutor/caterer price list | Strong, already redesigned in 5B | Good, min-h-11 nav | Highly distinct, nothing else does a price list | None | **[A]** leave alone (already redesigned) |
| OrbitCard | Icon-first — radial/wrap | Avatar + pulsing ring + wrapping icon-button row | Networking/social-first fast-tap card | Every icon real (`iconFor`), title+aria-label on all | 56px buttons, flex-wrap handles overflow | Genuinely distinct vs. Tiles/Dock | Only hover-ring affordance shown; focus-visible parity unverified | **[A]** leave alone (verify focus-visible only) |
| TilesCard | Icon-first — grid | Header + 3-col grid of square icon tiles | "Menu of actions" with many links | Icons real, accessible names present | Comfortable | Distinct grid mechanism | All tiles equal visual weight regardless of primary vs. secondary action | **[B]** add visual emphasis for primary contact actions |
| DockCard | Icon-first — bottom dock | Full-bleed portrait + gradient scrim + bottom scroll dock | Photo-forward, one-handed thumb reach | Theme rewiring landed correctly | 56px icons, but horizontal scroll has no edge-fade cue | Distinct bottom-pinned mechanism | No discoverability signal for offscreen icons with 6+ buttons | **[B]** add edge-fade/gradient mask on scroll nav |
| AgencyCard | Sectioned mini-site | Cover hero, sticky jump-nav, services grid, work gallery | Freelancer/agency one-pager | Good, purposeful icon+label chips | Service rows fine; **sticky nav pills ~27-28px, under 44px** | Differentiates via cover/services/gallery from Stack/Studio | Sticky nav pill touch target too small | **[B]** increase nav-pill padding |
| StackCard | Sectioned mini-site, typographic | Plain canvas, sticky jump-nav, generous type | Consultants wanting low-ornament site | Good, restrained icon use | Link rows fine; same sticky nav pill issue as Agency | Differentiates via absence of imagery, heavier type | Sticky nav pill touch target too small | **[B]** increase nav-pill padding |
| StudioCard | Sectioned mini-site, persistent header | Compact sticky header, large display headline, gallery, contact list | Designers/studios, work-first with identity strip | Good, purposeful icon chips | Contact rows fine; **header jump-nav links have zero padding, ~14-16px tall — worst touch-target offender found in the whole audit** | Distinct sticky-header-with-avatar vs. Agency/Stack | Header nav links effectively untappable on a phone | **[C]** wrap header nav links in a proper padded/min-h-11 tap zone |
| JournalCard | Editorial/long-form | Serif type, dated entries, plain underlined links, no icons | Writers wanting prose-like feel | Intentionally icon-free — good fit for "icons need purpose" | Link rows borderline (~45px); SaveContact has no padding, sub-44px | Strongly distinct, only icon-free template | SaveContact tap target too small | **[B]** pad SaveContact hit area |
| FramesCard | Portfolio/print-tactile | Tilted framed prints + plain underline nav (post-edit) | Photographers wanting a tactile gallery card | New nav lands well, calmer/editorial | Comfortable | Distinct tilted-print treatment preserved | None functional; hardcoded caption color undocumented vs. Agency's commented equivalent | **[A]** leave alone (optionally add a clarifying comment) |
| AuroraCard | Icon-first-adjacent list, glassmorphic | Animated pastel gradient mesh behind frosted link rows | Creative/nightlife profile wanting ambient background | Purposeful icon+label rows | Buttons well over 44px; SaveContact has no padding | Distinct via the animated mesh despite a similar list mechanism to Stack/Studio | SaveContact tap target too small | **[B]** pad SaveContact hit area |

## Cross-cutting flags (from all four audits)

**Known white-card text-inheritance bug** (deliberately-white UI card whose child
text relies on the now-dynamic root color instead of anchoring its own):
- `ReplyCard.tsx` — form heading/labels/inputs **[C, fix required]**
- `QuoteCard.tsx` — checklist list items **[C, fix required]**
- Confirmed safe (correctly hardcode fixed dark text already): BookingCard, AppCard, StickerCard, TapeCard, GlassCard.

**Sub-44px tap targets** (real, worth fixing where cheap):
- `StudioCard.tsx` header jump-nav — most severe, ~14-16px, **[C]**
- `AgencyCard.tsx` / `StackCard.tsx` sticky nav pills — ~27-28px, **[B]**
- `JournalCard.tsx` / `AuroraCard.tsx` / most templates' bare-text "save to contacts" links — small text, no padding, **[B]** where flagged
- `ContactSheetCard.tsx` / `MosaicCard.tsx` nav rows — borderline, **[B]**
- `BookingCard.tsx` slot cells — exactly at the 44px floor, acceptable but no margin

**Fabricated content (standing rule violation):**
- `AppCard.tsx` hardcoded "4.8" star rating not tied to any real data — **[C, must fix]**

**Scorlyn brand-bleed risk:**
- `GlassCard.tsx` explicitly modeled on "the marketing site's look" with a
  fixed non-accent-derived indigo orb — **[C]**, the only real brand-separation
  concern found across all 36.
- No other template shows Scorlyn-specific charcoal/gold hardcoding.

**Differentiation audit (Part 5):**
- Showcase vs. Lookbook: near-duplicate full-bleed hero mechanic — **[C]**, needs a real distinguishing decision.
- All other apparent "grid of photos" siblings (Grid/Mosaic/ContactSheet/Case) were checked pairwise and found to have genuine, describable mechanism differences — not near-duplicates, no action needed beyond their individual B/C items above.

## Part 2 — Priority order

**Tier C (meaningful redesign / real fix), in the order this phase will address them:**
1. AppCard — remove fabricated rating (policy violation, quick)
2. ReplyCard — white-card text-inheritance fix (quick, known pattern)
3. QuoteCard — white-card text-inheritance fix (quick, known pattern)
4. StudioCard — header nav touch-target fix (quick, known pattern)
5. GlassCard — remove/replace the non-accent-derived orb, cut decorative glow to one (Part 12 brand-separation relevance)
6. Showcase vs. Lookbook — differentiation decision (Part 5)

**Tier D (structural problem):** none found.

**Tier B (minor polish):** ~17 templates, batched by family — BoldCard/MonoCard orb removal, SplitCard max-width, GridCard/CaseCard nav consistency, ContactSheet/Mosaic nav min-height, TilesCard icon hierarchy, DockCard scroll edge-fade, AgencyCard/StackCard nav-pill padding, JournalCard/AuroraCard SaveContact padding, LaunchCard secondary-link padding, PitchCard stat-strip review, BookingCard optional-field label.

**Tier A:** 14 templates — MinimalCard, NeonCard, EditorialCard, StickerCard, TapeCard, ReelCard, MasonryCard, FilmstripCard, PosterCard, WaitlistCard, MenuCard, OrbitCard, FramesCard — left untouched.
