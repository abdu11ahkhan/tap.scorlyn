import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CARD_PURPOSES } from "@/lib/card";
import { iconFor } from "@/components/card-templates/button-icons";

export const metadata: Metadata = {
  title: "Build a direct-action card — ScorlynTap",
  description:
    "A card dedicated to one action. A tap opens it directly — no profile page in between.",
};

/**
 * The other kind of card: not a profile, one action.
 *
 * A regular ScorlynTap card opens a page of everything about you. This one
 * skips that entirely — pick what a tap should do, and it does exactly that,
 * every time, on both the chip and the printed QR.
 */
export default function PickPurposePage() {
  return (
    <div className="relative min-h-screen bg-paper text-ink">
      <div className="float-orb pointer-events-none absolute -top-32 left-1/4 h-[600px] w-[700px] rounded-full bg-teal/8 blur-[150px]" />

      <div className="relative mx-auto w-full max-w-4xl px-4 pt-14 pb-20 sm:px-6 sm:pt-20">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-xs font-black uppercase tracking-widest text-ink-dim transition-colors hover:border-teal hover:text-teal"
        >
          ← ScorlynTap
        </Link>

        <h1 className="card-rise mt-7 text-[clamp(2.6rem,7vw,4.5rem)] font-black leading-[0.9] tracking-[-0.05em]">
          one tap. <span className="text-teal">one action.</span>
        </h1>
        <p
          className="card-rise mt-5 max-w-xl text-lg font-medium text-ink-dim"
          style={{ ["--d" as string]: "80ms" }}
        >
          Not a profile page — a card built for exactly one thing. Pick what a
          tap should do, add the one detail it needs, then choose a design.
        </p>

        <div
          className="card-rise mt-10 grid gap-3 sm:grid-cols-2"
          style={{ ["--d" as string]: "140ms" }}
        >
          {CARD_PURPOSES.map((purpose) => {
            const Icon = iconFor(purpose.kind);
            return (
              <Link
                key={purpose.id}
                href={`/templates?purpose=${purpose.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-line bg-mist p-4 transition-colors hover:border-teal hover:bg-teal/5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-sm">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black lowercase text-ink">{purpose.label}</p>
                  <p className="truncate text-xs font-semibold text-ink-dim">{purpose.blurb}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-ink-dim transition-transform group-hover:translate-x-1 group-hover:text-teal" />
              </Link>
            );
          })}
        </div>

        <p
          className="card-rise mt-10 text-sm font-semibold text-ink-dim"
          style={{ ["--d" as string]: "180ms" }}
        >
          Want the full profile card instead — links, bio, photos, everything?{" "}
          <Link href="/templates" className="font-black text-teal hover:underline">
            Browse all templates
          </Link>
        </p>
      </div>
    </div>
  );
}
