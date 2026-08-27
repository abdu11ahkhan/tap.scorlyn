"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, PlayCircle, Star, Zap } from "lucide-react";
import BrandMark from "@/components/layout/BrandMark";
import { RippleField } from "./RippleField";

/**
 * No photography, no pinned scroll sequence. The old hero loaded a full-bleed
 * JPEG and then pinned the page for 3000px of GSAP scrubbing before you could
 * reach anything — this one says what it is and gets out of the way.
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
    <section className="relative min-h-screen overflow-hidden bg-paper pt-32 pb-20">
      {/* One soft wash instead of three saturated glows — plays the
          reference's brushstroke-behind-the-mockup role without reading as
          a dark-theme glow effect on a white page. */}
      <div
        className="float-orb pointer-events-none absolute -right-24 top-24 h-[620px] w-[620px] rounded-full bg-teal/10 blur-[140px]"
      />
      <RippleField origin={{ x: 0.14, y: 0.22 }} />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-[1.15fr_1fr]">
        {/* ---------------- Copy ---------------- */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-[13px] font-black uppercase tracking-tight text-teal shadow-sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            one tap. whole vibe.
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.07 }}
            className="mt-7 text-[clamp(2.8rem,9vw,7rem)] font-black leading-[1.18] tracking-[-0.045em] text-ink sm:leading-[0.92]"
          >
            {title ? (
              // A custom headline is plain text: the default's highlight and
              // gradient are typeset around specific words and can't be
              // applied to arbitrary copy without looking accidental.
              title
            ) : (
              <>
                paper cards
                <br />
                are{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 text-teal">dead</span>
                  {/* Hand-drawn-style underline squiggle instead of the old
                      highlighter box — the box read as "text on a dark
                      panel"; a light page wants the accent to sit in the
                      text itself. */}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 120 14"
                    className="absolute -bottom-2 left-0 h-3 w-full text-teal"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 9 C 20 2, 40 12, 60 6 S 100 2, 118 8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <br />
                yours isn&apos;t.
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.14 }}
            className="mt-8 max-w-lg text-lg font-medium leading-relaxed text-ink-dim"
          >
            {subtitle ||
              "Build your online profile — every link, every way to reach you, on one page a tap opens instantly. No app. No QR. About two minutes."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
          >
            {/* This is the profile page, not a physical product — the copy
                used to say "create your card," which read as ordering
                something, when what actually happens on the other side of
                this button is building an online profile. */}
            <Link
              href="/templates"
              className="sticker-lg group inline-flex h-16 items-center justify-center gap-2 rounded-full bg-teal px-10 text-lg font-black uppercase tracking-tight text-white transition-transform hover:-translate-y-0.5"
            >
              build your online profile
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>

            {/* The other path: skip the profile entirely and go straight to
                a physical card that does one thing on a tap. */}
            <Link
              href="/dashboard/quick-order"
              className="sticker group inline-flex h-16 items-center justify-center gap-2 rounded-full border-2 border-ink bg-white px-8 text-lg font-black uppercase tracking-tight text-ink transition-transform hover:-translate-y-0.5"
            >
              <Zap className="h-5 w-5" />
              order an nfc card
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            {/* Points at the new step-by-step demonstration section — a
                stronger second path than the pricing anchor this used to
                point to, now that the page actually has something to show
                rather than only tell. */}
            <Link
              href="#how-it-works"
              className="group mt-3 inline-flex h-11 items-center gap-2 text-[15px] font-bold text-ink-dim transition-colors hover:text-teal"
            >
              <PlayCircle className="h-5 w-5 transition-colors" />
              see how it works
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            // whitespace-nowrap on each item: without it the three phrases
            // each break onto two lines on a narrow phone.
            className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold text-ink-dim"
          >
            <span className="whitespace-nowrap">no app needed</span>
            <span className="h-1 w-1 rounded-full bg-line" />
            <span className="whitespace-nowrap">works on any phone</span>
            <span className="h-1 w-1 rounded-full bg-line" />
            <span className="whitespace-nowrap">free to start</span>
          </motion.div>
        </div>

        {/* ---------------- Card + phone, pure CSS ---------------- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto h-[560px] w-full max-w-[420px]"
        >
          {/* Phone */}
          <div className="absolute right-0 top-6 h-[480px] w-[240px] rounded-[38px] border-[7px] border-ink bg-ink p-1.5 shadow-[0_30px_70px_rgba(5,24,33,0.35)]">
            <div className="relative h-full w-full overflow-hidden rounded-[30px] bg-white">
              <div className="absolute left-1/2 top-2 z-20 h-4 w-16 -translate-x-1/2 rounded-full bg-ink" />

              {/* A card profile, roughly as it really renders */}
              <div className="flex h-full flex-col items-center bg-gradient-to-b from-teal/10 to-white px-5 pt-12">
                <div className="h-16 w-16 rounded-full border-4 border-white bg-teal shadow-sm" />
                <p className="mt-3 text-lg font-black tracking-tight text-ink">
                  ayesha s.
                </p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-ink/50">
                  real estate
                </p>
                <div className="mt-5 w-full space-y-2">
                  {["whatsapp", "instagram", "listings", "email"].map((label) => (
                    <div
                      key={label}
                      className="rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-black text-ink shadow-sm"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* NFC card, tilted like a sticker */}
          <div
            // Sits clear of the phone's link stack rather than covering it.
            className="wobble sticker-lg absolute bottom-2 -left-4 h-[180px] w-[280px] rounded-3xl bg-ink p-5"
            style={{ ["--tilt" as string]: "-7deg" }}
          >
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-2xl font-black tracking-tight text-white">
                  ScorlynTap
                </span>
                <BrandMark size={36} />
              </div>
              <div>
                <div className="mb-2 h-1.5 w-20 rounded-full bg-teal" />
                <div className="h-1.5 w-12 rounded-full bg-white/30" />
              </div>
            </div>
          </div>

          {/* Tap ping, in the gap between card and phone */}
          <div className="absolute bottom-[120px] left-[268px] h-14 w-14">
            <span className="pulse-ring absolute inset-0 rounded-full border-2 border-teal" />
            <span
              className="pulse-ring absolute inset-0 rounded-full border-2 border-teal"
              style={{ ["--d" as string]: "900ms" }}
            />
          </div>

          {/* Floating rating card — reference-style social proof, kept
              honest (no fabricated review count on-screen elsewhere, this
              is decorative alongside the badge above, not a claimed metric). */}
          <div className="sticker-lg absolute -bottom-6 -right-4 z-20 w-[168px] rounded-2xl bg-white p-3.5">
            <p className="text-2xl font-black tracking-tight text-ink">4.9</p>
            <div className="mt-1.5 flex items-center">
              <div className="flex -space-x-2">
                {["#F58800", "#266867", "#051821", "#F8BC24"].map((color, i) => (
                  <span
                    key={color}
                    className="h-6 w-6 rounded-full border-2 border-white"
                    style={{ background: color, zIndex: 4 - i }}
                  />
                ))}
              </div>
              <span className="ml-1.5 rounded-full bg-acid px-1.5 py-0.5 text-[10px] font-black text-ink">
                5k
              </span>
            </div>
            <div className="mt-1.5 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-acid text-acid" />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
