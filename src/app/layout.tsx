import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import HydrationFlag from "@/components/layout/HydrationFlag";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  // Android Chrome tints its toolbar with this; without it the browser
  // frame stays grey while the site is black, which looks like a seam.
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B0B0B" },
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
  ],
  width: "device-width",
  initialScale: 1,
  // Pinch-zoom stays available: capping it is an accessibility failure, and
  // nothing here needs it disabled.
  maximumScale: 5,
  // manifest.ts declares display: "standalone" — installed as a home-screen
  // app on iOS, content can render straight under the notch/Dynamic Island
  // unless the page opts into drawing under it and insets itself. "cover"
  // is what makes env(safe-area-inset-*) report real values at all; without
  // it every safe-area-inset-* below silently reads 0.
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ScorlynTap - Professional Portfolio Builder",
  description: "Create your digital business card in minutes, connect with NFC, and share it anywhere.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/*
          Safety net for browsers where our JavaScript never runs.

          Animated sections are server-rendered with opacity:0 and rely on the
          client to reveal them, so a single unsupported feature anywhere in
          the bundle leaves a visitor looking at nothing but section
          backgrounds — which is exactly what an older iPhone Safari showed.
          This runs before paint, and if React has not signalled that it
          mounted within two seconds it forces everything visible. The page
          then reads as a plain, static site rather than a blank one.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.setTimeout(function(){if(!window.__st_mounted){" +
              "document.documentElement.classList.add('js-failed')}},2000);",
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}>
        <HydrationFlag />
        {children}
      </body>
    </html>
  );
}
