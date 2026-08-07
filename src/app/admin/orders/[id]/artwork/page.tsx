import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ArtworkSheet from "./ArtworkSheet";
import type { CardProfile } from "@/lib/card";
import type { CardFields } from "@/components/card-design/NfcCardArt";

export const dynamic = "force-dynamic";

/**
 * Print sheet for one order.
 *
 * Deliberately a page rather than an image export: the card art is HTML and
 * CSS, so rasterising it in the browser would bake text into pixels at
 * whatever the screen felt like. Printing this page to PDF keeps the type as
 * vectors, which is what a card printer actually wants, and needs no library.
 */
export default async function OrderArtwork({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, reference, quantity, branding, card_design, card_profile_id, full_name")
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const { data: card } = order.card_profile_id
    ? await supabase.from("card_profiles").select("*").eq("id", order.card_profile_id).maybeSingle()
    : { data: null };

  if (!card) {
    return (
      <div className="space-y-3">
        <h1 className="app-h1">Artwork</h1>
        <p className="app-sub">
          This order has no card attached, so there is nothing to print. Free
          plan orders never have one.
        </p>
      </div>
    );
  }

  const design = (order.card_design ?? {}) as {
    finish?: string;
    fields?: CardFields | null;
    accent?: string | null;
  };

  return (
    <ArtworkSheet
      order={{
        reference: order.reference,
        quantity: order.quantity,
        branding: order.branding,
        fullName: order.full_name,
      }}
      card={card as CardProfile}
      finish={design.finish ?? "minimal"}
      fields={design.fields ?? null}
    />
  );
}
