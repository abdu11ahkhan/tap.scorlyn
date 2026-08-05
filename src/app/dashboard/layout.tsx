"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Settings,
  LogOut,
  IdCard,
  BarChart3,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const sidebarLinks = [
  { name: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "my card", href: "/dashboard/card", icon: IdCard },
  { name: "analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "settings", href: "/dashboard/settings", icon: Settings },
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
      <aside className="z-20 hidden w-72 flex-col border-r-2 border-white/10 bg-ink md:flex">
        <div className="flex h-24 items-center px-7">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-acid transition-transform group-hover:rotate-12">
              <Zap className="h-4 w-4 fill-ink text-ink" />
            </span>
            <span className="text-xl font-black tracking-tighter text-white">tapzar</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
          <p className="mb-3 px-3 text-[11px] font-black uppercase tracking-widest text-white/30">
            menu
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
                  "flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-[15px] font-black lowercase transition-all",
                  isActive
                    ? "border-2 border-ink bg-acid text-ink"
                    : "border-2 border-transparent text-white/55 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl border-2 border-white/15 px-3.5 py-3 text-[15px] font-black lowercase text-white/55 transition-all hover:border-hotpink hover:text-hotpink"
          >
            <LogOut className="h-[18px] w-[18px]" />
            log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="grain relative flex h-screen flex-1 flex-col overflow-hidden">
        <div className="float-orb pointer-events-none absolute -left-32 top-0 h-[520px] w-[520px] rounded-full bg-acid/10 blur-[150px]" />
        <div
          className="float-orb pointer-events-none absolute -right-32 bottom-0 h-[460px] w-[460px] rounded-full bg-hotpink/10 blur-[150px]"
          style={{ ["--d" as string]: "4s" }}
        />

        <header className="relative z-10 flex h-24 shrink-0 items-center justify-between border-b-2 border-white/10 px-6 md:px-10">
          <h2 className="text-xs font-black uppercase tracking-widest text-white/40">
            {sidebarLinks.find((l) => l.href === pathname)?.name ?? "dashboard"}
          </h2>

          {/* Sidebar is hidden on mobile — keep a way out. */}
          <button
            onClick={handleLogout}
            className="rounded-full border-2 border-white/20 px-4 py-2 text-xs font-black lowercase text-white/60 md:hidden"
          >
            log out
          </button>
        </header>

        {/* The sidebar is desktop-only, so mobile gets a scrollable strip
            instead of no navigation at all. */}
        <nav className="relative z-10 flex shrink-0 gap-2 overflow-x-auto border-b-2 border-white/10 px-6 py-3 md:hidden">
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

        <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-12 pt-8 md:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
