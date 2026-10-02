"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, User, Building2, Check } from "lucide-react";
import PosterTitle from "./PosterTitle";

/**
 * Both lists are real, shipped features — nothing here is aspirational.
 * Corporate has no finalised public pricing, so its CTA goes to the
 * existing bulk-order enquiry in Contact.
 */
const INDIVIDUAL = [
  "Your own page, live in minutes",
  "44 templates to start from",
  "Every link in one tap — phone, email, WhatsApp, socials",
  "A physical NFC card, whenever you're ready",
  "Real analytics on who's opening it",
];

const CORPORATE = [
  "A card for every employee, from one dashboard",
  "Your company's look applied to new cards automatically",
  "Add, suspend, or remove employee cards centrally",
  "Order and track NFC cards for the whole team",
  "Team-wide analytics, not just one card's",
];

export function AudienceSplit() {
  return (
    <section className="dot-grid-light relative border-b-[3px] border-char bg-sea py-24">
      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <PosterTitle lead="Built for one," accent="or a team" light />
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="brut rounded-[1.75rem] bg-sun p-8 text-char"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-char bg-white">
              <User className="h-6 w-6" />
            </div>
            <h3 className="display mt-5 text-[44px]">for you</h3>
            <p className="text-sm font-black uppercase tracking-wide text-char/60">professionals, freelancers, creators</p>
            <ul className="mt-6 space-y-3">
              {INDIVIDUAL.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[15px] font-bold leading-snug">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={3.5} />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/templates"
              className="brut-sm brut-press mt-8 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-base font-black uppercase tracking-tight text-char"
            >
              create your card
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="brut rounded-[1.75rem] bg-char p-8 text-white"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-white/80 bg-sea">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="display mt-5 text-[44px] text-sun">for your team</h3>
            <p className="text-sm font-black uppercase tracking-wide text-white/60">companies, offices, agencies</p>
            <ul className="mt-6 space-y-3">
              {CORPORATE.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[15px] font-bold leading-snug text-white/90">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-sun" strokeWidth={3.5} />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="#contact"
              className="mt-8 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border-[3px] border-white bg-sun px-6 text-base font-black uppercase tracking-tight text-char shadow-[5px_5px_0_0_#ffffff] transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
            >
              talk to us
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
