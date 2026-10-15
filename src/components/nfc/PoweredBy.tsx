/**
 * A single, consistent "Powered by ScorlynTap" mark, shown once per card
 * page regardless of which of the 48 designs is active.
 *
 * Before this, only two templates (Arena, Review) carried their own inline
 * version — the other 46 had no ScorlynTap branding on the public page at
 * all. Rather than add a slightly different one to each template, this sits
 * once in the shared page (src/app/u/[username]/page.tsx), in normal
 * document flow — not fixed, so it can never cover a template's own content
 * or compete with the save/QR dock.
 *
 * Uses the app's own `sc-*` tokens rather than the card's tone, same
 * reasoning as ReferenceNote and ReferralBanner right below it: this is
 * ScorlynTap's own UI sitting underneath a customer's design, not part of
 * that design, so it reads as one family rather than guessing a colour
 * that happens to work on whatever background the owner picked.
 */
export default function PoweredBy() {
  return (
    <p className="relative z-10 mx-auto -mt-2 w-full max-w-md px-6 pb-6 text-center text-[11px] font-black uppercase tracking-[0.2em] text-sc-text-dimmer opacity-70">
      Powered by ScorlynTap
    </p>
  );
}
