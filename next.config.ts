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

/**
 * Content-Security-Policy, production only (the dev server needs eval).
 *
 * Scripts and styles still allow 'unsafe-inline' — the App Router's bootstrap
 * and the templates' inline styles need it without a nonce pipeline — so the
 * value here is in what it shuts: scripts, frames and connections from any
 * origin not listed, plugins, <base> hijacking, and framing by other sites.
 *
 * Every origin is here for a reason:
 *   *.supabase.co        data, auth and uploaded images/files
 *   cdn.jsdelivr.net     tesseract.js worker + core (offline card scanner)
 *   tessdata.projectnaptha.com  tesseract's language data
 *   youtube/vimeo/tiktok profile video embeds (ProfileExtras)
 *   mailto:              the Waitlist template's form
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net https://tessdata.projectnaptha.com",
  "worker-src 'self' blob: https://cdn.jsdelivr.net",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.tiktok.com",
  "frame-ancestors 'self'",
  "form-action 'self' mailto:",
  "object-src 'none'",
  "base-uri 'self'",
  "upgrade-insecure-requests",
].join("; ");
const A_WEEK = 60 * 60 * 24 * 7;

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Applied everywhere. The CSP (see CSP above) is production-only and
        // its allowlist must grow with any new third-party asset; the rest
        // are safe regardless:
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
          // Camera allowed for this site only: the admin "Scan card" page
          // reads printed QR codes with it. Third-party frames still get none.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
          ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: CSP }] : []),
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
