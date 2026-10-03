import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, CreditCard, HelpCircle, IdCard, MessageCircle, MessageSquareText, Package, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { normalizeWhatsapp } from "@/lib/referral";
import LogoutButton from "./LogoutButton";

export const dynamic = "force-dynamic";

type Row = { href: string; icon: typeof Package; title: string; hint: string; external?: boolean };

/**
 * Everything that isn't one of the four main tabs, grouped by what it's
 * about rather than listed flat. On desktop the sidebar shows the same
 * links; this page is what the phone tab bar's "More" opens.
 */
export default async function MorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/more");

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("account_type").eq("id", user.id).maybeSingle(),
    supabase.from("app_settings").select("support_whatsapp, support_email").maybeSingle(),
  ]);
  const corporate = profile?.account_type === "corporate";
  const wa = normalizeWhatsapp(settings?.support_whatsapp ?? "");

  const groups: { title: string; rows: Row[] }[] = [
    {
      title: "Orders & billing",
      rows: [
        { href: "/dashboard/orders", icon: Package, title: "My orders", hint: "Track printed cards you've ordered" },
        { href: "/dashboard/billing", icon: CreditCard, title: "Billing", hint: "Payments, receipts and invoices" },
      ],
    },
    {
      title: "Cards",
      rows: [
        ...(corporate
          ? [{ href: "/dashboard/my-card", icon: IdCard, title: "Company card", hint: "Your company's own digital card" }]
          : []),
        { href: "/dashboard/feedback", icon: MessageSquareText, title: "Review feedback", hint: "Ratings and messages from review cards" },
      ],
    },
    {
      title: "Account",
      rows: [
        { href: "/dashboard/settings", icon: Settings, title: "Account settings", hint: "Username, password, email and notifications" },
      ],
    },
    {
      title: "Help",
      rows: [
        { href: "/faq", icon: HelpCircle, title: "Questions & answers", hint: "How cards, NFC and orders work" },
        ...(wa
          ? [{ href: `https://wa.me/${wa}`, icon: MessageCircle, title: "Chat with us on WhatsApp", hint: `+${wa}`, external: true }]
          : []),
      ],
    },
  ];

  return (
    <div className="max-w-2xl space-y-7 pb-10">
      <header>
        <h1 className="app-h1">More</h1>
        <p className="app-sub mt-1">Orders, billing, your account and help.</p>
      </header>

      {groups.map((g) => (
        <section key={g.title} className="space-y-2">
          <h2 className="px-1 text-[11px] font-black uppercase tracking-[0.14em] text-sc-text-dimmer">{g.title}</h2>
          <ul className="app-panel divide-y divide-sc-border-soft overflow-hidden">
            {g.rows.map((r) => {
              const Icon = r.icon;
              const inner = (
                <>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sc-surface-2 text-sc-gold-text">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-sc-text">{r.title}</span>
                    <span className="block truncate text-[12.5px] text-sc-text-dimmer">{r.hint}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-sc-text-dimmer" />
                </>
              );
              const cls = "flex min-h-16 items-center gap-3 px-4 py-2 transition-colors hover:bg-sc-surface-2";
              return (
                <li key={r.href}>
                  {r.external ? (
                    <a href={r.href} target="_blank" rel="noopener noreferrer" className={cls}>
                      {inner}
                    </a>
                  ) : (
                    <Link href={r.href} prefetch={false} className={cls}>
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <LogoutButton />
    </div>
  );
}
