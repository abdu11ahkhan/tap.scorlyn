"use client";

import { useEffect, useRef } from "react";

/**
 * Rows of dots tracing an ECG-style pulse shape — flat, small bump, sharp
 * spike, settle, flat — scrolling sideways, stacked like a bank of swells
 * seen from the shoreline rather than looking straight down at them. Each
 * row is built from dots plotted along the pulse curve (not a stroked
 * line), matching the reference's dotted texture while still reading as
 * a wave shape instead of scattered noise. Rows fade and shrink with
 * distance from `origin.y`, giving the "further rows recede" read of a
 * side view rather than a flat, even field.
 *
 * Dot spacing/row count scale down on narrow viewports to stay light on
 * mobile. Pauses itself off-screen (IntersectionObserver) so seven of
 * these on one page don't all animate at once, and renders one still
 * frame instead of animating for prefers-reduced-motion.
 */

// One wave cycle as (position-in-cycle, amplitude) keyframes, linearly
// interpolated — the ECG P/QRS/T silhouette, not a smooth sine, so it
// still reads as "a pulse" once reduced to dots.
const PULSE: [number, number][] = [
  [0.0, 0],
  [0.34, 0],
  [0.38, 0.12],
  [0.42, 0],
  [0.455, -0.12],
  [0.49, 1],
  [0.525, -0.55],
  [0.56, 0.08],
  [0.6, 0],
  [0.66, 0.22],
  [0.72, 0],
  [1.0, 0],
];

function pulseValue(frac: number): number {
  const f = ((frac % 1) + 1) % 1;
  for (let i = 0; i < PULSE.length - 1; i++) {
    const [x0, y0] = PULSE[i];
    const [x1, y1] = PULSE[i + 1];
    if (f >= x0 && f <= x1) {
      const along = (f - x0) / (x1 - x0 || 1);
      return y0 + (y1 - y0) * along;
    }
  }
  return 0;
}

export function RippleField({
  className = "",
  origin = { x: 0.5, y: 0.4 },
  color = "#266867",
  accent = "#f58800",
}: {
  className?: string;
  /** 0-1 fraction of the container's own width/height — y is where the
   *  wave bank concentrates, x seeds each row's starting phase. */
  origin?: { x: number; y: number };
  color?: string;
  accent?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const PERIOD = 220;

    let width = 0;
    let height = 0;
    let rowSpacing = 46;
    let dotStep = 7;
    let raf = 0;
    let start = performance.now();

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      // A phone-width section gets fewer, more widely-spaced rows and
      // dots, keeping the per-frame point count proportional.
      rowSpacing = width < 480 ? 38 : width < 820 ? 42 : 46;
      dotStep = width < 480 ? 9 : 7;
    }

    function draw(time: number) {
      if (!width || !height) return;
      ctx!.clearRect(0, 0, width, height);

      const t = reduceMotion ? 0 : (time - start) / 1000;
      const oy = height * origin.y;
      const rows = Math.ceil(height / rowSpacing) + 1;
      const maxRowDist = height * 0.6 + rowSpacing;

      for (let row = 0; row < rows; row++) {
        const y = row * rowSpacing;
        const rowDist = Math.abs(y - oy);
        const falloff = Math.max(0, 1 - rowDist / maxRowDist);
        if (falloff <= 0) continue;

        // Further-from-center rows sit smaller and fainter — the
        // "receding toward the horizon" read of a side view.
        const amplitude = 6 + falloff * 16;
        const baseAlpha = falloff * falloff * 0.7;
        if (baseAlpha < 0.03) continue;
        const dotRadius = 0.7 + falloff * 1.1;

        const phaseSeed = origin.x + row * 0.41;
        const speed = 0.09 + (row % 3) * 0.025;
        const scroll = t * speed;
        const isAccentRow = row % 5 === 0;

        ctx!.fillStyle = isAccentRow ? accent : color;

        for (let x = 0; x <= width; x += dotStep) {
          const frac = x / PERIOD + phaseSeed - scroll;
          const v = pulseValue(frac);
          const py = y - v * amplitude;
          // Dots near a spike sit brighter/bigger than the flat stretches
          // between beats, same emphasis an ECG trace itself has.
          const emphasis = Math.abs(v);
          const alpha = baseAlpha * (0.35 + emphasis * 0.65);
          if (alpha < 0.03) continue;

          ctx!.globalAlpha = Math.min(1, alpha);
          ctx!.beginPath();
          ctx!.arc(x, py, dotRadius + emphasis * 0.8, 0, Math.PI * 2);
          ctx!.fill();
        }
      }
      ctx!.globalAlpha = 1;
    }

    function frame(time: number) {
      draw(time);
      raf = requestAnimationFrame(frame);
    }

    resize();
    draw(performance.now());

    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);

    let io: IntersectionObserver | undefined;
    if (!reduceMotion) {
      io = new IntersectionObserver(
        ([entry]) => {
          cancelAnimationFrame(raf);
          if (entry.isIntersecting) {
            start = performance.now();
            raf = requestAnimationFrame(frame);
          }
        },
        { threshold: 0.05 }
      );
      io.observe(canvas);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io?.disconnect();
    };
  }, [origin.x, origin.y, color, accent]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
