/**
 * Aggregation over card_taps for the dashboard analytics page.
 *
 * Every function here is pure — takes rows already scoped by the caller's
 * own RLS-backed query, returns numbers. No Supabase client, no auth. Kept
 * separate from the page so the taxonomy (what counts as a "contact
 * action," what a "meaningful action" is for engagement rate) lives in one
 * place with its reasoning, not buried in JSX.
 */

export type EventType =
  | "view"
  | "contact_save"
  | "share"
  | "qr_open"
  | "phone_click"
  | "email_click"
  | "whatsapp_click"
  | "website_click"
  | "social_click"
  | "booking_click";

export type TapRow = {
  event_type: EventType;
  created_at: string;
  card_profile_id: string;
  nfc_card_id: string | null;
  source: string;
};

/**
 * Events where the visitor tried to actually reach the owner, not just
 * browse further. This is the set both "contact actions" and "engagement
 * rate" are built from — deliberately excludes share/qr_open/social_click/
 * website_click, which are exploratory rather than a real attempt to
 * connect.
 */
export const CONTACT_EVENT_TYPES: EventType[] = [
  "phone_click",
  "email_click",
  "whatsapp_click",
  "booking_click",
  "contact_save",
];

export const TIME_RANGES = ["7d", "30d", "90d", "all"] as const;
export type TimeRange = (typeof TIME_RANGES)[number];

export function rangeToSince(range: TimeRange): Date | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

export type AnalyticsSummary = {
  views: number;
  contactActions: number;
  shares: number;
  nfcActivity: number;
  totalInteractions: number;
  /** null when there aren't enough views to make a rate meaningful. */
  engagementRate: number | null;
  eventDistribution: { eventType: EventType; count: number }[];
  dailySeries: { date: string; views: number; interactions: number }[];
};

export function summarize(rows: TapRow[], days: number): AnalyticsSummary {
  const views = rows.filter((r) => r.event_type === "view").length;
  const contactActions = rows.filter((r) => CONTACT_EVENT_TYPES.includes(r.event_type)).length;
  const shares = rows.filter((r) => r.event_type === "share").length;
  const nfcActivity = rows.filter((r) => r.nfc_card_id !== null).length;
  const totalInteractions = rows.filter((r) => r.event_type !== "view").length;

  const counts = new Map<EventType, number>();
  for (const r of rows) counts.set(r.event_type, (counts.get(r.event_type) ?? 0) + 1);
  const eventDistribution = [...counts.entries()]
    .map(([eventType, count]) => ({ eventType, count }))
    .sort((a, b) => b.count - a.count);

  const buckets = new Map<string, { views: number; interactions: number }>();
  const bucketDays = Math.min(days, 90); // the chart itself never shows more than 90 points
  for (let i = bucketDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    buckets.set(d.toISOString().slice(0, 10), { views: 0, interactions: 0 });
  }
  for (const r of rows) {
    const key = r.created_at.slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (r.event_type === "view") bucket.views += 1;
    else bucket.interactions += 1;
  }
  const dailySeries = [...buckets.entries()].map(([date, v]) => ({ date, ...v }));

  return {
    views,
    contactActions,
    shares,
    nfcActivity,
    totalInteractions,
    engagementRate: views > 0 ? contactActions / views : null,
    eventDistribution,
    dailySeries,
  };
}

export type CardBreakdownRow = {
  cardProfileId: string;
  label: string;
  username: string;
  views: number;
  interactions: number;
  nfcActivity: number;
};

export function summarizeByCard(
  rows: TapRow[],
  cards: { id: string; username: string; full_name: string }[]
): CardBreakdownRow[] {
  const byCard = new Map<string, { views: number; interactions: number; nfcActivity: number }>();
  for (const c of cards) byCard.set(c.id, { views: 0, interactions: 0, nfcActivity: 0 });
  for (const r of rows) {
    const bucket = byCard.get(r.card_profile_id);
    if (!bucket) continue;
    if (r.event_type === "view") bucket.views += 1;
    else bucket.interactions += 1;
    if (r.nfc_card_id !== null) bucket.nfcActivity += 1;
  }
  return cards.map((c) => ({
    cardProfileId: c.id,
    label: c.full_name || c.username,
    username: c.username,
    ...(byCard.get(c.id) ?? { views: 0, interactions: 0, nfcActivity: 0 }),
  }));
}

export type NfcBreakdownRow = { nfcCardId: string; label: string; activity: number };

/** Ordinal labels ("Physical card 1", "2", ...) by issuance order — never the raw code or internal id. */
export function summarizeByNfcCard(
  rows: TapRow[],
  nfcCards: { id: string; created_at: string }[]
): NfcBreakdownRow[] {
  const ordered = [...nfcCards].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (!r.nfc_card_id) continue;
    counts.set(r.nfc_card_id, (counts.get(r.nfc_card_id) ?? 0) + 1);
  }
  return ordered.map((nc, i) => ({
    nfcCardId: nc.id,
    label: `Physical card ${i + 1}`,
    activity: counts.get(nc.id) ?? 0,
  }));
}

export const EVENT_LABELS: Record<EventType, string> = {
  view: "Views",
  contact_save: "Saved contact",
  share: "Shared",
  qr_open: "QR opened",
  phone_click: "Phone",
  email_click: "Email",
  whatsapp_click: "WhatsApp",
  website_click: "Website",
  social_click: "Social",
  booking_click: "Booking",
};
