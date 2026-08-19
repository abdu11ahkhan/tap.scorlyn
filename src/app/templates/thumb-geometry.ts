/**
 * The geometry the gallery thumbnails are rendered at.
 *
 * A plain module on purpose. These used to be exported from TemplateThumb, but
 * that file is "use client" — across the server boundary Next swaps a client
 * module's exports for client references, so the server-rendered gallery read
 * SRC_H / SRC_W as NaN and every tile collapsed to `aspect-ratio: 1 / NaN` and
 * zero height. Constants shared between a server page and a client component
 * have to live somewhere neither owns.
 *
 * Kept out of thumb-frames.ts because that file is generated.
 */

/** The viewport the preview renders at. A real phone width, so templates lay
 *  out the way they actually would rather than for a 150px column. */
export const SRC_W = 390;

/**
 * How much of the card the thumbnail shows, starting from that template's own
 * content (see thumb-frames.ts).
 *
 * Measured: from the name down, a typical card runs about 550-600px before it
 * runs out of buttons. 1014 was tried and is far too tall once the frame
 * starts at the name rather than at zero — it left half a tile of blank page
 * under every card. This is the content, and little else.
 */
export const SRC_H = 624;

/** The height every preview is rendered at, and the height the offsets in
 *  thumb-frames.ts were measured against. The two must match. */
export const RENDER_H = 4800;
