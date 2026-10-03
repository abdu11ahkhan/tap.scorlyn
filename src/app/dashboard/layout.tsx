"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Settings,
  LogOut,
  IdCard,
  Package,
  Nfc,
  Users,
  BarChart3,
  MessageSquareText,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import BrandMark from "@/components/layout/BrandMark";
import AreaSwitch from "@/components/layout/AreaSwitch";

type NavItem = {
  name: string;
  /** Label under the icon in the phone tab bar. */
  short: string;
  hint: string;
  href: string;
  icon: typeof LayoutDashboard;
  /** Other routes that belong to this section, so it stays lit on them. */
  also?: string[];
};

/**
 * Four places people actually go, plus "More". The old sidebar listed eleven
 * equal-weight destinations (three of them different ways to get a physical
 * card); every route still exists, it just lives under the section a
 * customer would look for it in.
 */
const HOME: NavItem = { name: "Home", short: "Home", hint: "Is it working, and what's next", href: "/dashboard", icon: LayoutDashboard };
const MY_CARD: NavItem = {
  name: "My card",
  short: "Card",
  hint: "Edit, share, QR and Google Wallet",
  href: "/dashboard/my-card",
  icon: IdCard,
  also: ["/dashboard/card"],
};
const PHYSICAL: NavItem = {
  name: "Physical cards",
  short: "Cards",
  hint: "Your NFC cards, activation, lost cards",
  href: "/dashboard/cards",
  icon: Nfc,
  also: ["/dashboard/nfc", "/dashboard/quick-order"],
};
const STATS: NavItem = { name: "Analytics", short: "Stats", hint: "Visits, taps, scans and clicks", href: "/dashboard/analytics", icon: BarChart3 };
const TEAM: NavItem = { name: "Team", short: "Team", hint: "Your employees' cards", href: "/dashboard/team", icon: Users };
const MORE: NavItem = {
  name: "More",
  short: "More",
  hint: "Orders, billing, account, help",
  href: "/dashboard/more",
  icon: MoreHorizontal,
};

/** Listed under "More" in the desktop sidebar; on phones they sit on the More page. */
const MORE_LINKS: NavItem[] = [
  { name: "My orders", short: "Orders", hint: "Track what you've ordered", href: "/dashboard/orders", icon: Package },
  { name: "Billing", short: "Billing", hint: "Payments and receipts", href: "/dashboard/billing", icon: CreditCard },
  { name: "Review feedback", short: "Feedback", hint: "Messages from review cards", href: "/dashboard/feedback", icon: MessageSquareText },
  { name: "Account settings", short: "Settings", hint: "Profile, password, notifications", href: "/dashboard/settings", icon: Settings },
];

const isIn = (pathname: string, item: NavItem) => {
  if (item.href === "/dashboard") return pathname === "/dashboard";
  return [item.href, ...(item.also ?? [])].some((h) => pathname === h || pathname.startsWith(h + "/"));
};

