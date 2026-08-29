import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildVCard, vcardFilename } from "@/lib/vcard";

export const dynamic = "force-dynamic";

/**
 * vCard for a published profile.
 *
 * The card's own save control (see CardQr) builds the file client-side so it
 * works on previews and unsaved drafts too; this route stays as the no-JS
 * fallback and for anything linking straight to the .vcf.
 */
export async function GET(
  request: Request,
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

  const origin = new URL(request.url).origin;
  // Optional, visitor-supplied — a private reminder for whoever is saving
  // this contact ("met at the conference"), never something the card owner
  // set. Capped in buildVCard itself; nothing here needs validating beyond
  // "is it a string" since it only ever becomes free text inside NOTE.
  const note = new URL(request.url).searchParams.get("note");

  return new NextResponse(buildVCard(card, origin, note), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `inline; filename="${vcardFilename(card)}"`,
    },
  });
}
