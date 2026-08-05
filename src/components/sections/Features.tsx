"use client";

import { motion } from "framer-motion";
import { Layers, Zap, Smartphone, BarChart3, Palette, Link2 } from "lucide-react";

const CARDS = [
  {
    title: "tap. done.",
    body: "Hold the card to any phone and your profile opens. No app, no QR code, no awkward 'let me find you on LinkedIn'.",
    icon: Smartphone,
    className: "sm:col-span-2 bg-acid text-ink",
    tilt: "-1.5deg",
  },
  {
    title: "looks unreal",
    body: "Five templates that actually slap. Pick your colour, pick your font, done.",
    icon: Palette,
    className: "bg-hotpink text-white",
    tilt: "2deg",
  },
  {
    title: "every link, one place",
    body: "WhatsApp, Instagram, your portfolio, your Calendly. Drag them into whatever order you want.",
    icon: Link2,
    className: "bg-violet-pop text-white",
    tilt: "-2deg",
  },
  {
    title: "see who tapped",
    body: "Real numbers on how many people opened your card, and how many of them got one too.",
    icon: BarChart3,
    className: "sm:col-span-2 bg-white text-ink",
    tilt: "1.5deg",
  },
  {
    title: "change it anytime",
    body: "New job? New number? Edit once. Every card you've ever handed out updates itself.",
    icon: Zap,
    className: "sm:col-span-2 bg-cyan-300 text-ink",
    tilt: "-1deg",
  },
  {
    title: "zero code",
    body: "If you can fill in a form, you can build this.",
    icon: Layers,
    className: "bg-white text-ink",
    tilt: "2.5deg",
  },
];

export function Features() {
  return (
    <section id="features" className="grain relative overflow-hidden bg-ink py-28">
      <div
        className="float-orb pointer-events-none absolute -left-40 top-1/4 h-[420px] w-[420px] rounded-full bg-violet-pop/20 blur-[130px]"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 max-w-3xl"
        >
          <h2 className="text-[clamp(2.8rem,7vw,5.5rem)] font-black leading-[0.88] tracking-[-0.05em] text-white">
            why you&apos;ll
            <br />
            <span className="text-acid">actually use it</span>
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
                className={`sticker-lg rounded-[1.75rem] border-2 border-ink p-7 transition-transform duration-300 hover:!rotate-0 hover:-translate-y-1 ${card.className}`}
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink bg-ink/10">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2.5 text-2xl font-black tracking-tight">{card.title}</h3>
                {/* 75% white on hot pink / violet was too faint to read
                    comfortably; the dark-text cards can stay lighter. */}
                <p
                  className={`text-[15px] font-medium leading-relaxed ${
                    card.className.includes("text-white") ? "opacity-95" : "opacity-70"
                  }`}
                >
                  {card.body}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
