"use client";

import { motion } from "framer-motion";
import { Layers, Zap, Smartphone, BarChart3, Palette, Link2 } from "lucide-react";
import { RippleField } from "./RippleField";

const CARDS = [
  {
    title: "tap. done.",
    body: "Hold the card to any phone and it opens. No app, no QR code, no awkward 'let me find you on LinkedIn'.",
    icon: Smartphone,
    chip: "bg-acid text-ink",
    span: "sm:col-span-2",
    tilt: "-1.5deg",
  },
  {
    title: "looks unreal",
    body: "42 templates that actually slap. Pick your colour, pick your font, done.",
    icon: Palette,
    chip: "bg-teal text-white",
    span: "",
    tilt: "2deg",
  },
  {
    title: "every link, one place",
    body: "WhatsApp, Instagram, your portfolio, your Calendly. Drag them into whatever order you want.",
    icon: Link2,
    chip: "bg-ink text-white",
    span: "",
    tilt: "-2deg",
  },
  {
    title: "see who tapped",
    body: "Real numbers on how many people opened your card, and how many of them got one too.",
    icon: BarChart3,
    chip: "bg-teal/10 text-teal",
    span: "sm:col-span-2",
    tilt: "1.5deg",
  },
  {
    title: "change it anytime",
    body: "New job? New number? Edit once. Every card you've ever handed out updates itself.",
    icon: Zap,
    chip: "bg-sand text-ink",
    span: "sm:col-span-2",
    tilt: "-1deg",
  },
  {
    title: "zero code",
    body: "If you can fill in a form, you can build this.",
    icon: Layers,
    chip: "bg-acid/15 text-acid",
    span: "",
    tilt: "2.5deg",
  },
];

export function Features() {
  return (
    <section id="features" className="relative overflow-hidden bg-paper py-28">
      <RippleField origin={{ x: 0.1, y: 0.85 }} />
      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 max-w-3xl"
        >
          <h2 className="text-[clamp(2.8rem,7vw,5.5rem)] font-black leading-[0.88] tracking-[-0.05em] text-ink">
            why you&apos;ll
            <br />
            <span className="text-teal">actually use it</span>
          </h2>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-3">
          {CARDS.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 34 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: index * 0.06 }}
                style={{ rotate: card.tilt }}
                className={`sticker-lg rounded-[1.75rem] bg-mist p-7 text-ink transition-transform duration-300 hover:!rotate-0 hover:-translate-y-1 ${card.span}`}
              >
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${card.chip}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2.5 text-2xl font-black tracking-tight">{card.title}</h3>
                <p className="text-[15px] font-medium leading-relaxed text-ink-dim">{card.body}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
