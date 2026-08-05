"use client";

import { useEffect } from "react";
import { readStorage, writeStorage } from "@/lib/safe-storage";

/**
 * Records a tap once per browser session. Renders nothing.
 *
 * Session-scoped so that a visitor re-reading the card, or bouncing back from
 * WhatsApp, doesn't inflate the owner's tap count.
 */
export default function TapTracker({
  username,
  source,
}: {
  username: string;
  source: "nfc" | "qr" | "link";
}) {
  useEffect(() => {
    // Safe wrappers: touching sessionStorage directly throws in Safari with
    // cross-site tracking blocked, and an uncaught throw here blanked the card.
    const key = `tap:${username}`;
    if (readStorage("session", key)) return;
    writeStorage("session", key, "1");

    fetch("/api/tap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, source }),
      keepalive: true,
    }).catch(() => {
      // Analytics must never break the card.
    });
  }, [username, source]);

  return null;
}
