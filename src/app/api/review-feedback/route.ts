import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { clientIp, visitorHash } from "@/lib/referral";
import { mailerConfigured, sendFeedbackAlert } from "@/lib/email";
import { formatSerial } from "@/lib/card-codes";

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

    // After the save, and swallowed on failure: a mail problem must never
    // make the customer think their feedback didn't go through.
    await notifyBusiness({
      username,
      nfcCode: text(body?.nfcCode, 32),
      rating,
      category,
      message,
      name: text(body?.name, 100),
      phone: text(body?.phone, 40),
      email,
      origin: request.nextUrl.origin,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "could not save" }, { status: 500 });
  }
}

async function notifyBusiness(f: {
  username: string;
  nfcCode: string;
  rating: number;
  category: string;
  message: string;
  name: string;
  phone: string;
  email: string;
  origin: string;
}) {
  try {
    if (!mailerConfigured()) return;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return;

    // Service role: an anonymous visitor can't (and mustn't) read where a
    // business wants its alerts sent.
    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: profile } = await admin
      .from("card_profiles")
      .select("id, full_name")
      .eq("username", f.username)
      .maybeSingle();
    if (!profile) return;

    const { data: settings } = await admin
      .from("review_settings")
      .select("notify_email, share_token")
      .eq("card_profile_id", profile.id)
      .maybeSingle();
    if (!settings?.notify_email) return;

    let where = "";
    if (f.nfcCode) {
      const { data: card } = await admin
        .from("nfc_cards")
        .select("serial, nickname, location, card_profile_id")
        .eq("card_url", f.nfcCode)
        .maybeSingle();
      if (card && card.card_profile_id === profile.id) {
        where = [formatSerial(card.serial), card.nickname, card.location].filter(Boolean).join(" · ");
      }
    }

    const stars = "★".repeat(f.rating) + "☆".repeat(5 - f.rating);
    const lines = [
      `${stars}  (${f.rating} of 5)`,
      f.category ? `Topic: ${f.category}` : "",
      f.message ? `“${f.message}”` : "",
      where ? `Card: ${where}` : "",
      f.name || f.phone || f.email
        ? `Customer: ${[f.name, f.phone, f.email].filter(Boolean).join(" · ")}`
        : "They didn't leave contact details.",
    ].filter(Boolean);

    await sendFeedbackAlert(
      settings.notify_email,
      `New ${f.rating}-star feedback — ${profile.full_name}`,
      `New feedback for ${profile.full_name} from your review card.\n\n${lines.join("\n\n")}`,
      `${f.origin}/feedback/${settings.share_token}`
    );
  } catch {
    // The feedback itself is already saved.
  }
}
