"use client";

import { useEffect } from "react";

/**
 * Tells the inline head script that React actually mounted.
 *
 * If this never runs — an unsupported feature in the bundle on an older
 * browser, a failed chunk, a content blocker — the head script's timer fires
 * and reveals everything that was waiting to be animated in.
 */
export default function HydrationFlag() {
  useEffect(() => {
    (window as unknown as { __st_mounted?: boolean }).__st_mounted = true;
    document.documentElement.classList.remove("js-failed");
  }, []);

  return null;
}
