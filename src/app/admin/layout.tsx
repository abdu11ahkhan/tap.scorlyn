import { redirect } from "next/navigation";
import Link from "next/link";
import AreaSwitch from "@/components/layout/AreaSwitch";
import {
  Camera,
  CreditCard,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LayoutTemplate,
  Mail,
  Nfc,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  UserX,
  Users,
  Wallet,
  Star,
  BadgeCheck,
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-sc-bg px-6 text-center text-sc-text">
        <h1 className="text-4xl font-black tracking-tighter">not your door.</h1>
        <p className="max-w-sm font-medium text-sc-text-dim">
          This area is for ScorlynTap staff. If you think that&apos;s wrong, ask an
          admin to flip <code className="text-sc-gold-text">is_admin</code> on your account.
        </p>
        <Link
          href="/dashboard"
          className="app-btn app-btn-primary rounded-full px-7"
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

  // Customers waiting for a card to be activated — they can't use it until
  // someone here says yes, so it carries a badge like new orders do.
  const { count: pendingClaims } = await supabase
    .from("card_claims")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  // Grouped by what you came to do, each with one line saying what's inside —
  // the bare labels ("Cards" next to "NFC cards", "Content", "Scan test")
  // didn't tell anyone new which one they wanted.
  const groups: {
    title: string;
    items: { href: string; label: string; hint: string; icon: typeof Star; badge?: number }[];
  }[] = [
    {
      title: "Sales",
      items: [
        { href: "/admin", label: "Overview", hint: "Sales, sign-ups and taps at a glance", icon: LayoutDashboard },
        { href: "/admin/orders", label: "Orders", hint: "Card orders to print, ship and track", icon: ShoppingBag, badge: unseenOrders ?? 0 },
        { href: "/admin/invoices", label: "Invoices", hint: "Create and share invoices", icon: Receipt },
        { href: "/admin/billing", label: "Payments", hint: "Where customers pay you, and what came in", icon: Wallet },
      ],
    },
    {
      title: "Customers & cards",
      items: [
        { href: "/admin/users", label: "Customers", hint: "Accounts · set someone up in person", icon: Users },
        { href: "/admin/cards", label: "Customer pages", hint: "Every digital card customers made — edit any", icon: CreditCard },
        { href: "/admin/nfc", label: "Physical cards", hint: "Make QR/NFC codes in bulk, assign later", icon: Nfc },
        { href: "/admin/requests", label: "Card requests", hint: "Customers asking to activate a card", icon: BadgeCheck, badge: pendingClaims ?? 0 },
        { href: "/admin/reviews", label: "Review cards", hint: "Google reviews, feedback links & alerts", icon: Star },
        { href: "/admin/accounts", label: "Suspended", hint: "Blocked and deleted accounts", icon: UserX },
      ],
    },
    {
      title: "Website",
      items: [
        { href: "/admin/templates", label: "Templates", hint: "Which designs customers can pick", icon: LayoutTemplate },
        { href: "/admin/content", label: "Site text", hint: "Edit words on the public website", icon: FileText },
        { href: "/admin/faq", label: "FAQ", hint: "Questions shown on the FAQ page", icon: HelpCircle },
        { href: "/admin/email", label: "Email customers", hint: "Send an announcement or offer", icon: Mail },
      ],
    },
    {
      title: "Tools",
      items: [
        { href: "/admin/scan-test", label: "Card scanner test", hint: "Photo of a paper card → digital card", icon: Camera },
        { href: "/admin/audit", label: "Activity log", hint: "Every change an admin made", icon: ScrollText },
        { href: "/admin/settings", label: "Settings", hint: "Site-wide switches", icon: Settings },
      ],
    },
  ];
  const nav = groups.flatMap((g) => g.items);

  return (
    <div className="admin-shell min-h-screen">
      {/* Top bar: thin, dark, always there — the way a console anchors itself. */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-sc-border-soft bg-sc-bg/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sc-gold">
          <ShieldCheck className="h-4 w-4 text-sc-gold-ink" />
        </span>
        <p className="text-[14px] font-semibold">ScorlynTap admin</p>

        <div className="ml-auto flex items-center gap-3">
          <p className="hidden text-[13px] text-sc-text-dim sm:block">
            {profile.full_name || user.email}
          </p>
          <AreaSwitch />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px]">
        {/* Sidebar. Hidden on small screens, where it becomes a scrolling
            strip under the header instead — a 200px rail on a phone leaves
            nothing for the tables it exists to navigate. */}
        <aside className="hidden w-[260px] shrink-0 border-r border-sc-border-soft bg-sc-surface px-3 py-4 lg:block">
          <nav className="space-y-4">
            {groups.map((group) => (
              <div key={group.title}>
                <p className="mb-1 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-sc-text-dimmer">
                  {group.title}
                </p>
                <div className="space-y-0.5">
                  {group.items.map(({ href, label, hint, icon: Icon, badge }) => (
                    <Link key={href} href={href} prefetch={false} className="admin-nav-item items-start" title={hint}>
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{label}</span>
                        <span className="block text-[11px] font-normal leading-snug text-sc-text-dimmer">{hint}</span>
                      </span>
                      {Boolean(badge) && (
                        <span
                          className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-sc-error px-1 text-[11px] font-black text-sc-text"
                          title={`${badge} waiting for you`}
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="min-w-0 flex-1">
          <div className="flex gap-1 overflow-x-auto border-b border-sc-border-soft px-3 py-2 lg:hidden">
            {nav.map(({ href, label, hint, badge }) => (
              <Link
                key={href}
                href={href}
                prefetch={false}
                title={hint}
                className="admin-nav-item shrink-0 whitespace-nowrap"
              >
                {label}
                {Boolean(badge) && (
                  <span className="flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-sc-error px-1 text-[10px] font-black text-sc-text">
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
