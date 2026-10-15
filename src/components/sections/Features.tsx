"use client";

import { CARD_TEMPLATES } from "@/lib/card";

import { motion } from "framer-motion";
import { Layers, Zap, Smartphone, BarChart3, Palette, Link2 } from "lucide-react";
import PosterTitle from "./PosterTitle";

const CARDS = [
  {
    tag: "no app",
    title: "tap. done.",
    body: "Hold the card to any phone and it opens. No app, no QR hunting, no awkward 'let me find you on LinkedIn'.",
    icon: Smartphone,
    chip: "bg-sun",
    span: "sm:col-span-2",
  },
  {
    tag: `${CARD_TEMPLATES.length} designs`,
    title: "looks unreal",
    body: "Templates that actually slap. Pick your colour, pick your font, done.",
    icon: Palette,
    chip: "bg-sea text-white",
    span: "",
  },
  {
    tag: "any link",
    title: "every link, one place",
    body: "WhatsApp, Instagram, your portfolio, your Calendly — in whatever order you want.",
    icon: Link2,
    chip: "bg-char text-white",
    span: "",
  },
  {
    tag: "live stats",
    title: "see who tapped",
    body: "Real numbers on how many people opened your card, and what they tapped next.",
    icon: BarChart3,
    chip: "bg-sun-soft",
    span: "sm:col-span-2",
  },
  {
    tag: "edit anytime",
    title: "change it anytime",
    body: "New job? New number? Edit once. Every card you've ever handed out updates itself.",
    icon: Zap,
    chip: "bg-sun",
    span: "sm:col-span-2",
  },
  {
    tag: "no code",
    title: "zero code",
    body: "If you can fill in a form, you can build this.",
    icon: Layers,
    chip: "bg-sea text-white",
    span: "",
  },
];

export function Features() {
  return (
    <section id="features" className="dot-grid relative scroll-mt-20 border-b-[3px] border-char bg-white py-14 sm:py-24">
      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-10 sm:mb-14"
        >
          <PosterTitle lead="Why you'll" accent="actually use it" variant="outline" />
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6">
          {CARDS.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 34 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: index * 0.06 }}
                className={`brut brut-press relative rounded-[1.5rem] bg-cream p-4 text-char sm:rounded-[1.75rem] sm:p-7 ${card.span}`}
              >
                <span className="absolute left-3 top-3 rounded-full border-2 border-char bg-hotpink px-2 py-0.5 text-[9px] font-black uppercase text-white sm:left-5 sm:top-5 sm:px-2.5 sm:text-[11px]">
                  {card.tag}
                </span>
                <div className={`mb-3 ml-auto flex h-11 w-11 items-center justify-center rounded-xl border-2 border-char sm:mb-5 sm:h-14 sm:w-14 sm:rounded-2xl sm:border-[3px] ${card.chip}`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="display mb-1 text-[22px] sm:mb-2 sm:text-[34px]">{card.title}</h3>
                <p className="text-[13px] font-semibold leading-snug text-char/75 sm:text-[15px] sm:leading-relaxed">{card.body}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