type Account = { type: "individual" | "corporate"; companyName: string | null };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const supabase = createClient();

  // Fetched here rather than in a separate badge component (contrast
  // AreaSwitch, which is self-contained) because the nav needs the same
  // answer to decide whether "Team" belongs in it at all — one fetch, read
  // twice, rather than two components racing to the same query.
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("account_type, company_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled && data) {
        setAccount({
          type: data.account_type === "corporate" ? "corporate" : "individual",
          companyName: data.company_name,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const corporate = account?.type === "corporate";
  // Company accounts: the team is the product, so it takes My card's slot
  // (their own card still lives under More).
  const main = corporate ? [HOME, PHYSICAL, TEAM, STATS] : [HOME, MY_CARD, PHYSICAL, STATS];
  const moreLinks = corporate ? [{ ...MY_CARD, name: "Company card" }, ...MORE_LINKS] : MORE_LINKS;
  const inMain = main.some((m) => isIn(pathname, m));
  const here = main.find((m) => isIn(pathname, m)) ?? moreLinks.find((l) => isIn(pathname, l)) ?? (isIn(pathname, MORE) ? MORE : null);

  const isEditor = pathname.includes("/editor");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (isEditor) return <>{children}</>;

  const sideLink = (link: NavItem, small = false) => {
    const Icon = link.icon;
    const active = isIn(pathname, link);
    return (
      <Link
        key={link.href + link.name}
        href={link.href}
        prefetch={false}
        title={link.hint}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-start gap-3 rounded-lg px-3 transition-colors",
          small ? "py-2 text-[13.5px] font-medium" : "py-2.5 text-[14.5px] font-semibold",
          active ? "bg-sc-cta/15 text-sc-text" : "text-sc-text-dim hover:bg-sc-surface hover:text-sc-text"
        )}
      >
        <Icon className={cn("mt-0.5 shrink-0", small ? "h-4 w-4" : "h-[18px] w-[18px]")} />
        <span className="min-w-0">
          <span className="block">{link.name}</span>
          {!small && <span className="block text-[11.5px] font-normal leading-snug text-sc-text-dimmer">{link.hint}</span>}
        </span>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-sc-bg font-sans text-sc-text selection:bg-sc-gold selection:text-sc-gold-ink">
      {/* Sidebar — desktop */}
      <aside className="z-20 hidden w-72 flex-col border-r border-sc-border-soft bg-sc-bg md:flex">
        <div className="flex h-24 items-center px-7">
          <Link href="/" className="group flex items-center gap-2.5">
            <BrandMark size={36} className="transition-transform group-hover:rotate-12" />
            <span className="text-xl font-black tracking-tighter text-sc-text">ScorlynTap</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3" aria-label="Dashboard">
          {main.map((l) => sideLink(l))}
          <p className="mb-1 mt-6 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-sc-text-dimmer">More</p>
          {moreLinks.map((l) => sideLink(l, true))}
        </nav>

        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-sc-text-dim transition-colors hover:bg-sc-surface hover:text-sc-text"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="relative flex h-screen flex-1 flex-col overflow-hidden">
        <header className="relative z-10 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-sc-border-soft px-5 pt-[env(safe-area-inset-top)] md:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="shrink-0 md:hidden" aria-label="ScorlynTap home">
              <BrandMark size={28} />
            </Link>
            <h2 className="truncate text-[15px] font-semibold text-sc-text md:text-[13px] md:font-medium md:text-sc-text-dim">
              {here?.name ?? "Dashboard"}
            </h2>
            {/* Blank until the fetch above lands, same instant as everything
                else this page needs a session for. */}
            {account && (
              <span
                className={cn(
                  "hidden shrink-0 items-center rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-tight sm:inline-flex",
                  corporate ? "bg-sc-gold/15 text-sc-gold-text" : "bg-sc-surface-2 text-sc-text-dim"
                )}
              >
                {corporate ? `Company · ${account.companyName ?? "—"}` : "Individual account"}
              </span>
            )}
            {/* Renders nothing unless you're an admin. */}
            <AreaSwitch />
          </div>
        </header>

        {/* Bottom padding on phones keeps the last row clear of the tab bar. */}
        <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-7 md:px-8 md:pb-14">
          {children}
        </div>

        {/* Phone tab bar — five fixed destinations instead of a sideways-
            scrolling strip of eleven. */}
        <nav
          aria-label="Dashboard sections"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-sc-border-soft bg-sc-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        >
          <ul className="grid grid-cols-5">
            {[...main, MORE].map((t) => {
              const Icon = t.icon;
              // "More" stays lit on everything that lives under it.
              const active = t === MORE ? !inMain && here !== null : isIn(pathname, t);
              return (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors",
                      active ? "text-sc-text" : "text-sc-text-dimmer"
                    )}
                  >
                    <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors", active && "bg-sc-cta/20")}>
                      <Icon className="h-[19px] w-[19px]" />
                    </span>
                    {t.short}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </main>
    </div>
  );
}
