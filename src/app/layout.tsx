import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import HydrationFlag from "@/components/layout/HydrationFlag";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ScorlynTap - Professional Portfolio Builder",
  description: "Create your professional portfolio in minutes, connect with NFC, and share your profile anywhere.",
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
