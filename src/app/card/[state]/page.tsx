import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, PowerOff, Unplug } from "lucide-react";
import BrandMark from "@/components/layout/BrandMark";
import { isCardCode } from "@/lib/card-codes";

export const metadata: Metadata = { title: "Scorlyn card", robots: { index: false, follow: false } };

/**
 * Where a tap lands when the card can't open anything. The person holding
 * the phone is usually NOT the card's owner, so this talks to both: what's
 * going on for someone trying to reach a person, and one clear action for
 * the owner. Never the generic homepage.
 */
const STATES = {
  inactive: {
    icon: PowerOff,
    title: "This card isn't active right now",
    visitor: "If you were trying to reach someone, this card may have been temporarily turned off. Ask them for their number or link instead.",
    ownerLabel: "Is this your card?",
    ownerCta: "Manage my card",
    ownerHref: () => "/dashboard/cards",
  },
  "not-set-up": {
    icon: Unplug,
    title: "This card isn't set up yet",
    visitor: "This Scorlyn card hasn't been connected to a digital card yet, so there's nothing to show.",
    ownerLabel: "Just got this card?",
    ownerCta: "Activate my card",
    ownerHref: (code: string | null) => (code ? `/activate/${code}` : "/dashboard/cards"),
  },
} as const;

export default async function CardStatePage({
  params,
  searchParams,
}: {
  params: Promise<{ state: string }>;
  searchParams: Promise<{ c?: string }>;
}) {
  const { state } = await params;
  const { c } = await searchParams;
  if (!(state in STATES)) notFound();
  const s = STATES[state as keyof typeof STATES];
  const code = c && isCardCode(c) ? c : null;
  const Icon = s.icon;

  return (
    <main className="dot-grid min-h-screen bg-cream px-4 pb-16 pt-[max(1.5rem,env(safe-area-inset-top))] text-char">
      <div className="mx-auto max-w-md">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2">
          <BrandMark size={30} />
          <span className="display text-[26px]">ScorlynTap</span>
        </Link>

        <div className="brut mt-8 rounded-[1.75rem] bg-white p-6 sm:p-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-char bg-sun">
            <Icon className="h-6 w-6" />
          </span>
          <h1 className="display mt-5 text-[clamp(2.4rem,10vw,3.2rem)]">{s.title}</h1>
          <p className="mt-3 text-[16px] font-semibold leading-relaxed text-char/75">{s.visitor}</p>

          <div className="mt-6 rounded-2xl border-[3px] border-char bg-cream p-4">
            <p className="text-[14px] font-black">{s.ownerLabel}</p>
            <Link
              href={s.ownerHref(code)}
              className="brut-sm brut-press mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-sun px-6 text-[15px] font-black uppercase tracking-tight"
            >
              {s.ownerCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-[14px] font-bold text-char/70 hover:text-char"
        >
          What is ScorlynTap? Make your own free card →
        </Link>
      </div>
    </main>
  );
}
