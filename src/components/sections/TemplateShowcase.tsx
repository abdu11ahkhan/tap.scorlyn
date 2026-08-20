"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CARD_TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/card";

/**
 * Real templates, real names, real accents — CARD_TEMPLATES.preview is the
 * same colour the /templates gallery itself demos each one with, so this
 * isn't a second, invented palette. Grouped by the product's own five
 * categories (TEMPLATE_CATEGORIES), not a marketing taxonomy layered on top.
 */
export function TemplateShowcase() {
  return (
    <section id="designs" className="grain relative overflow-hidden bg-ink py-28">
      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-14 flex flex-wrap items-end justify-between gap-6"
        >
          <div className="max-w-xl">
            <h2 className="text-[clamp(2.6rem,7vw,5rem)] font-black leading-[0.9] tracking-[-0.05em] text-white">
              explore <span className="text-acid">36 designs.</span>
            </h2>
            <p className="mt-5 text-lg font-medium text-white/55">
              Five kinds of page, thirty-six looks. Whatever you lead with —
              a single link-in-bio card or a whole portfolio — there&apos;s a
              starting point already built.
            </p>
          </div>
          <Link
            href="/templates"
            className="sticker sticker-press inline-flex h-14 shrink-0 items-center gap-2 rounded-full border-2 border-ink bg-white px-7 text-base font-black uppercase tracking-tight text-ink"
          >
            see all templates
          </Link>
        </motion.div>

        <div className="space-y-12">
          {TEMPLATE_CATEGORIES.map((cat) => {
            const templates = CARD_TEMPLATES.filter((t) => t.category === cat.id);
            if (templates.length === 0) return null;
            return (
              <div key={cat.id}>
                <div className="mb-4 flex items-baseline gap-3">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">
                    {cat.name}
                  </h3>
                  <span className="text-sm font-medium text-white/35">{cat.blurb}</span>
                </div>

                {/* Horizontally scrollable on mobile — 36 tiles in fixed
                    columns would either be tiny or force a huge page; a
                    native scroll snap keeps each tile a real, tappable size
                    on a phone. */}
                <div className="flex gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible">
                  {templates.map((t) => (
                    <Link
                      key={t.id}
                      href={`/templates/${t.id}/edit`}
                      className="group sticker relative h-32 w-40 shrink-0 overflow-hidden rounded-2xl border-2 border-ink transition-transform duration-300 hover:-translate-y-1"
                      style={{ background: t.preview }}
                    >
                      <div className="absolute inset-0 flex flex-col justify-between p-4">
                        <span className="text-xs font-black uppercase tracking-tight text-ink/50">
                          {t.vibe}
                        </span>
                        <span className="text-lg font-black leading-tight text-ink">
                          {t.name}
                        </span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-ink/80 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <span className="inline-flex items-center gap-1.5 text-sm font-black uppercase tracking-tight text-white">
                          use this design
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
