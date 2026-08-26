"use client";

import { useEffect, useRef } from "react";

/**
 * Water-ripple rings, like a stone dropped near one corner of a section —
 * pure canvas, no dependency. New rings are born at `origin` on a steady
 * interval and expand outward, fading as they grow, so 2-3 concentric
 * circles are visible and moving at any moment (the part a single
 * standing wave never actually shows: real ripples are born, travel, and
 * die, they don't just breathe in place). Dots only light up where a
 * ring's current radius passes near them, so the shape reads as distinct
 * circles, not a density gradient.
 *
 * Dot spacing and count scale down on narrow viewports to stay light on
 * mobile, and the canvas is measured with ResizeObserver so it re-fits on
 * orientation change/resize rather than assuming a fixed layout.
 *
 * Pauses itself off-screen (IntersectionObserver) so seven of these on one
 * page don't all animate at once, and renders a single still frame instead
 * of animating for prefers-reduced-motion.
 */
export function RippleField({
  className = "",
  origin = { x: 0.16, y: 0.28 },
  color = "#266867",
  accent = "#f58800",
}: {
  className?: string;
  /** 0-1 fraction of the container's own width/height — where rings are born. */
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

    // A ring is born every INTERVAL seconds and takes DURATION seconds to
    // expand from 0 to maxRadius, fading out as it grows — several are
    // alive and overlapping at once, same as real water.
    const INTERVAL = 1.3;
    const DURATION = 3.4;
    const RING_SPEED_FACTOR = 1 / DURATION;
    const BAND_WIDTH = 30;

    let width = 0;
    let height = 0;
    let spacing = 22;
    let raf = 0;
    let start = performance.now();

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Fewer, more widely-spaced dots on a phone-width section — keeps
      // the grid (and the per-frame cost) proportional to the screen.
      spacing = width < 480 ? 28 : width < 820 ? 24 : 22;
    }

    function draw(time: number) {
      if (!width || !height) return;
      ctx!.clearRect(0, 0, width, height);

      const t = reduceMotion ? 0 : (time - start) / 1000;
      const ox = width * origin.x;
      const oy = height * origin.y;
      const maxRadius = Math.max(width, height) * 0.55;
      const ringSpeed = maxRadius * RING_SPEED_FACTOR;

      // Every ring that's currently mid-expansion, oldest first.
      const newestIndex = Math.floor(t / INTERVAL);
      const rings: { radius: number; fade: number }[] = [];
      for (let k = newestIndex; k >= 0 && k > newestIndex - Math.ceil(DURATION / INTERVAL) - 1; k--) {
        const age = t - k * INTERVAL;
        if (age < 0) continue;
        const radius = age * ringSpeed;
        if (radius > maxRadius) continue;
        rings.push({ radius, fade: 1 - radius / maxRadius });
      }
      if (rings.length === 0) return;

      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let iy = 0; iy < rows; iy++) {
        for (let ix = 0; ix < cols; ix++) {
          const x = ix * spacing;
          const y = iy * spacing;
          const dist = Math.hypot(x - ox, y - oy);
          if (dist > maxRadius + BAND_WIDTH) continue;

          let alpha = 0;
          let peakStrength = 0;
          for (const ring of rings) {
            const bandDist = Math.abs(dist - ring.radius);
            if (bandDist >= BAND_WIDTH) continue;
            const closeness = 1 - bandDist / BAND_WIDTH;
            const strength = closeness * closeness * ring.fade;
            alpha += strength * 0.6;
            if (strength > peakStrength) peakStrength = strength;
          }
          if (alpha < 0.02) continue;

          const isAccent = (ix * 7 + iy * 13) % 21 === 0;
          const radius = 0.8 + peakStrength * 1.7;

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
