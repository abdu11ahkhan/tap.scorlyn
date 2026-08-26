"use client";

import { useEffect, useRef } from "react";

/**
 * A quiet, auto-animating field of dots behind a section's content — pure
 * canvas, no dependency. Each dot's size/opacity rides a wave travelling
 * outward from `origin`, so the pattern reads as a slow ripple rather than
 * a static texture, clustered toward one corner rather than an even grid
 * (an even grid at full opacity would fight the copy sitting on top of it).
 *
 * Pauses itself off-screen (IntersectionObserver) so seven of these on one
 * page don't all animate at once, and renders a single still frame instead
 * of animating for prefers-reduced-motion.
 */
export function RippleField({
  className = "",
  origin = { x: 0.5, y: 0.5 },
  color = "#266867",
  accent = "#f58800",
}: {
  className?: string;
  /** 0-1 fraction of the container's own width/height. */
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
    const SPACING = 26;

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
      const ox = width * origin.x;
      const oy = height * origin.y;
      const maxDist = Math.hypot(width, height) * 0.9;
      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;

      for (let iy = 0; iy < rows; iy++) {
        for (let ix = 0; ix < cols; ix++) {
          const x = ix * SPACING;
          const y = iy * SPACING;
          const dist = Math.hypot(x - ox, y - oy);
          const falloff = Math.max(0, 1 - dist / maxDist);
          if (falloff <= 0) continue;

          // Cubing the raw sine turns a smooth gradient into a distinct
          // travelling band — bright ring, then a near-invisible trough —
          // which is what actually reads as "a wave" instead of ambient
          // texture that happens to shimmer.
          const raw = 0.5 + 0.5 * Math.sin(dist * 0.05 - t * 1.8);
          const wave = raw * raw * raw;
          const alpha = falloff * wave * 0.5;
          if (alpha < 0.02) continue;

          const isAccent = (ix * 7 + iy * 13) % 23 === 0;
          const radius = 0.6 + wave * 2.2;

          ctx!.beginPath();
          ctx!.fillStyle = isAccent ? accent : color;
          ctx!.globalAlpha = alpha;
          ctx!.arc(x, y, radius, 0, Math.PI * 2);
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
