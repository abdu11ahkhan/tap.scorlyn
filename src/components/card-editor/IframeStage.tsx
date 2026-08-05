"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders children inside an iframe, but keeps them part of the React tree.
 *
 * Why this exists: CSS media queries resolve against the *viewport*, not the
 * element. A 390px-wide <div> inside a 1440px window still matches `md:`, so a
 * plain scaled container showed Split, Stack and Agency in their desktop
 * layouts while the toggle said "mobile" — the preview was actively lying.
 *
 * An iframe is a real viewport, so breakpoints resolve correctly. Portalling
 * into it (rather than pointing it at a URL) means live edits still stream in
 * with no serialisation or postMessage plumbing.
 */
export default function IframeStage({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: React.ReactNode;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const doc = frame?.contentDocument;
    if (!doc) return;

    // about:blank starts with an empty document in every browser we target,
    // but write a shell anyway so <head> definitely exists.
    doc.open();
    doc.write("<!doctype html><html><head></head><body></body></html>");
    doc.close();

    /** Mirror the host page's styles so Tailwind classes apply inside. */
    const syncStyles = () => {
      doc.head.querySelectorAll("[data-mirrored]").forEach((n) => n.remove());
      document
        .querySelectorAll('style, link[rel="stylesheet"]')
        .forEach((node) => {
          const clone = node.cloneNode(true) as HTMLElement;
          clone.setAttribute("data-mirrored", "");
          doc.head.appendChild(clone);
        });
    };

    syncStyles();

    // Next injects and swaps <style> tags on HMR in development.
    const observer = new MutationObserver(syncStyles);
    observer.observe(document.head, { childList: true, subtree: true });

    doc.body.style.margin = "0";
    doc.documentElement.classList.add("dark");
    setBody(doc.body);

    return () => observer.disconnect();
  }, []);

  return (
    <iframe
      ref={frameRef}
      title="Preview"
      className="border-0 bg-white"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {body ? createPortal(children, body) : null}
    </iframe>
  );
}
