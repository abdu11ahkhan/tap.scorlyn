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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import BrandMark from "@/components/layout/BrandMark";
import AreaSwitch from "@/components/layout/AreaSwitch";

const sidebarLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "My portfolio", href: "/dashboard/card", icon: IdCard },
  { name: "Get a card", href: "/dashboard/nfc", icon: Nfc },
  { name: "Orders", href: "/dashboard/orders", icon: Package },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const teamLink = { name: "Team", href: "/dashboard/team", icon: Users };

type Account = { type: "individual" | "corporate"; companyName: string | null };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Fetched here rather than in a separate badge component (contrast
  // AreaSwitch, which is self-contained) because the sidebar needs the same
  // answer to decide whether "Team" belongs in the nav at all — one fetch,
  // read twice, rather than two components racing to the same query.
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

  const links = account?.type === "corporate" ? [...sidebarLinks, teamLink] : sidebarLinks;

  const isEditor = pathname?.includes("/editor");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (isEditor) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-sc-bg font-sans text-sc-text selection:bg-sc-gold selection:text-sc-gold-ink">
      {/* Sidebar */}
      <aside className="z-20 hidden w-72 flex-col border-r border-sc-border-soft bg-sc-bg md:flex">
        <div className="flex h-24 items-center px-7">
          <Link href="/" className="group flex items-center gap-2.5">
            <BrandMark size={36} className="transition-transform group-hover:rotate-12" />
            <span className="text-xl font-black tracking-tighter text-sc-text">ScorlynTap</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-sc-text-dimmer">
            Menu
          </p>
          {links.map((link) => {
            const Icon = link.icon;
            // "/dashboard" is the index, not a parent: matching it by prefix
            // left it lit on every child page, so the highlight never told you
            // where you actually were.
            const isActive =
              link.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === link.href || pathname.startsWith(link.href + "/");

            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors",
                  isActive
                    ? "bg-sc-surface-2 text-sc-text"
                    : "text-sc-text-dim hover:bg-sc-surface hover:text-sc-text"
                )}
              >
                <Icon className={cn("h-[17px] w-[17px]", isActive ? "text-sc-gold" : "")} />
                {link.name}
              </Link>
            );
          })}
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

        <header className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-sc-border-soft px-6 pt-[env(safe-area-inset-top)] md:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <h2 className="truncate text-[13px] font-medium text-sc-text-dim">
              {links.find((l) => l.href === pathname)?.name ?? "dashboard"}
            </h2>
            {/* Blank until the fetch above lands, same instant as everything
                else this page needs a session for. */}
            {account && (
              <span
                className={cn(
                  "hidden shrink-0 items-center rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-tight sm:inline-flex",
                  account.type === "corporate"
                    ? "bg-sc-gold/15 text-sc-gold"
                    : "bg-sc-surface-2 text-sc-text-dim"
                )}
              >
                {account.type === "corporate"
                  ? `Corporate account · ${account.companyName ?? "—"}`
                  : "Individual account"}
              </span>
            )}
            {/* Renders nothing unless you're an admin. */}
            <AreaSwitch />
          </div>

          {/* Sidebar is hidden on mobile — keep a way out. */}
          <button
            onClick={handleLogout}
            className="rounded-full border-2 border-sc-border px-4 py-2 text-xs font-black lowercase text-sc-text-dim md:hidden"
          >
            Log out
          </button>
        </header>

        {/* The sidebar is desktop-only, so mobile gets a scrollable strip
            instead of no navigation at all. */}
        <nav className="relative z-10 flex shrink-0 gap-2 overflow-x-auto border-b border-sc-border-soft px-6 py-3 md:hidden">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-full border-2 px-4 py-2 text-xs font-black lowercase transition-colors",
                  isActive
                    ? "border-sc-gold bg-sc-gold text-sc-gold-ink"
                    : "border-sc-border text-sc-text-dim"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-14 pt-7 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
