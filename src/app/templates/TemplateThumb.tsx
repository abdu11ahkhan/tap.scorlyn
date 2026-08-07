"use client";

import { useEffect, useRef, useState } from "react";

/** The viewport the preview renders at. A real phone width, so templates lay
 *  out the way they actually would rather than for a 150px column. */
const SRC_W = 390;
const SRC_H = 620;

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
}: {
  src: string;
  title: string;
  /** Visible height as a fraction of width. These pages are taller than one
   *  screen, so the frame deliberately crops. */
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
          style={{ width: SRC_W, height: SRC_H, transform: `scale(${scale})` }}
        />
      )}
    </div>
  );
}
