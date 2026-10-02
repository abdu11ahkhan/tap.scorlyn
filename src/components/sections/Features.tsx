"use client";

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
    tag: "44 designs",
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
    <section id="features" className="dot-grid relative scroll-mt-20 border-b-[3px] border-char bg-white py-24">
      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <PosterTitle lead="Why you'll" accent="actually use it" variant="outline" />
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-3">
          {CARDS.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 34 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: index * 0.06 }}
                className={`brut brut-press relative rounded-[1.75rem] bg-cream p-7 text-char ${card.span}`}
              >
                <span className="absolute left-5 top-5 rounded-full border-2 border-char bg-hotpink px-2.5 py-0.5 text-[11px] font-black uppercase text-white">
                  {card.tag}
                </span>
                <div className={`mb-5 ml-auto flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-char ${card.chip}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="display mb-2 text-[34px]">{card.title}</h3>
                <p className="text-[15px] font-semibold leading-relaxed text-char/75">{card.body}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
