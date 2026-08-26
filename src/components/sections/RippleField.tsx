"use client";

import { useEffect, useRef } from "react";

/**
 * A cloud of dots clustered toward one corner of a section, matching the
 * reference: diagonal bands of dots sweeping across the cluster, denser
 * toward `origin` and fading out — a water wave viewed from an angle
 * reads as diagonal bands, not the perfect concentric circles you'd see
 * looking straight down at the water. Pure canvas, no dependency.
 *
 * Each dot's size/opacity rides a sharply-peaked wave (cubed sine, not a
 * smooth gradient) travelling along the diagonal, so distinct bands are
 * visibly sweeping through the cluster rather than a shimmering texture.
 *
 * Dot spacing scales down on narrow viewports to stay light on mobile.
 * Pauses itself off-screen (IntersectionObserver) so seven of these on
 * one page don't all animate at once, and renders a single still frame
 * instead of animating for prefers-reduced-motion.
 */
export function RippleField({
  className = "",
  origin = { x: 0.14, y: 0.24 },
  color = "#266867",
  accent = "#f58800",
}: {
  className?: string;
  /** 0-1 fraction of the container's own width/height — where the cloud
   *  of dots is centered. */
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
    // ~35°, the same low, off-axis angle the reference's streaks sit at.
    const ANGLE = (35 * Math.PI) / 180;
    const AXIS = { x: Math.cos(ANGLE), y: Math.sin(ANGLE) };
    const PERIOD = 70;

    let width = 0;
    let height = 0;
    let spacing = 20;
    let raf = 0;
    let start = performance.now();

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      spacing = width < 480 ? 24 : width < 820 ? 21 : 19;
    }

    function draw(time: number) {
      if (!width || !height) return;
      ctx!.clearRect(0, 0, width, height);

      const t = reduceMotion ? 0 : (time - start) / 1000;
      const ox = width * origin.x;
      const oy = height * origin.y;
      const clusterRadius = Math.max(width, height) * 0.5;
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let iy = 0; iy < rows; iy++) {
        for (let ix = 0; ix < cols; ix++) {
          const x = ix * spacing;
          const y = iy * spacing;
          const dx = x - ox;
          const dy = y - oy;
          const dist = Math.hypot(dx, dy);
          const cluster = Math.max(0, 1 - dist / clusterRadius);
          if (cluster <= 0) continue;

          // Position along the diagonal axis — this is what makes the
          // wave read as sweeping bands rather than circles.
          const along = dx * AXIS.x + dy * AXIS.y;
          const raw = 0.5 + 0.5 * Math.sin(along / PERIOD - t * 1.1);
          const band = raw * raw * raw;

          const alpha = cluster * cluster * (0.12 + band * 0.55);
          if (alpha < 0.02) continue;

          const isAccent = (ix * 7 + iy * 13) % 21 === 0;
          const radius = 0.8 + band * 1.7;

          ctx!.beginPath();
          ctx!.fillStyle = isAccent ? accent : color;
          ctx!.globalAlpha = Math.min(1, alpha);
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
