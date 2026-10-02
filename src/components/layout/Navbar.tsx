"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import BrandMark from "@/components/layout/BrandMark";
import AccountMenu, { MobileAccountLinks } from "@/components/layout/AccountMenu";
import StartChooserModal from "@/components/nfc/StartChooserModal";

const LINKS = [
  { label: "templates", href: "/templates" },
  { label: "features", href: "/#features" },
  { label: "pricing", href: "/#pricing" },
  { label: "contact", href: "/#contact" },
];

/**
 * Poster-style top bar: full-width sea teal with a thick charcoal rule under
 * it, headline-font links, and a sun-orange call to action with a hard
 * shadow. Fixed, so every marketing page reserves its 72px at the top.
 */
export function Navbar() {
  const [open, setOpen] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 border-b-[3px] border-char bg-sea pt-[env(safe-area-inset-top)]"
    >
      <nav className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="group flex min-h-[44px] min-w-0 items-center gap-2.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-char bg-sun">
            <BrandMark size={28} className="transition-transform group-hover:rotate-12" />
          </span>
          <span className="min-w-0 leading-none">
            <span className="display block truncate text-[26px] text-white">ScorlynTap</span>
            <span className="mt-0.5 hidden text-[9px] font-black uppercase tracking-[0.2em] text-sun sm:block">
              NFC cards · Pakistan
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="display text-[22px] text-white transition-colors hover:text-sun"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <AccountMenu />
          {/* Hidden on the smallest screens: at 360px it wrapped and crowded
              the wordmark. The menu button carries it there. */}
          <button
            type="button"
            onClick={() => setChooserOpen(true)}
            className="brut-sm brut-press hidden h-11 items-center justify-center whitespace-nowrap rounded-full bg-sun px-5 text-[15px] font-black uppercase tracking-tight text-char sm:inline-flex"
          >
            get started
          </button>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="brut-sm ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-char md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="px-4 pb-4 md:hidden">
          <div className="brut rounded-3xl bg-cream p-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setChooserOpen(true);
              }}
              className="brut-sm brut-press block w-full rounded-2xl bg-sun px-4 py-3 text-left text-lg font-black uppercase tracking-tight text-char"
            >
              get started
            </button>
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="display block rounded-xl px-4 py-3 text-[26px] text-char hover:bg-sun/30"
              >
                {link.label}
              </Link>
            ))}
            <MobileAccountLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <StartChooserModal open={chooserOpen} onClose={() => setChooserOpen(false)} />
    </motion.header>
  );
}
