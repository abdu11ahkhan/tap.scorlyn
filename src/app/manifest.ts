import type { MetadataRoute } from "next";

/**
 * What Android uses when someone adds the site to their home screen.
 *
 * Without a manifest, Chrome invents a name from the page title, uses a
 * shrunken favicon, and opens the shortcut in a browser tab with the address
 * bar — which is not what someone who "installed" it expects.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ScorlynTap — NFC digital business cards",
    short_name: "ScorlynTap",
    description:
      "Your card, one tap away. Build a digital business card and order an NFC card that opens it.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0B0B0B",
    theme_color: "#0B0B0B",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        // Android crops icons to its own shape; without a maskable icon it
        // pads the square one inside a circle and it comes out small.
        purpose: "maskable",
      },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
