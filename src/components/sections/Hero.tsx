"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, Sparkles, Zap } from "lucide-react";
import BrandMark from "@/components/layout/BrandMark";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] as const },
});

/**
 * Poster hero: sea-teal field with a dot grid, a three-line condensed
 * headline with the key line in sun-orange inside a charcoal frame, and a
 * sticker collage of the product (phone page + NFC card) on the right.
 * Pure CSS/SVG — no photography to load on a phone connection.
 */
export function Hero({
  title,
  subtitle,
}: {
  /** Admin override. Plain text — the default carries its own markup. */
  title?: string | null;
  subtitle?: string | null;
} = {}) {
  return (
    <section className="dot-grid-light relative overflow-hidden border-b-[3px] border-char bg-sea pb-20 pt-[calc(72px+3.5rem)] sm:pb-24">
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
        {/* ---------------- Copy ---------------- */}
        <div>
          <motion.span
            {...fade(0)}
            className="brut-sm inline-flex -rotate-2 items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[13px] font-black uppercase tracking-tight text-char"
          >
            <Sparkles className="h-4 w-4 text-sun" />
            one tap. whole vibe.
          </motion.span>

          <motion.h1 {...fade(0.06)} className="mt-6">
            {title ? (
              <span className="display block text-[clamp(3.2rem,11vw,6.8rem)] text-white">{title}</span>
            ) : (
              <span className="inline-block border-b-[6px] border-r-[6px] border-char pb-2 pr-4">
                <span className="display block text-[clamp(3.2rem,11vw,6.8rem)] text-white">The best NFC</span>
                <span className="display block text-[clamp(3.2rem,11vw,6.8rem)] text-sun [text-shadow:4px_4px_0_#25272a]">
                  business card
                </span>
                <span className="display block text-[clamp(3.2rem,11vw,6.8rem)] text-white">in Pakistan</span>
              </span>
            )}
          </motion.h1>

          <motion.p {...fade(0.12)} className="mt-7 max-w-md text-lg font-bold leading-snug text-white sm:text-xl">
            {subtitle ||
              "Build your digital business card in minutes. Share it with a tap or a QR code anywhere in Pakistan. No app required."}
          </motion.p>

          <motion.div {...fade(0.18)} className="mt-9 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            {/* The profile page, not a physical product — what actually
                happens behind this button is building an online page. */}
            <Link
              href="/templates"
              className="brut brut-press group inline-flex h-16 items-center justify-center gap-2 rounded-full bg-sun px-8 text-lg font-black uppercase tracking-tight text-char"
            >
              build your profile
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            {/* The other path: a physical card that does one thing on a tap. */}
            <Link
              href="/dashboard/quick-order"
              className="brut brut-press inline-flex h-16 items-center justify-center gap-2 rounded-full bg-white px-8 text-lg font-black uppercase tracking-tight text-char"
            >
              <Zap className="h-5 w-5" />
              order an nfc card
            </Link>
          </motion.div>

          <motion.div {...fade(0.24)} className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              href="#how-it-works"
              className="inline-flex h-11 items-center gap-2 text-[15px] font-black uppercase tracking-tight text-white underline-offset-4 hover:underline"
            >
              <PlayCircle className="h-5 w-5" />
              see how it works
            </Link>
            <span className="text-sm font-bold text-white/85">no app · any phone · free to start</span>
          </motion.div>
        </div>

        {/* ---------------- Sticker collage ---------------- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto h-[520px] w-full max-w-[460px] sm:h-[560px]"
          aria-hidden="true"
        >
          {/* Soft disc + sun blob behind everything, like the reference's plate. */}
          <div className="absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10" />
          <div className="absolute bottom-10 left-6 h-[300px] w-[300px] rounded-[48%_52%_44%_56%] border-[3px] border-char bg-sun" />

          {/* Phone showing a card page */}
          <div className="absolute right-3 top-4 h-[440px] w-[226px] rotate-3 rounded-[36px] border-[3px] border-char bg-char p-1.5 shadow-[8px_8px_0_0_#25272a]">
            <div className="relative h-full w-full overflow-hidden rounded-[29px] bg-cream">
              <div className="absolute left-1/2 top-2 z-20 h-4 w-14 -translate-x-1/2 rounded-full bg-char" />
              <div className="flex h-full flex-col items-center px-4 pt-11">
                <div className="h-16 w-16 rounded-full border-[3px] border-char bg-sea" />
                <p className="display mt-3 text-[26px] text-char">Ayesha S.</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-char/60">real estate · lahore</p>
                <div className="mt-4 w-full space-y-2">
                  {[
                    ["whatsapp", "bg-sun"],
                    ["instagram", "bg-white"],
                    ["listings", "bg-white"],
                    ["save contact", "bg-sea text-white"],
                  ].map(([label, tone]) => (
                    <div key={label} className={`brut-sm rounded-xl px-3 py-2 text-[11px] font-black uppercase ${tone}`}>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* The physical card */}
          <div
            className="bob absolute bottom-6 left-0 h-[170px] w-[268px] rounded-3xl border-[3px] border-char bg-char p-5 shadow-[8px_8px_0_0_#f5ac53]"
            style={{ ["--r" as string]: "-8deg" }}
          >
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="display text-[30px] text-white">ScorlynTap</span>
                <BrandMark size={34} />
              </div>
              <div>
                <div className="mb-2 h-1.5 w-20 rounded-full bg-sun" />
                <div className="h-1.5 w-12 rounded-full bg-white/30" />
              </div>
            </div>
          </div>

          {/* Spinning circular badge */}
          <svg viewBox="0 0 120 120" className="spin-slow absolute -top-2 left-4 h-28 w-28">
            <defs>
              <path id="hero-badge-circle" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
            </defs>
            <circle cx="60" cy="60" r="58" fill="#ffc878" stroke="#25272a" strokeWidth="3" strokeDasharray="5 4" />
            <text className="display" fontSize="15" letterSpacing="3" fill="#25272a">
              <textPath href="#hero-badge-circle">TAP · SHARE · CONNECT · TAP · SHARE ·</textPath>
            </text>
          </svg>

          {/* Tag stickers */}
          <span className="brut-sm absolute left-[22%] top-[24%] -rotate-6 rounded-full bg-hotpink px-4 py-1.5 text-sm font-black uppercase text-white">
            no app!
          </span>
          <span className="brut-sm absolute -bottom-1 right-6 rotate-3 rounded-full bg-white px-4 py-2 text-sm font-black uppercase text-char">
            free to start
          </span>
          <span className="brut-sm absolute -right-3 top-[76%] rounded-2xl bg-sun px-3 py-2">
            <span className="block text-[10px] font-black uppercase text-char/70">one tap</span>
            <span className="display block text-xl text-char">opens your page</span>
          </span>

          {/* Sparkles */}
          <Sparkles className="absolute left-[44%] top-0 h-9 w-9 text-white" />
          <Sparkles className="absolute -right-2 bottom-24 h-8 w-8 text-sun" />
        </motion.div>
      </div>
    </section>
  );
}
