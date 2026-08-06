import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  LayoutTemplate,
  Nfc,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Admin gate.
 *
 * The check lives in the layout so every page under /admin inherits it, and it
 * reads `is_admin` from the database rather than trusting anything on the
 * client. RLS is the real backstop — even if this check were bypassed, the
 * admin policies still require is_admin() to return true.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=%2Fadmin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return (
      <div className="grain flex min-h-screen flex-col items-center justify-center gap-5 bg-ink px-6 text-center text-white">
        <h1 className="text-4xl font-black tracking-tighter">not your door.</h1>
        <p className="max-w-sm font-medium text-white/50">
          This area is for ScorlynTap staff. If you think that&apos;s wrong, ask an
          admin to flip <code className="text-acid">is_admin</code> on your account.
        </p>
        <Link
          href="/dashboard"
          className="sticker sticker-press rounded-full border-2 border-ink bg-acid px-7 py-3.5 font-black uppercase tracking-tight text-ink"
        >
          back to dashboard
        </Link>
      </div>
    );
  }

  // Orders nobody has opened yet. This is the entire new-order alert for now:
  // no email provider is configured, so the console has to carry the signal.
  // Read after the admin gate — under RLS a customer would otherwise be
  // counting their own rows.
  const { count: unseenOrders } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .is("admin_seen_at", null);

  const nav = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: unseenOrders ?? 0 },
    { href: "/admin/cards", label: "Cards", icon: CreditCard },
    { href: "/admin/users", label: "Customers", icon: Users },
    { href: "/admin/nfc", label: "NFC stock", icon: Nfc },
    { href: "/admin/templates", label: "Templates", icon: LayoutTemplate },
    { href: "/admin/faq", label: "FAQ", icon: HelpCircle },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="admin-shell min-h-screen">
      {/* Top bar: thin, dark, always there — the way a console anchors itself. */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-[#1a1a1a] px-4 text-white">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <p className="text-[14px] font-semibold">ScorlynTap admin</p>

        <div className="ml-auto flex items-center gap-3">
          <p className="hidden text-[13px] text-white/50 sm:block">
            {profile.full_name || user.email}
          </p>
          <Link
            href="/dashboard"
            className="rounded-md border border-white/20 px-3 py-1.5 text-[13px] font-medium text-white/80 transition-colors hover:bg-white/10"
          >
            Exit
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px]">
        {/* Sidebar. Hidden on small screens, where it becomes a scrolling
            strip under the header instead — a 200px rail on a phone leaves
            nothing for the tables it exists to navigate. */}
        <aside className="hidden w-[220px] shrink-0 border-r border-[var(--a-border)] bg-[#fbfbfb] px-3 py-4 lg:block">
          <nav className="space-y-0.5">
            {nav.map(({ href, label, icon: Icon, badge }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[#4a4a4a] transition-colors hover:bg-[#efefef]"
              >
                <Icon className="h-4 w-4 shrink-0 text-[#8a8a8a]" />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {Boolean(badge) && (
                  <span
                    className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#d72c0d] px-1 text-[11px] font-bold text-white"
                    title={`${badge} order${badge === 1 ? "" : "s"} you haven't opened`}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="min-w-0 flex-1">
          <div className="flex gap-1 overflow-x-auto border-b border-[var(--a-border)] bg-[#fbfbfb] px-3 py-2 lg:hidden">
            {nav.map(({ href, label, badge }) => (
              <Link
                key={href}
                href={href}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[#4a4a4a]"
              >
                {label}
                {Boolean(badge) && (
                  <span className="flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#d72c0d] px-1 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
