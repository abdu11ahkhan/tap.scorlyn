"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "free",
    price: "Rs.0",
    note: "forever",
    perks: ["1 digital card", "all 5 templates", "unlimited links", "tap counter"],
    cta: "start free",
    href: "/templates",
    className: "bg-white text-ink",
    button: "bg-ink text-white",
    tilt: "-1.5deg",
  },
  {
    name: "card + setup",
    price: "Rs.1,200",
    note: "one time",
    perks: [
      "everything in free",
      "physical NFC card, posted to you",
      "we write and link it for you",
      "full referral dashboard",
      "swap your design anytime",
    ],
    cta: "get my card",
    href: "/templates",
    className: "bg-acid text-ink",
    button: "bg-ink text-acid",
    featured: true,
    tilt: "1.5deg",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="grain relative overflow-hidden bg-ink py-28">
      <div className="float-orb pointer-events-none absolute -right-32 top-1/3 h-[460px] w-[460px] rounded-full bg-hotpink/20 blur-[130px]" />

      <div className="relative mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-[clamp(2.8rem,7vw,5.5rem)] font-black leading-[0.88] tracking-[-0.05em] text-white">
            cheap. <span className="text-hotpink">obviously.</span>
          </h2>
          <p className="mt-5 max-w-lg text-lg font-medium text-white/60">
            The digital card is free. You only pay if you want the physical one in
            your pocket.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              style={{ rotate: plan.tilt }}
              className={`sticker-lg relative rounded-[2rem] border-2 border-ink p-8 transition-transform duration-300 hover:!rotate-0 hover:-translate-y-1 ${plan.className}`}
            >
              {plan.featured && (
                <span className="sticker absolute -top-4 right-7 rounded-full border-2 border-ink bg-hotpink px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white">
                  most popular
                </span>
              )}

              <h3 className="text-xl font-black uppercase tracking-tight">{plan.name}</h3>

              <div className="mb-7 mt-3 flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                <span className="text-sm font-bold uppercase tracking-widest opacity-50">
                  {plan.note}
                </span>
              </div>

              <ul className="mb-9 space-y-3.5">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-3 text-[15px] font-semibold">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-ink">
                      <Check className="h-3 w-3" strokeWidth={3.5} />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`sticker sticker-press flex h-14 items-center justify-center rounded-full border-2 border-ink text-base font-black uppercase tracking-tight ${plan.button}`}
                style={{ ["--sticker-color" as string]: "#0a0a0a" }}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm font-semibold text-white/40">
          Prices in PKR. Bulk orders for teams — just ask.
        </p>
      </div>
    </section>
  );
}
