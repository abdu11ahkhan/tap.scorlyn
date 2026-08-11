/**
 * Where each template's thumbnail starts, in card pixels at 390px wide.
 *
 * Measured, one template at a time, by finding the demo persona's name in the
 * rendered page and framing from just above it. A single crop from the top
 * cannot work here: these are not variations of one layout. `glass` puts its
 * name 281px down, `dock` puts it at 2742 behind a full-bleed photo grid, and
 * framing everything from zero left sixteen of the thirty-six showing a
 * gradient and nothing else.
 *
 * To re-measure after changing a template's layout, run the measuring script
 * against /preview/card/<id>?raw=1 and read the name's offset.
 */
export const THUMB_TOP: Record<string, number> = {
  agency: 357,
  app: 42,
  aurora: 628,
  bold: 616,
  booking: 90,
  case: 469,
  contactsheet: 468,
  dock: 2406,
  editorial: 506,
  filmstrip: 456,
  frames: 432,
  glass: 237,
  grid: 456,
  journal: 469,
  launch: 1513,
  lookbook: 2061,
  masonry: 447,
  menu: 432,
  minimal: 648,
  mono: 456,
  mosaic: 456,
  neon: 628,
  orbit: 628,
  pitch: 888,
  poster: 2070,
  quote: 508,
  reel: 402,
  reply: 479,
  showcase: 1574,
  split: 608,
  stack: 700,
  sticker: 498,
  studio: 410,
  tape: 684,
  tiles: 469,
  waitlist: 1593,
};

/** Templates added without a measured frame start at the top, as before. */
export function thumbTop(template: string): number {
  return THUMB_TOP[template] ?? 0;
}
