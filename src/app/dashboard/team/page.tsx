import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeamManager, { type EmployeeCard } from "./TeamManager";

export const dynamic = "force-dynamic";

/**
 * Where a corporate account creates and manages its employees' cards.
 *
 * Individual accounts never see this route in the nav (src/app/dashboard/layout.tsx
 * only lists it for account_type === "corporate"), but the link isn't the
 * boundary — this page and every action in ./actions.ts re-check on the
 * server, the same posture the admin console takes with is_admin().
 */
export default async function TeamPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/team");

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type, company_slug, company_name, house_template, house_accent_color")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.account_type !== "corporate" || !profile.company_slug) {
    redirect("/dashboard");
  }

  // The RLS policy added in supabase/migrations/040_corporate_accounts.sql
  // ("Corporate owners can view their employees' cards.") is what makes this
  // resolve to only this company's roster under the owner's own session —
  // no service role needed for a read.
  const { data: employees } = await supabase
    .from("card_profiles")
    .select("id, username, full_name, email, published, owner_suspended, created_at")
    .eq("org_owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <TeamManager
      companySlug={profile.company_slug}
      companyName={profile.company_name ?? ""}
      houseTemplate={profile.house_template}
      houseAccentColor={profile.house_accent_color}
      employees={(employees ?? []) as EmployeeCard[]}
    />
  );
}
