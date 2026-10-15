"use client";

import { CARD_TEMPLATES } from "@/lib/card";

import { motion } from "framer-motion";
import { LayoutTemplate, IdCard, Smartphone, Share2 } from "lucide-react";
import PosterTitle from "./PosterTitle";

/**
 * The concept in four beats: build the page, get the card, tap it, the page
 * opens. Numbered colour-block cards, like a menu of steps.
 */
const STEPS = [
  {
    n: 1,
    title: "create your card",
    body: `Pick from ${CARD_TEMPLATES.length} templates, drop in your links. Free, and it takes about two minutes.`,
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
    <section id="how-it-works" className="dot-grid relative scroll-mt-20 border-b-[3px] border-char bg-cream py-14 sm:py-24">
      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-10 sm:mb-14"
        >
          <PosterTitle
            lead="One card."
            accent="Four steps"
            align="center"
            sub="A digital page you build once, and a physical card that opens it on any phone. Here's the whole loop."
          />
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 34 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`brut brut-press relative flex h-full flex-col rounded-[1.5rem] p-4 sm:rounded-[1.75rem] sm:p-6 ${step.card}`}
              >
                <span className="brut-sm absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black text-char sm:-right-3 sm:-top-3 sm:h-10 sm:w-10 sm:text-sm">
                  {step.n}
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-char bg-cream text-char sm:h-14 sm:w-14 sm:rounded-2xl sm:border-[3px]">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
                <h3 className="display mt-4 text-[22px] sm:mt-6 sm:text-[32px]">{step.title}</h3>
                <p className="mt-1.5 text-[13px] font-semibold leading-snug opacity-85 sm:mt-2 sm:text-[15px] sm:leading-relaxed">{step.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
