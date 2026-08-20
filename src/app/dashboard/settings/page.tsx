import { createClient } from "@/lib/supabase/server";
import SettingsPanels from "./SettingsPanels";
import QrPanel from "./QrPanel";

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
        <h1 className="app-h1">Settings</h1>
        <p className="app-sub mt-1">Your account, handle and notifications.</p>
      </header>

      {card?.username && <QrPanel username={card.username} />}

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
