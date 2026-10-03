import { createClient } from "@/lib/supabase/server";
import SettingsPanels from "./SettingsPanels";
import Link from "next/link";
import { QrCode } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <p className="app-sub">Please log in.</p>;

  const [{ data: profile }, { data: card }, { count: employeeCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("notify_email, notify_whatsapp, whatsapp, account_type, company_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("card_profiles")
      .select("username, username_changed_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    // Only meaningful for a corporate account, but cheap enough to always
    // fetch — an individual account simply has none.
    supabase
      .from("card_profiles")
      .select("id", { count: "exact", head: true })
      .eq("org_owner_id", user.id),
  ]);

  return (
    <div className="max-w-2xl space-y-4 pb-16">
      <header className="mb-6">
        <h1 className="app-h1">Account settings</h1>
        <p className="app-sub mt-1">Your account, username, password and notifications.</p>
      </header>

      {/* Sharing moved to My card — this is just a signpost for anyone who
          remembers it being here. */}
      {card?.username && (
        <Link
          href="/dashboard/my-card"
          className="app-panel app-panel-pad flex items-center gap-3 transition-colors hover:border-sc-gold"
        >
          <QrCode className="h-5 w-5 shrink-0 text-sc-gold-text" />
          <span className="min-w-0 flex-1 text-sm font-semibold">
            Looking for your QR code, card link or Google Wallet? They&apos;re on <b>My card</b>.
          </span>
        </Link>
      )}

      <SettingsPanels
        email={user.email ?? ""}
        notify={{
          email: profile?.notify_email ?? true,
          whatsapp: profile?.notify_whatsapp ?? false,
          number: profile?.whatsapp ?? "",
        }}
        accountType={profile?.account_type === "corporate" ? "corporate" : "individual"}
        companyName={profile?.company_name ?? null}
        employeeCount={employeeCount ?? 0}
      />
    </div>
  );
}
