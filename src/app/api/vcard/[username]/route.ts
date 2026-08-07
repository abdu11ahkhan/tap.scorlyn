import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildVCard, vcardFilename } from "@/lib/vcard";

export const dynamic = "force-dynamic";

/**
 * vCard for a published profile.
 *
 * The buttons themselves build the file client-side (see SaveContact) so they
 * work on previews and unsaved drafts too; this route stays as the no-JS
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

  return new NextResponse(buildVCard(card, origin), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `inline; filename="${vcardFilename(card)}"`,
    },
  });
}
