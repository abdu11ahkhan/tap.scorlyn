import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Escape for CSV: quote everything, double any inner quotes. */
function cell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * Orders as CSV.
 *
 * Admin-only: RLS would already return nothing for a non-admin, but this
 * checks first so an unauthorised caller gets a 403 rather than an empty
 * spreadsheet that looks like there are no orders.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q");
  const status = searchParams.get("status");
  const plan = searchParams.get("plan");

  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (plan) query = query.eq("plan_id", plan);
  if (q?.trim()) {
    const term = `%${q.trim()}%`;
    query = query.or(
      `reference.ilike.${term},full_name.ilike.${term},phone.ilike.${term},city.ilike.${term}`
    );
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const columns = [
    "reference", "created_at", "status", "plan_id", "quantity", "amount_pkr",
    "full_name", "phone", "address", "city", "flagged", "payment_verified_at",
    "estimated_delivery", "internal_note", "customer_note",
  ] as const;

  const rows = [
    columns.join(","),
    ...(data ?? []).map((o) => columns.map((c) => cell(o[c])).join(",")),
  ];

  // BOM so Excel opens UTF-8 correctly — without it Urdu names and the ₨/–
  // characters arrive mangled.
  const csv = "\uFEFF" + rows.join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ScorlynTap-orders-${stamp}.csv"`,
    },
  });
}
