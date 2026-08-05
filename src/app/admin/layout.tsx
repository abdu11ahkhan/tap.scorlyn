import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
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
          This area is for Tapzar staff. If you think that&apos;s wrong, ask an
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

  return (
    <div className="grain min-h-screen bg-ink text-white">
      <header className="border-b border-white/8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-acid">
              <ShieldCheck className="h-4 w-4 text-ink" />
            </span>
            <div>
              <p className="text-[15px] font-semibold leading-none">admin</p>
              <p className="text-[12px] text-white/40">
                {profile.full_name || user.email}
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-1.5">
            {[
              { href: "/admin", label: "overview" },
              { href: "/admin/orders", label: "orders" },
              { href: "/admin/cards", label: "cards" },
              { href: "/admin/users", label: "people" },
              { href: "/admin/nfc", label: "nfc stock" },
              { href: "/admin/templates", label: "templates" },
              { href: "/admin/faq", label: "faq" },
              { href: "/admin/settings", label: "site" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-[13px] font-medium text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              className="app-btn app-btn-ghost"
            >
              exit
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
