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
