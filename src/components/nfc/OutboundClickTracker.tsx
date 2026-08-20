"use client";

import { useEffect, useRef } from "react";
import { trackCardEvent, type TrackedEvent } from "@/lib/track-event";

/**
 * Records outbound taps — phone, email, WhatsApp, website, social, booking —
 * without touching any of the 36 template files.
 *
 * Every template hand-rolls its own <a href> and <form> elements; there's no
 * shared Button component to instrument. One delegated listener on the page
 * root reaches every button in every template instead, classifying purely
 * from the resolved href/action — the same information every template
 * already produces via resolveButtons(), just read back out of the DOM
 * rather than threaded through 36 more props.
 *
 * Never calls preventDefault. The classification and the fetch both happen
 * *after* the browser has already committed to the click — this can only
 * ever add a parallel, ignorable network call, never delay or block the
 * tel:/mailto:/wa.me/https navigation itself.
 */

const SOCIAL_HOSTS = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "x.com",
  "twitter.com",
  "linkedin.com",
  "github.com",
  "t.me",
  "telegram.me",
  "pinterest.com",
  "discord.gg",
  "discord.com",
  "twitch.tv",
  "behance.net",
  "dribbble.com",
  "medium.com",
  "spotify.com",
];

function classify(href: string): { eventType: TrackedEvent; target: string | null } | null {
  if (href.startsWith("tel:")) return { eventType: "phone_click", target: null };
  if (href.startsWith("mailto:")) return { eventType: "email_click", target: null };
  if (href.startsWith("sms:")) return { eventType: "phone_click", target: "sms" };

  if (!/^https?:\/\//i.test(href)) return null;

  let host = "";
  try {
    host = new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }

  if (host === "wa.me" || host === "api.whatsapp.com") {
    return { eventType: "whatsapp_click", target: null };
  }

  const social = SOCIAL_HOSTS.find((h) => host === h || host.endsWith(`.${h}`));
  if (social) return { eventType: "social_click", target: social.split(".")[0] };

  return { eventType: "website_click", target: null };
}

export default function OutboundClickTracker({
  username,
  nfcCode,
}: {
  username: string;
  nfcCode?: string | null;
}) {
  // Guards against a genuine accidental double-fire (a fat-finger double tap,
  // or a click bubbling through nested elements) without needing anything
  // heavier — a visitor deliberately tapping the same link twice a second
  // apart is rare enough not to matter for a count that's meant to be
  // directional, not exact to the click.
  const lastFired = useRef<{ key: string; at: number } | null>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const el = event.target as HTMLElement | null;
      if (!el) return;

      const anchor = el.closest<HTMLAnchorElement>("a[href]");
      const submit = el.closest<HTMLButtonElement | HTMLInputElement>('button[type="submit"], input[type="submit"]');
      const form = submit?.closest("form");

      let result: { eventType: TrackedEvent; target: string | null } | null = null;

      if (anchor) {
        result = classify(anchor.getAttribute("href") ?? "");
      } else if (form?.getAttribute("action")?.startsWith("mailto:")) {
        result = { eventType: "booking_click", target: null };
      }

      if (!result) return;

      const key = `${result.eventType}:${result.target ?? ""}`;
      const now = Date.now();
      if (lastFired.current && lastFired.current.key === key && now - lastFired.current.at < 800) {
        return;
      }
      lastFired.current = { key, at: now };

      trackCardEvent(username, result.eventType, result.target, nfcCode);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [username, nfcCode]);

  return null;
}
