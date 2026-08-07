import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // The template gallery opens a dozen of these per visit, and the route
        // is pure computation from its params — no database, no session. It
        // reads accent/font off the query string, which forces dynamic
        // rendering and makes Next send no-store, so the CDN is told
        // explicitly that this response is safe to keep.
        source: "/preview/card/:template",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
