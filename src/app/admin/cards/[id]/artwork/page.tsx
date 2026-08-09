import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ArtworkSheet from "@/app/admin/orders/[id]/artwork/ArtworkSheet";
import type { CardProfile } from "@/lib/card";
import type { CardFields } from "@/components/card-design/NfcCardArt";

export const dynamic = "force-dynamic";

/**
 * Print sheet for a customer's chosen card, with no order involved.
 *
 * The order sheet could only be reached once someone had paid, so a design
 * chosen at publish had nowhere to be seen. Same sheet, same 300dpi output —
 * it just hangs off the profile instead.
 */
export default async function CardArtwork({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: card } = await supabase
    .from("card_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!card) notFound();

  const finish = (card.nfc_finish as string | null) ?? null;

  if (!finish) {
    return (
      <div className="space-y-3">
        <h1 className="app-h1">Artwork — @{card.username}</h1>
        <p className="app-sub">
          This customer has not chosen a card design yet. They are asked when
          they publish; until they answer there is nothing to print.
        </p>
        <Link href="/admin/cards" className="app-pill inline-flex">
          Back to cards
        </Link>
      </div>
    );
  }

  return (
    <ArtworkSheet
      card={card as CardProfile}
      finish={finish}
      fields={(card.nfc_fields as CardFields | null) ?? null}
    />
  );
}
