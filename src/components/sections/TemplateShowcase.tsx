"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { CARD_TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/card";
import PosterTitle from "./PosterTitle";

const CARD_TONES = ["bg-sun", "bg-sea text-white", "bg-white", "bg-sun-soft", "bg-cream"];
const POPULAR = ["glass", "arena", "review", "bold"];

/**
 * Real templates, real names, real accents — CARD_TEMPLATES.preview is the
 * same colour the /templates gallery demos each one with. Categories come
 * from the product's own TEMPLATE_CATEGORIES, shown as a numbered carousel;
 * a few popular designs follow as product-style cards.
 */
export function TemplateShowcase() {
  const rail = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  const popular = POPULAR.map((id) => CARD_TEMPLATES.find((t) => t.id === id)).filter(Boolean) as (typeof CARD_TEMPLATES)[number][];

  return (
    <section id="designs" className="relative scroll-mt-20 border-b-[3px] border-char bg-cream py-24">
      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <PosterTitle
            lead="Explore"
            accent={`${CARD_TEMPLATES.length} designs`}
            align="center"
            sub="Whatever you lead with — one link, a full profile, a review card — there's a starting point already built."
          />
        </motion.div>

        {/* Category carousel */}
        <div className="relative">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Previous categories"
            className="brut-sm brut-press absolute -left-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-char sm:flex"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div
            ref={rail}
            className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 pt-3 [scrollbar-width:none] sm:mx-8 sm:px-1"
          >
            {TEMPLATE_CATEGORIES.map((cat, i) => {
              const inCat = CARD_TEMPLATES.filter((t) => t.category === cat.id);
              if (!inCat.length) return null;
              return (
                <Link
                  key={cat.id}
                  href="/templates"
                  className={`brut brut-press relative flex h-[250px] w-[200px] shrink-0 snap-start flex-col rounded-[1.6rem] p-4 ${CARD_TONES[i % CARD_TONES.length]}`}
                >
                  <span className="brut-sm absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-black text-char">
                    {i + 1}
                  </span>
                  <div className="flex h-[140px] items-end justify-center gap-1.5 rounded-2xl border-[3px] border-char bg-white/70 p-3">
                    {inCat.slice(0, 3).map((t, k) => (
                      <span
                        key={t.id}
                        className="w-12 rounded-lg border-2 border-char"
                        style={{ background: t.preview, height: `${70 + k * 18}px` }}
                      />
                    ))}
                  </div>
                  <span className="display mt-auto text-center text-[30px]">{cat.name}</span>
                  <span className="text-center text-[11px] font-black uppercase tracking-widest opacity-70">
                    {inCat.length} design{inCat.length === 1 ? "" : "s"}
                  </span>
                </Link>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Next categories"
            className="brut-sm brut-press absolute -right-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-char sm:flex"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Popular designs */}
        <div className="mt-20 flex flex-wrap items-end justify-between gap-5">
          <PosterTitle lead="Popular" accent="designs" variant="outline" />
          <Link
            href="/templates"
            className="brut-sm brut-press inline-flex h-12 items-center gap-2 rounded-full bg-sun px-6 text-sm font-black uppercase tracking-tight text-char"
          >
            view all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="brut flex flex-col overflow-hidden rounded-[1.6rem] bg-white"
            >
              <div className="relative h-40 border-b-[3px] border-char" style={{ background: t.preview }}>
                <span className="absolute left-3 top-3 rounded-full border-2 border-char bg-hotpink px-2.5 py-0.5 text-[11px] font-black uppercase text-white">
                  popular
                </span>
                <span className="display absolute bottom-3 left-4 text-[22px] text-char/70">{t.vibe}</span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="display text-[30px] text-char">{t.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-char/70">{t.blurb}</p>
                <Link
                  href={`/templates/${t.id}/edit`}
                  className="brut-sm brut-press mt-auto inline-flex h-11 w-full items-center justify-center rounded-full bg-sun text-sm font-black uppercase tracking-tight text-char [margin-top:1rem]"
                >
                  use this design
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
