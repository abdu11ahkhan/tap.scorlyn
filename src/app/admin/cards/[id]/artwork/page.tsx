import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ArtworkSheet from "@/app/admin/orders/[id]/artwork/ArtworkSheet";
import FinishPicker from "./FinishPicker";
import { setCardFinish } from "@/app/admin/actions";
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

  // The bucket is private, so a link only exists if we mint one. An hour is
  // long enough to download and send to the printer, short enough that a URL
  // pasted into a chat does not stay live.
  const artworkPath = (card.nfc_artwork_path as string | null) ?? null;
  const { data: signed } = artworkPath
    ? await supabase.storage.from("nfc-artwork").createSignedUrl(artworkPath, 3600)
    : { data: null };

  const artworkPanel = signed?.signedUrl ? (
    <div className="app-panel app-panel-pad flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="min-w-0">
            <p className="text-sm font-black text-sc-text">
              This customer supplied their own artwork
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-sc-text-dim">
              {(card.nfc_artwork_name as string | null) ?? artworkPath}
            </p>
            <p className="mt-1 text-xs font-semibold text-sc-text-dimmer">
              Print this file. The sheet below is only the fallback finish they
              picked, in case there is a problem with it.
            </p>
          </div>
          <a
            href={signed.signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border-2 border-ink bg-acid px-5 text-sm font-black uppercase tracking-tight text-ink"
          >
            Download artwork
          </a>
    </div>
  ) : null;

  const picker = (
    <FinishPicker
      card={card as CardProfile}
      current={finish}
      currentFields={(card.nfc_fields as CardFields | null) ?? null}
      profileUrl={`https://tap.scorlyn.com/u/${card.username}`}
      onSave={async (next: string, nextFields: CardFields) => {
        "use server";
        return setCardFinish(id, next, nextFields as unknown as Record<string, boolean>);
      }}
    />
  );

  // A file with no finish chosen is still printable — the file is the design.
  // Returning early on a missing finish would have hidden it completely.
  if (!finish) {
    return (
      <div className="space-y-5">
        <h1 className="app-h1">Artwork — @{card.username}</h1>
        {artworkPanel}
        {!artworkPanel && (
          <p className="app-sub">
            This customer has not chosen a card design yet. Pick one for them
            below and it saves to their profile.
          </p>
        )}
        {picker}
        <Link href="/admin/cards" className="app-pill inline-flex">
          Back to cards
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {artworkPanel}
      {picker}
      <ArtworkSheet
        card={card as CardProfile}
        finish={finish}
        fields={(card.nfc_fields as CardFields | null) ?? null}
      />
    </div>
  );
}
