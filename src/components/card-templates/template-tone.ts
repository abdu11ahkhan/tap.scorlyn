/**
 * The colour each template's page starts with, so the cover band can fade
 * into it. Read off the template's own root background.
 *
 * Split out of index.tsx on purpose: that file imports all 42 template
 * components, so anything that only needs this colour map (the editor's
 * TemplatePicker, a thumbnail's loading placeholder) would otherwise pull
 * every template into its bundle just to read a hex string. This file has
 * no React in it at all, so it's safe to import from a client component.
 */
export const TEMPLATE_TONE: Record<string, string> = {
  agency: "#0D0D0F",
  app: "#F6F7FB",
  aurora: "#0B0614",
  bold: "#FAFAF8",
  booking: "#F4F7F7",
  case: "#ffffff",
  contactsheet: "#F2F1EC",
  dock: "#000000",
  editorial: "#FAF6EF",
  filmstrip: "#0B0B0F",
  frames: "#EFEAE1",
  glass: "#05070C",
  grid: "#FBFBFA",
  journal: "#FDFCF8",
  launch: "#08080A",
  lookbook: "#0A0A0A",
  masonry: "#ffffff",
  menu: "#FCFBF7",
  minimal: "#ffffff",
  mono: "#0C0C0C",
  mosaic: "#0F0F12",
  neon: "#000000",
  orbit: "#0B0B0F",
  // Both bg-ink (#0a0a0a) at the root -- the only two templates using the
  // literal ink class rather than a bespoke near-black. Missing here for a
  // while: the fallback of "#ffffff" put a white ProfileExtras section
  // directly under a black card, and offered the *light* surface-colour
  // presets in the editor for a template whose text is hardcoded
  // white-on-dark.
  pitch: "#0A0A0A",
  poster: "#0A0A0A",
  quote: "#F7F8F8",
  reel: "#0B0B0B",
  reply: "#F7F7FB",
  showcase: "#0C0A0B",
  split: "#ffffff",
  stack: "#ffffff",
  sticker: "#FFFDF5",
  studio: "#ffffff",
  tape: "#F4F1EA",
  tiles: "#F4F4F2",
  waitlist: "#08060F",
  badge: "#F7F8FA",
  summit: "#111511",
  flare: "#150A1E",
  clinic: "#F5FAF9",
  coach: "#0A0A0A",
  wellness: "#0E1410",
};
