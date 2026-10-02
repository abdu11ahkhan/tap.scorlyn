import { createClient } from "@/lib/supabase/server";
import { CARD_TEMPLATES } from "@/lib/card";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type InventoryCard = {
  id: string;
  serial: number;
  card_url: string;
  status: string;
  claimable: boolean;
  activation_code: string;
  nickname: string | null;
  location: string | null;
  batch: string | null;
  batch_id: string | null;
  created_at: string;
  assigned_at: string | null;
  card_profile_id: string | null;
  card_profiles: {
    username: string;
    full_name: string;
    template: string;
    is_single_purpose: boolean | null;
    buttons: { kind?: string; label?: string }[] | null;
  } | null;
  taps: number;
  first_tap: string | null;
  last_tap: string | null;
};

export const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "in_stock", label: "In stock" },
  { id: "for_sale", label: "Ready to sell" },
  { id: "claimed", label: "Claimed" },
  { id: "assigned", label: "Assigned" },
  { id: "active", label: "Active" },
  { id: "suspended", label: "Suspended" },
  { id: "retired", label: "Retired" },
] as const;

export const SORTS = [
  { id: "created", label: "Newest" },
  { id: "serial", label: "Card ID" },
  { id: "last_tap", label: "Last tap" },
  { id: "status", label: "Status" },
  { id: "business", label: "Business" },
] as const;

export type CardFilters = { status?: string; q?: string; batch?: string; sort?: string; ids?: string[] };

const SELECT =
  "id, serial, card_url, status, claimable, activation_code, nickname, location, batch, batch_id, created_at, assigned_at, card_profile_id, card_profiles(username, full_name, template, is_single_purpose, buttons)";

const STATUS_ORDER: Record<string, number> = { active: 0, claimed: 1, suspended: 2, in_stock: 3, retired: 4 };

/** What the card opens, in words: the template name, or the one link a direct card jumps to. */
export function experienceOf(card: Pick<InventoryCard, "card_profiles">): string | null {
  const p = card.card_profiles;
  if (!p) return null;
  if (p.is_single_purpose) {
    const first = p.buttons?.[0];
    return `Direct link${first?.label ? ` · ${first.label}` : first?.kind ? ` · ${first.kind}` : ""}`;
  }
  return CARD_TEMPLATES.find((t) => t.id === p.template)?.name ?? p.template;
}

/** Search text is spliced into a PostgREST `or=` filter, so its syntax characters are stripped first. */
function cleanQuery(q: string) {
  return q.replace(/[,()*%\\:"'.]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

/**
 * Every card matching the filters, with its tap totals. Loads the whole
 * filtered set (paged past PostgREST's 1,000-row cap) so that sorting by last
 * tap or business is correct across the inventory, not just within one page.
 */
export async function loadCards(supabase: Supabase, filters: CardFilters): Promise<InventoryCard[]> {
  const q = cleanQuery(filters.q ?? "");

  let profileIds: string[] = [];
  if (q) {
    const { data } = await supabase
      .from("card_profiles")
      .select("id")
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(300);
    profileIds = (data ?? []).map((p) => p.id);
  }

  const rows: InventoryCard[] = [];
  const PAGE = 1000;
  for (let from = 0; from < 10000; from += PAGE) {
    let query = supabase.from("nfc_cards").select(SELECT).order("serial", { ascending: false }).range(from, from + PAGE - 1);

    const status = filters.status ?? "all";
    if (status === "assigned") query = query.not("card_profile_id", "is", null);
    else if (status === "for_sale") query = query.eq("status", "in_stock").eq("claimable", true);
    else if (status !== "all") query = query.eq("status", status);
    if (filters.batch) query = query.eq("batch_id", filters.batch);
    if (filters.ids?.length) query = query.in("id", filters.ids);

    if (q) {
      const parts = [
        `nickname.ilike.%${q}%`,
        `location.ilike.%${q}%`,
        `batch.ilike.%${q}%`,
        `card_url.ilike.%${q}%`,
      ];
      const serial = q.match(/^(?:sc-?\s?)?0*(\d{1,12})$/i);
      if (serial) parts.push(`serial.eq.${serial[1]}`);
      if (profileIds.length) parts.push(`card_profile_id.in.(${profileIds.join(",")})`);
      query = query.or(parts.join(","));
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const page = (data ?? []) as unknown as Omit<InventoryCard, "taps" | "first_tap" | "last_tap">[];
    rows.push(...page.map((r) => ({ ...r, taps: 0, first_tap: null, last_tap: null })));
    if (page.length < PAGE) break;
  }

  if (rows.length) {
    const { data: stats } = await supabase.rpc("nfc_card_tap_stats", { card_ids: rows.map((r) => r.id) });
    const byId = new Map(
      ((stats ?? []) as { nfc_card_id: string; taps: number; first_tap: string; last_tap: string }[]).map((s) => [
        s.nfc_card_id,
        s,
      ])
    );
    for (const r of rows) {
      const s = byId.get(r.id);
      if (s) {
        r.taps = Number(s.taps);
        r.first_tap = s.first_tap;
        r.last_tap = s.last_tap;
      }
    }
  }

  const sort = filters.sort ?? "created";
  const name = (r: InventoryCard) => r.card_profiles?.full_name?.toLowerCase() ?? "￿";
  rows.sort((a, b) => {
    switch (sort) {
      case "serial":
        return a.serial - b.serial;
      case "last_tap":
        return (b.last_tap ?? "").localeCompare(a.last_tap ?? "") || b.serial - a.serial;
      case "status":
        return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) || b.serial - a.serial;
      case "business":
        return name(a).localeCompare(name(b)) || a.serial - b.serial;
      default:
        return b.created_at.localeCompare(a.created_at) || b.serial - a.serial;
    }
  });

  return rows;
}
