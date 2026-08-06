"use client";

import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import BrandMark from "@/components/layout/BrandMark";

const LINKS = [
  { label: "templates", href: "/templates" },
  { label: "features", href: "/#features" },
  { label: "pricing", href: "/#pricing" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => setScrolled(latest > 40));

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-4 py-4"
    >
      <nav
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-full border-2 border-ink px-4 py-2.5 transition-all duration-300 sm:px-5 ${
          scrolled ? "sticker bg-white/95 backdrop-blur-xl" : "bg-white"
        }`}
      >
        <Link href="/" className="group flex items-center gap-2.5">
          <BrandMark size={36} className="transition-transform group-hover:rotate-12" />
          <span className="text-xl font-black tracking-tighter text-ink">ScorlynTap</span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[15px] font-bold text-ink/70 transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-[15px] font-bold text-ink/70 transition-colors hover:text-ink sm:block"
          >
            log in
          </Link>
          <Link
            href="/templates"
            className="sticker sticker-press rounded-full border-2 border-ink bg-acid px-5 py-2.5 text-[15px] font-black uppercase tracking-tight text-ink"
          >
            get started
          </Link>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="ml-1 rounded-full border-2 border-ink p-2 text-ink md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="sticker mx-auto mt-3 max-w-6xl rounded-3xl border-2 border-ink bg-white p-4 md:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-lg font-black text-ink hover:bg-acid"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-4 py-3 text-lg font-black text-ink hover:bg-acid"
          >
            log in
          </Link>
        </div>
      )}
    </motion.header>
  );
}
