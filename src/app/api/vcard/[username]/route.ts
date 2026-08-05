import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeWhatsapp } from "@/lib/referral";
import { resolveButtons } from "@/lib/card";

export const dynamic = "force-dynamic";

/** vCard escaping: commas, semicolons, backslashes and newlines are special. */
function esc(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const supabase = await createClient();
  const { data: card } = await supabase
    .from("card_profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .eq("published", true)
    .maybeSingle();

  if (!card) {
    return NextResponse.json({ error: "card not found" }, { status: 404 });
  }

  const [firstName, ...rest] = card.full_name.split(" ");
  const lastName = rest.join(" ");
  const whatsapp = normalizeWhatsapp(card.whatsapp);
  const origin = new URL(_request.url).origin;

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(lastName)};${esc(firstName)};;;`,
    `FN:${esc(card.full_name)}`,
  ];

  if (card.company) lines.push(`ORG:${esc(card.company)}`);
  if (card.headline) lines.push(`TITLE:${esc(card.headline)}`);
  if (card.phone) lines.push(`TEL;TYPE=CELL:${esc(card.phone)}`);
  if (whatsapp) lines.push(`TEL;TYPE=WhatsApp:+${whatsapp}`);
  if (card.email) lines.push(`EMAIL;TYPE=INTERNET:${esc(card.email)}`);
  if (card.location) lines.push(`ADR;TYPE=WORK:;;${esc(card.location)};;;;`);
  if (card.bio) lines.push(`NOTE:${esc(card.bio)}`);
  if (card.avatar_url) lines.push(`PHOTO;VALUE=URI:${esc(card.avatar_url)}`);

  lines.push(`URL:${origin}/u/${card.username}`);

  // Only web buttons belong in a vCard URL field — tel:/mailto: kinds are
  // already covered by the TEL/EMAIL properties above.
  for (const button of resolveButtons(card.buttons)) {
    if (button.external && button.href.startsWith("http")) {
      lines.push(`URL:${esc(button.href)}`);
    }
  }

  lines.push("END:VCARD");

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${card.username}.vcf"`,
    },
  });
}
