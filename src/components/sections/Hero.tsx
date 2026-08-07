"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import BrandMark from "@/components/layout/BrandMark";

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
    <section className="grain relative min-h-screen overflow-hidden bg-ink pt-32 pb-20">
      {/* Acid colour fields instead of a background photo. */}
      <div className="float-orb pointer-events-none absolute -left-40 -top-32 h-[560px] w-[560px] rounded-full bg-acid/25 blur-[130px]" />
      <div
        className="float-orb pointer-events-none absolute -right-32 top-20 h-[520px] w-[520px] rounded-full bg-hotpink/25 blur-[130px]"
        style={{ ["--d" as string]: "3s" }}
      />
      <div
        className="float-orb pointer-events-none absolute bottom-0 left-1/3 h-[480px] w-[480px] rounded-full bg-violet-pop/25 blur-[130px]"
        style={{ ["--d" as string]: "6s" }}
      />

      {/* Grid paper */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-[1.15fr_1fr]">
        {/* ---------------- Copy ---------------- */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="sticker inline-flex items-center gap-2 rounded-full border-2 border-ink bg-acid px-4 py-2 text-[13px] font-black uppercase tracking-tight text-ink"
          >
            <Zap className="h-4 w-4 fill-ink" />
            one tap. whole vibe.
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.07 }}
            className="mt-7 text-[clamp(2.8rem,9vw,7rem)] font-black leading-[1.18] tracking-[-0.045em] text-white sm:leading-[0.92]"
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
                  <span className="relative z-10 text-ink">dead</span>
                  {/* Generous inset — a tight box clips the descender on the 'd'. */}
                  <span className="absolute inset-x-[-0.08em] inset-y-[-0.02em] -z-0 -rotate-1 rounded-lg bg-hotpink" />
                </span>
                <br />
                <span className="bg-gradient-to-r from-acid via-cyan-300 to-hotpink bg-clip-text text-transparent">
                  yours isn&apos;t.
                </span>
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.14 }}
            className="mt-8 max-w-lg text-lg font-medium leading-relaxed text-white/60"
          >
            {subtitle ||
              "Tap your card on any phone and your whole profile opens instantly. No app. No QR. Build it in about two minutes."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
          >
            <Link
              href="/templates"
              className="sticker-lg sticker-press group inline-flex h-16 items-center justify-center gap-2 rounded-full border-2 border-ink bg-acid px-10 text-lg font-black uppercase tracking-tight text-ink"
            >
              start building
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/templates"
              className="inline-flex h-16 items-center justify-center rounded-full border-2 border-white/25 px-8 text-lg font-bold text-white transition-colors hover:border-white hover:bg-white/5"
            >
              see templates
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            // whitespace-nowrap on each item: without it the three phrases
            // each break onto two lines on a narrow phone.
            className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold text-white/40"
          >
            <span className="whitespace-nowrap">no app needed</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span className="whitespace-nowrap">works on any phone</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
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
          <div className="absolute right-0 top-6 h-[480px] w-[240px] rounded-[38px] border-[7px] border-ink bg-ink p-1.5 shadow-[0_30px_70px_rgba(0,0,0,0.6)]">
            <div className="relative h-full w-full overflow-hidden rounded-[30px] bg-white">
              <div className="absolute left-1/2 top-2 z-20 h-4 w-16 -translate-x-1/2 rounded-full bg-ink" />

              {/* A card profile, roughly as it really renders */}
              <div className="flex h-full flex-col items-center bg-gradient-to-b from-acid/25 to-white px-5 pt-12">
                <div className="h-16 w-16 rounded-full border-4 border-ink bg-hotpink" />
                <p className="mt-3 text-lg font-black tracking-tight text-ink">
                  ayesha s.
                </p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-ink/50">
                  real estate
                </p>
                <div className="mt-5 w-full space-y-2">
                  {["whatsapp", "instagram", "listings", "email"].map((label, i) => (
                    <div
                      key={label}
                      className="sticker rounded-xl border-2 border-ink bg-white px-3 py-2.5 text-xs font-black text-ink"
                      style={{ ["--sticker-color" as string]: i === 0 ? "#CCFF00" : "#0a0a0a" }}
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
            className="wobble sticker-lg absolute bottom-2 -left-4 h-[180px] w-[280px] rounded-3xl border-2 border-ink bg-gradient-to-br from-violet-pop to-hotpink p-5"
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
                <div className="mb-2 h-1.5 w-20 rounded-full bg-white/50" />
                <div className="h-1.5 w-12 rounded-full bg-white/30" />
              </div>
            </div>
          </div>

          {/* Tap ping, in the gap between card and phone */}
          <div className="absolute bottom-[120px] left-[268px] h-14 w-14">
            <span className="pulse-ring absolute inset-0 rounded-full border-2 border-acid" />
            <span
              className="pulse-ring absolute inset-0 rounded-full border-2 border-acid"
              style={{ ["--d" as string]: "900ms" }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
