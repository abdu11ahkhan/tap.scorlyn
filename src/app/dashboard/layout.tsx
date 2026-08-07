"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Settings,
  LogOut,
  IdCard,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import BrandMark from "@/components/layout/BrandMark";
import AreaSwitch from "@/components/layout/AreaSwitch";

const sidebarLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My card", href: "/dashboard/card", icon: IdCard },
  { name: "Orders", href: "/dashboard/orders", icon: Package },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const isEditor = pathname?.includes("/editor");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (isEditor) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-ink font-sans text-white selection:bg-acid selection:text-ink">
      {/* Sidebar */}
      <aside className="z-20 hidden w-72 flex-col border-r border-white/8 bg-ink md:flex">
        <div className="flex h-24 items-center px-7">
          <Link href="/" className="group flex items-center gap-2.5">
            <BrandMark size={36} className="transition-transform group-hover:rotate-12" />
            <span className="text-xl font-black tracking-tighter text-white">ScorlynTap</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/25">
            Menu
          </p>
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");

            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors",
                  isActive
                    ? "bg-white/[0.07] text-white"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/90"
                )}
              >
                <Icon className={cn("h-[17px] w-[17px]", isActive ? "text-acid" : "")} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-white/45 transition-colors hover:bg-white/[0.04] hover:text-white/90"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="grain relative flex h-screen flex-1 flex-col overflow-hidden">
        <div className="float-orb pointer-events-none absolute -left-32 top-0 h-[520px] w-[520px] rounded-full bg-acid/[0.06] blur-[150px]" />
        <div
          className="float-orb pointer-events-none absolute -right-32 bottom-0 h-[460px] w-[460px] rounded-full bg-hotpink/[0.05] blur-[150px]"
          style={{ ["--d" as string]: "4s" }}
        />

        <header className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-white/8 px-6 md:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <h2 className="truncate text-[13px] font-medium text-white/45">
              {sidebarLinks.find((l) => l.href === pathname)?.name ?? "dashboard"}
            </h2>
            {/* Renders nothing unless you're an admin. */}
            <AreaSwitch />
          </div>

          {/* Sidebar is hidden on mobile — keep a way out. */}
          <button
            onClick={handleLogout}
            className="rounded-full border-2 border-white/20 px-4 py-2 text-xs font-black lowercase text-white/60 md:hidden"
          >
            Log out
          </button>
        </header>

        {/* The sidebar is desktop-only, so mobile gets a scrollable strip
            instead of no navigation at all. */}
        <nav className="relative z-10 flex shrink-0 gap-2 overflow-x-auto border-b border-white/8 px-6 py-3 md:hidden">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-full border-2 px-4 py-2 text-xs font-black lowercase transition-colors",
                  isActive
                    ? "border-ink bg-acid text-ink"
                    : "border-white/15 text-white/60"
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
