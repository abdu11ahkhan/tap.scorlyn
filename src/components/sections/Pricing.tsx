"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import PosterTitle from "./PosterTitle";

/**
 * Kept in step with the `plans` table by hand.
 *
 * These numbers are quoted on the storefront and charged from the database, so
 * a mismatch is a customer being shown one price and billed another. If this
 * drifts again it should read from the table instead — the only reason it
 * doesn't is that this is a client component inside a static marketing page.
 */
const PLANS = [
  {
    name: "free page",
    price: "Rs.0",
    note: "forever",
    perks: ["your own card page", "every template", "unlimited links", "tap counter"],
    cta: "start free",
    href: "/templates",
    className: "bg-white text-char",
    button: "bg-char text-white",
    tilt: "-1.5deg",
  },
  {
    name: "blank nfc card",
    price: "Rs.1,600",
    note: "one time",
    perks: [
      "everything in the free page",
      "blank NFC card, posted to you",
      "we write and link it for you",
      "swap your page design anytime",
    ],
    cta: "get my card",
    href: "/templates",
    className: "bg-sun text-char",
    button: "bg-char text-sun",
    featured: true,
    tilt: "1deg",
  },
  {
    name: "your design",
    price: "Rs.2,200",
    note: "one time",
    perks: [
      "everything in the blank card",
      "your artwork printed on it",
      "design help if you need it",
      "priority support",
    ],
    cta: "order yours",
    href: "/templates",
    className: "bg-white text-char",
    button: "bg-char text-white",
    tilt: "-1deg",
  },
];

export function Pricing({ note }: { note?: string | null } = {}) {
  return (
    <section id="pricing" className="dot-grid relative scroll-mt-20 border-b-[3px] border-char bg-cream py-24">
      <div className="relative mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <PosterTitle
            lead="Cheap."
            accent="Obviously"
            align="center"
            sub="The card page is free forever. You only pay when you want the physical card in your pocket."
          />
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              style={{ rotate: plan.tilt }}
              className={`brut brut-press relative rounded-[2rem] p-8 hover:!rotate-0 ${plan.className}`}
            >
              {plan.featured && (
                <span className="brut-sm absolute -top-4 right-7 rotate-3 rounded-full bg-hotpink px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white">
                  most popular
                </span>
              )}

              <h3 className="display text-[30px]">{plan.name}</h3>

              <div className="mb-7 mt-3 flex items-baseline gap-2">
                <span className="display text-[64px]">{plan.price}</span>
                <span className="text-sm font-bold uppercase tracking-widest opacity-50">
                  {plan.note}
                </span>
              </div>

              <ul className="mb-9 space-y-3.5">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-3 text-[15px] font-semibold">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-current">
                      <Check className="h-3 w-3" strokeWidth={3.5} />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`brut-sm brut-press flex h-14 items-center justify-center rounded-full text-base font-black uppercase tracking-tight ${plan.button}`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm font-bold text-char/70">
          {note || "Prices in PKR. Bulk orders for teams — just ask."}
        </p>
      </div>
    </section>
  );
}
