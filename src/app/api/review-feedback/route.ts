import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clientIp, visitorHash } from "@/lib/referral";

export const dynamic = "force-dynamic";

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/**
 * Stores what a customer writes on a Review Card.
 *
 * Nothing from the browser is trusted as an id: the business comes from the
 * public username (published cards only) and the physical card from its
 * public code, both resolved inside submit_review_feedback() — the table has
 * no insert policy at all, so this function is the only way in.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    // Honeypot: a real visitor never sees or fills this field.
    if (text(body?.website, 200)) return NextResponse.json({ ok: true });

    const username = text(body?.username, 40).toLowerCase();
    const rating = Number(body?.rating);
    if (!username || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "invalid feedback" }, { status: 400 });
    }

    const category = text(body?.category, 40);
    const message = text(body?.message, 2000);
    if (!category && !message) {
      return NextResponse.json({ error: "empty feedback" }, { status: 400 });
    }

    const email = text(body?.email, 200);
    const source = ["nfc", "qr", "link"].includes(body?.source) ? body.source : "link";
    const userAgent = request.headers.get("user-agent") ?? "";

    const supabase = await createClient();
    const { error } = await supabase.rpc("submit_review_feedback", {
      p_username: username,
      p_code: text(body?.nfcCode, 32) || null,
      p_rating: rating,
      p_category: category || null,
      p_message: message || null,
      p_name: text(body?.name, 100) || null,
      p_phone: text(body?.phone, 40) || null,
      p_email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null,
      p_source: source,
      p_visitor_hash: visitorHash(clientIp(request.headers), userAgent),
    });

    if (error) {
      const notFound = /card not found/i.test(error.message);
      return NextResponse.json({ error: notFound ? "card not found" : "could not save" }, { status: notFound ? 404 : 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "could not save" }, { status: 500 });
  }
}
