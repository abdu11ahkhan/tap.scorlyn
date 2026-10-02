import Link from "next/link";
import BrandMark from "@/components/layout/BrandMark";
import { normalizeWhatsapp } from "@/lib/referral";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Templates", href: "/templates" },
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Sign up", href: "/signup" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Order a card", href: "/dashboard/quick-order" },
    ],
  },
];

/** Charcoal poster footer: brand, two link columns, and how to reach a human. */
export default function SiteFooter({ whatsapp, email }: { whatsapp?: string | null; email?: string | null }) {
  const wa = normalizeWhatsapp(whatsapp ?? "");
  const mail = email?.trim() || null;
  const link = "inline-flex min-h-10 items-center text-[15px] font-bold text-white/85 transition-colors hover:text-sun";

  return (
    <footer className="bg-char text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-white bg-sun">
              <BrandMark size={30} />
            </span>
            <span className="leading-none">
              <span className="display block text-[30px] text-white">ScorlynTap</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sun">NFC cards · Pakistan</span>
            </span>
          </Link>
          <p className="mt-5 max-w-xs text-[15px] font-bold leading-snug text-white/80">
            One tap opens your page on any phone. Built in two minutes, changed whenever you like.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="display mb-3 text-[24px] text-sun">{col.title}</p>
            <ul>
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={link}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <p className="display mb-3 text-[24px] text-sun">Contact</p>
          <ul>
            {wa && (
              <li>
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className={link}>
                  WhatsApp: +{wa}
                </a>
              </li>
            )}
            {mail && (
              <li>
                <a href={`mailto:${mail}`} className={`${link} break-all`}>
                  {mail}
                </a>
              </li>
            )}
            <li>
              <Link href="/#contact" className={link}>
                Bulk orders
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-6xl border-t border-white/15 px-5 py-6 sm:px-6">
        <p className="text-xs font-black uppercase tracking-widest text-white/60">
          © {new Date().getFullYear()} ScorlynTap. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
