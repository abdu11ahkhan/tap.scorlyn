"use client";

import { motion } from "framer-motion";
import { LayoutTemplate, IdCard, Smartphone, Share2, ArrowRight } from "lucide-react";
import Link from "next/link";
import PosterTitle from "./PosterTitle";

/**
 * The concept in four beats: build the page, get the card, tap it, the page
 * opens. Numbered colour-block cards, like a menu of steps.
 */
const STEPS = [
  {
    n: 1,
    title: "create your card",
    body: "Pick from 44 templates, drop in your links. Free, and it takes about two minutes.",
    icon: LayoutTemplate,
    card: "bg-sun text-char",
  },
  {
    n: 2,
    title: "get your nfc card",
    body: "Order the physical card once your page is live. It's paired to your page, ready to print.",
    icon: IdCard,
    card: "bg-sea text-white",
  },
  {
    n: 3,
    title: "tap any phone",
    body: "Hold it near any phone — theirs, not just yours. No app, nothing to install first.",
    icon: Smartphone,
    card: "bg-white text-char",
  },
  {
    n: 4,
    title: "they connect",
    body: "Your page opens instantly. They save your contact, message you or follow — right there.",
    icon: Share2,
    card: "bg-sun-soft text-char",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="dot-grid relative scroll-mt-20 border-b-[3px] border-char bg-cream py-24">
      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <PosterTitle
            lead="One card."
            accent="Four steps"
            align="center"
            sub="A digital page you build once, and a physical card that opens it on any phone. Here's the whole loop."
          />
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 34 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`brut brut-press relative flex h-full flex-col rounded-[1.75rem] p-6 ${step.card}`}
              >
                <span className="brut-sm absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-black text-char">
                  {step.n}
                </span>
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-char bg-cream text-char">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="display mt-6 text-[32px]">{step.title}</h3>
                <p className="mt-2 text-[15px] font-semibold leading-relaxed opacity-85">{step.body}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/templates"
            className="brut brut-press inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-sun px-8 text-base font-black uppercase tracking-tight text-char sm:w-auto"
          >
            create your card
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard/nfc"
            className="brut brut-press inline-flex h-14 w-full items-center justify-center rounded-full bg-white px-8 text-base font-black uppercase tracking-tight text-char sm:w-auto"
          >
            get your nfc card
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
