import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeamManager, { type EmployeeCard } from "./TeamManager";
import { buildPhysicalCardStatus, type NfcAssignment, type PhysicalCardStatus } from "@/lib/nfc-lifecycle";

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

  // Same two paid tiers /dashboard/nfc offers an individual account — reused
  // here rather than inventing a corporate-specific price list.
  const { data: plans } = await supabase
    .from("plans")
    .select("id, price_pkr")
    .in("id", ["printed", "custom"])
    .eq("enabled", true)
    .order("price_pkr", { ascending: true });

  const cardProfileIds = (employees ?? []).map((e) => e.id);
  let physicalByProfile = new Map<string, PhysicalCardStatus>();

  if (cardProfileIds.length > 0) {
    // supabase/migrations/051_corporate_orders_nfc_visibility.sql extends
    // the same org_owner_id pattern to orders and nfc_cards — without it
    // these two reads would silently come back empty under the owner's own
    // session, same as they did before that migration.
    const [{ data: orderRows }, { data: nfcRows }] = await Promise.all([
      supabase
        .from("orders")
        .select("id, reference, status, amount_pkr, card_profile_id, created_at")
        .in("card_profile_id", cardProfileIds)
        .order("created_at", { ascending: false }),
      supabase.from("nfc_cards").select("id, card_profile_id").in("card_profile_id", cardProfileIds),
    ]);

    const nfcIds = (nfcRows ?? []).map((r) => r.id);
    const firstTap = new Map<string, string>();
    if (nfcIds.length > 0) {
      const { data: tapRows } = await supabase
        .from("card_taps")
        .select("nfc_card_id, created_at")
        .in("nfc_card_id", nfcIds)
        .order("created_at", { ascending: true });
      for (const t of tapRows ?? []) {
        if (t.nfc_card_id && !firstTap.has(t.nfc_card_id)) firstTap.set(t.nfc_card_id, t.created_at);
      }
    }

    // One order per employee — the most recent physical order for their
    // card_profile_id, same "latest order" convention the individual
    // dashboard widget already uses.
    type OrderRow = {
      id: string;
      reference: string;
      status: string;
      amount_pkr: number;
      card_profile_id: string | null;
      created_at: string;
    };
    const latestOrderByProfile = new Map<string, OrderRow>();
    for (const o of orderRows ?? []) {
      if (o.amount_pkr > 0 && o.card_profile_id && !latestOrderByProfile.has(o.card_profile_id)) {
        latestOrderByProfile.set(o.card_profile_id, o);
      }
    }

    const assignmentsByProfile = new Map<string, NfcAssignment[]>();
    for (const n of nfcRows ?? []) {
      if (!n.card_profile_id) continue;
      const list = assignmentsByProfile.get(n.card_profile_id) ?? [];
      list.push({ nfcCardId: n.id, firstTapAt: firstTap.get(n.id) ?? null });
      assignmentsByProfile.set(n.card_profile_id, list);
    }

    physicalByProfile = new Map(
      Array.from(latestOrderByProfile.entries()).map(([profileId, order]) => [
        profileId,
        buildPhysicalCardStatus({
          order: { id: order.id, reference: order.reference, status: order.status },
          assignments: assignmentsByProfile.get(profileId) ?? [],
        }),
      ])
    );
  }

  return (
    <TeamManager
      companySlug={profile.company_slug}
      companyName={profile.company_name ?? ""}
      houseTemplate={profile.house_template}
      houseAccentColor={profile.house_accent_color}
      employees={(employees ?? []) as EmployeeCard[]}
      physicalByProfile={Object.fromEntries(physicalByProfile)}
      plans={plans ?? []}
    />
  );
}
