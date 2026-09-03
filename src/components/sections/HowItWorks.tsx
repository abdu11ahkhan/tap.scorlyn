"use client";

import { motion } from "framer-motion";
import { LayoutTemplate, IdCard, Smartphone, Share2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { RippleField } from "./RippleField";

/**
 * The concept in four beats, not a feature list: build the page, get the
 * card, tap it, the page opens. Same sticker/tilt language as Features and
 * the closing CTA — a new section, not a new visual system.
 */
const STEPS = [
  {
    n: "01",
    title: "create your card",
    body: "Pick from 42 templates, drop in your links. Free, and it takes about two minutes.",
    icon: LayoutTemplate,
    chip: "bg-acid text-ink",
  },
  {
    n: "02",
    title: "get your nfc card",
    body: "Order the physical card once your page is live. It's paired to your card, ready to print.",
    icon: IdCard,
    chip: "bg-teal text-white",
  },
  {
    n: "03",
    title: "tap your phone",
    body: "Hold it near any phone — theirs, not just yours. No app, no QR, nothing to scan first.",
    icon: Smartphone,
    chip: "bg-ink text-white",
  },
  {
    n: "04",
    title: "they connect",
    body: "Your page opens instantly. They save your contact, message you, or follow — right there.",
    icon: Share2,
    chip: "bg-sand text-ink",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-mist py-28">
      <RippleField origin={{ x: 0.88, y: 0.15 }} />
      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 max-w-2xl"
        >
          <h2 className="text-[clamp(2.6rem,7vw,5rem)] font-black leading-[0.9] tracking-[-0.05em] text-ink">
            one card.
            <br />
            <span className="text-teal">four steps.</span>
          </h2>
          <p className="mt-5 text-lg font-medium text-ink-dim">
            A digital page you build once, and a physical card that opens it on
            any phone. Here&apos;s the whole loop.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 34 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative"
              >
                <div className="sticker-lg h-full rounded-[1.75rem] bg-paper p-6 text-ink transition-transform duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black tracking-widest text-ink/30">{step.n}</span>
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${step.chip}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="mt-5 text-xl font-black tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-ink-dim">{step.body}</p>
                </div>

                {/* Connector — a step in a real sequence, not four unrelated
                    cards, but only between cards, and only where a row
                    actually continues (hidden on the last item and on
                    mobile's single column). */}
                {i < STEPS.length - 1 && (
                  <div className="pointer-events-none absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 md:block">
                    <ArrowRight className="h-6 w-6 text-ink/20" strokeWidth={3} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 flex flex-wrap items-center gap-4"
        >
          <Link
            href="/templates"
            className="sticker sticker-press inline-flex h-14 items-center justify-center gap-2 rounded-full bg-teal px-8 text-base font-black uppercase tracking-tight text-white"
          >
            create your card
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard/nfc"
            className="inline-flex h-14 items-center justify-center rounded-full px-7 text-base font-bold text-ink transition-colors hover:text-teal"
          >
            get your nfc card
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
