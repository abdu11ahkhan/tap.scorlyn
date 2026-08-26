"use client";

import { useEffect, useRef } from "react";

/**
 * Faint, continuously-scrolling heart-monitor traces behind a section's
 * content — pure canvas, no dependency. Several horizontal lines, each
 * drawing the same repeating pulse shape (flat → small bump → sharp
 * spike → settle → flat, the familiar ECG silhouette) and scrolling
 * sideways at a slightly different speed/phase so they don't pulse in
 * lockstep. Concentrated vertically around `origin.y`, fading out above
 * and below it rather than covering the whole section evenly.
 *
 * Pauses itself off-screen (IntersectionObserver) so seven of these on one
 * page don't all animate at once, and renders a single still frame instead
 * of animating for prefers-reduced-motion.
 */

// One pulse cycle as (position-in-cycle, amplitude) keyframes, linearly
// interpolated between — the classic P / QRS / T silhouette of a heart
// monitor line, not a smooth sine.
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
  origin = { x: 0.5, y: 0.5 },
  color = "#266867",
  accent = "#f58800",
}: {
  className?: string;
  /** 0-1 fraction of the container's own width/height — y is where the
   *  traces concentrate, x seeds each row's starting phase. */
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
    const ROW_SPACING = 64;
    const PERIOD = 240;
    const STEP = 4;

    let width = 0;
    let height = 0;
    let raf = 0;
    let start = performance.now();

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(time: number) {
      if (!width || !height) return;
      ctx!.clearRect(0, 0, width, height);

      const t = reduceMotion ? 0 : (time - start) / 1000;
      const oy = height * origin.y;
      const rows = Math.ceil(height / ROW_SPACING) + 1;
      const maxRowDist = height * 0.55 + ROW_SPACING;

      for (let row = 0; row < rows; row++) {
        const y = row * ROW_SPACING;
        const rowDist = Math.abs(y - oy);
        const falloff = Math.max(0, 1 - rowDist / maxRowDist);
        if (falloff <= 0) continue;

        const amplitude = 10 + falloff * 12;
        const alpha = falloff * falloff * 0.42;
        if (alpha < 0.02) continue;

        const phaseSeed = origin.x + row * 0.37;
        const speed = 0.12 + (row % 3) * 0.03;
        const scroll = t * speed;

        const isAccent = row % 5 === 0;
        ctx!.beginPath();
        ctx!.strokeStyle = isAccent ? accent : color;
        ctx!.lineWidth = 1.4;
        ctx!.globalAlpha = alpha;

        for (let x = 0; x <= width; x += STEP) {
          const frac = x / PERIOD + phaseSeed - scroll;
          const v = pulseValue(frac);
          const py = y - v * amplitude;
          if (x === 0) ctx!.moveTo(x, py);
          else ctx!.lineTo(x, py);
        }
        ctx!.stroke();
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
