/**
 * Where each template's thumbnail window starts, in card pixels at 390 wide.
 *
 * Anchored to where that template's content *ends*, not where its name
 * begins. Framing from the name looked right on paper and was wrong in
 * practice: a card whose content is shorter than the window left half a tile
 * of blank page underneath it. Ending the window just past the last button
 * fills it, and pulls the hero or avatar back into frame on the short ones.
 *
 * These are not interchangeable. glass ends at 806, dock at 4607 — one number
 * for all of them is what put a gradient and nothing else on sixteen tiles.
 *
 * To re-measure after changing a template: load /preview/card/<id>?raw=1 at
 * 390px wide, find the bottom of the lowest non-fixed text or link, and set
 * this to that value + 24 - the window height in TemplateThumb.
 */
export const THUMB_TOP: Record<string, number> = {
  agency: 1096,
  app: 22,
  aurora: 603,
  bold: 646,
  booking: 257,
  case: 449,
  contactsheet: 628,
  dock: 4279,
  editorial: 717,
  filmstrip: 436,
  frames: 412,
  glass: 206,
  grid: 986,
  journal: 449,
  launch: 2293,
  lookbook: 3161,
  masonry: 427,
  menu: 421,
  minimal: 723,
  mono: 438,
  mosaic: 436,
  neon: 536,
  orbit: 608,
  pitch: 963,
  poster: 3537,
  quote: 664,
  reel: 1427,
  reply: 666,
  showcase: 2301,
  split: 644,
  stack: 1076,
  sticker: 602,
  studio: 493,
  tape: 742,
  tiles: 467,
  waitlist: 2261,
};

/*
 * Twelve of these are anchored to the identity block rather than the end of
 * the page. The portfolio templates — masonry, mosaic, frames, lookbook and
 * the rest — end with a photo grid, so framing their last content showed the
 * tail of a gallery and almost no words. Their subject is the person at the
 * top, not the last thumbnail in the reel.
 */

/** Templates added without a measured frame start at the top, as before. */
export function thumbTop(template: string): number {
  return THUMB_TOP[template] ?? 0;
}
