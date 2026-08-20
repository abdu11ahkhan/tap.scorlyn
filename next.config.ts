import type { NextConfig } from "next";

/**
 * How long a phone may keep a file before asking for it again.
 *
 * Next already serves hashed JS and CSS as immutable for a year, so those are
 * free on a repeat visit. The brand assets were not: the icon and the web
 * manifest came back `max-age=0, must-revalidate`, meaning every page load
 * spent a round trip revalidating files that change perhaps twice a year.
 *
 * These are safe to cache hard because their content is stable — and when one
 * does change, a deployment changes the URL fingerprint Next serves them under
 * or the file itself is small enough to re-request once.
 */
const A_YEAR = 60 * 60 * 24 * 365;
const A_WEEK = 60 * 60 * 24 * 7;

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Applied everywhere. Deliberately not a full Content-Security-
        // Policy — this app embeds YouTube/Vimeo/TikTok iframes
        // (ProfileExtras), uses Google OAuth, and talks to Supabase, and
        // getting a CSP's allowlist wrong silently breaks one of those
        // rather than failing loudly. These four are safe regardless of
        // any third-party asset this app ever adds:
        source: "/:path*",
        headers: [
          // Stops a browser from guessing a response's type and executing
          // it as something else (e.g. treating an uploaded image as HTML).
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Same-origin framing only (the editor's own live preview, the
          // template gallery's thumbnails, and the admin card preview all
          // frame same-origin pages already and are unaffected) — blocks
          // a third-party site from framing a public card for clickjacking.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Full URL to same-origin destinations, origin-only cross-origin
          // — enough for the app's own analytics `referrer` column to stay
          // useful without leaking a visitor's full path to outbound links.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Nothing in this app calls camera/microphone/geolocation APIs
          // (the card scanner uses a plain file input, not getUserMedia) —
          // disabling them closes off a class of attack against embedded
          // third-party content this app doesn't otherwise use itself.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Icons and social images: stable, and re-fetching them on every load
        // is pure waste on a phone connection.
        source: "/:file(icon.png|apple-icon.png|opengraph-image.png|favicon.ico)",
        headers: [
          {
            key: "Cache-Control",
            value: `public, max-age=${A_WEEK}, stale-while-revalidate=${A_YEAR}`,
          },
        ],
      },
      {
        // Android reads this when adding to the home screen; it is tiny and
        // near-constant, but was being revalidated on every visit.
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: `public, max-age=${A_WEEK}, stale-while-revalidate=${A_YEAR}`,
          },
        ],
      },
      {
        // Uploaded card images are served from Supabase storage, but anything
        // sitting in /public here is versioned by deployment.
        source: "/:path*.(svg|png|jpg|jpeg|webp|avif|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: `public, max-age=${A_WEEK}, stale-while-revalidate=${A_YEAR}`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
