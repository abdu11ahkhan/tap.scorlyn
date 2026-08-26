"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, User, Building2, Check } from "lucide-react";
import { RippleField } from "./RippleField";

/**
 * Both lists are real, shipped features — nothing here is aspirational.
 * Corporate has no finalised public pricing, so its CTA goes to the
 * existing bulk-order enquiry in Contact rather than a route or a number
 * that doesn't exist yet.
 */
const INDIVIDUAL = [
  "Your own page, live in minutes",
  "36 templates to start from",
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
    <section className="relative overflow-hidden bg-paper py-28">
      <RippleField />
      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-14 max-w-2xl"
        >
          <h2 className="text-[clamp(2.6rem,7vw,5rem)] font-black leading-[0.9] tracking-[-0.05em] text-ink">
            built for <span className="text-teal">one</span>,
            <br />
            or a whole <span className="text-acid">team.</span>
          </h2>
        </motion.div>

        {/* "For your team" stays on the dark ink surface deliberately — a
            corporate/enterprise tier reading as the premium, "serious"
            option is a common and effective light-SaaS pattern, not
            leftover dark theme (same reasoning as keeping the footer dark). */}
        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="sticker-lg rounded-[1.75rem] bg-mist p-8 text-ink"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-acid">
              <User className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-2xl font-black tracking-tight">for you</h3>
            <p className="mt-1 text-sm font-bold uppercase tracking-wide text-ink/40">
              professionals, freelancers, creators
            </p>
            <ul className="mt-6 space-y-3">
              {INDIVIDUAL.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[15px] font-medium leading-snug">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" strokeWidth={3} />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/templates"
              className="sticker sticker-press mt-8 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-acid px-6 text-base font-black uppercase tracking-tight text-ink"
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
            className="sticker-lg rounded-[1.75rem] bg-ink p-8 text-white"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-2xl font-black tracking-tight">for your team</h3>
            <p className="mt-1 text-sm font-bold uppercase tracking-wide text-white/40">
              companies, offices, agencies
            </p>
            <ul className="mt-6 space-y-3">
              {CORPORATE.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[15px] font-medium leading-snug text-white/85">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-acid" strokeWidth={3} />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="#contact"
              className="sticker sticker-press mt-8 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-base font-black uppercase tracking-tight text-ink"
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
