"use client";

import { useEffect, useRef, useState } from "react";

/** The viewport the preview renders at. A real phone width, so templates lay
 *  out the way they actually would rather than for a 150px column. */
const SRC_W = 390;
/**
 * How much of the card the thumbnail shows, starting from that template's own
 * content (see thumb-frames.ts).
 *
 * Measured: from the name down, a typical card runs about 550-600px before it
 * runs out of buttons. 1014 was tried and is far too tall once the frame
 * starts at the name rather than at zero — it left half a tile of blank page
 * under every card. This is the content, and little else.
 *
 * Kept at exactly SRC_W x tile aspect so the frame fills without letterboxing.
 */
const SRC_H = 624;
/** The height every preview is rendered at, and the height the offsets in
 *  thumb-frames.ts were measured against. The two must match. */
const RENDER_H = 4800;

/**
 * A template preview that fits whatever column it lands in.
 *
 * The iframe has to be a fixed pixel size — media queries resolve against it,
 * so a 150px-wide iframe would render the mobile layouts at a width no phone
 * has. It renders at 390px and is scaled to the column instead, which is the
 * one place scaling is worth the softness: at thumbnail size the alternative
 * is a layout that lies.
 */
export default function TemplateThumb({
  src,
  title,
  aspect,
  top = 0,
}: {
  src: string;
  title: string;
  /**
   * Where to start the frame, in card pixels. Templates open in very
   * different places — some with the name, some behind a full-bleed cover —
   * so this is measured per template rather than assumed to be zero.
   */
  top?: number;
  /** Visible height as a fraction of width, matched to the phone screen
   *  above so nothing is cut. */
  aspect: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  // Every thumbnail is a full page load of the preview route. Mounting all of
  // them at once fired three dozen server renders the moment the gallery
  // opened, which is what made this page slow — worst on a desktop, where the
  // wider grid puts more of them near the viewport and the browser's own lazy
  // heuristics give up and fetch them anyway.
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;

    // The tile is shaped to this source (SRC_H / SRC_W), so fitting to width
    // fills it exactly. Contain-fitting was tried and left black bars down
    // both sides, which reads as a card floating in a box rather than a
    // phone screen.
    const fit = () => setScale(el.clientWidth / SRC_W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);

    // A screen of margin, so a preview is loading by the time it is scrolled to
    // and never appears as an empty box.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);

    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={box}
      className="relative overflow-hidden rounded-[1.4rem] bg-black"
      style={{ aspectRatio: `1 / ${aspect}` }}
    >
      {/* Measured, and close enough to matter. */}
      {scale > 0 && near && (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
          style={{
            width: SRC_W,
            // Constant, never SRC_H + top. Sizing the iframe to the offset
            // changed the viewport height per template, so pages built around
            // min-h-screen laid out differently than they did when measured
            // and the window landed on empty page. The offsets are measured at
            // this exact height, so this is what they mean.
            height: RENDER_H,
            transform: `scale(${scale}) translateY(${-top}px)`,
          }}
        />
      )}
    </div>
  );
}
