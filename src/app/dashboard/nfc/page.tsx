import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NfcChooser from "./NfcChooser";
import { cardLinkUrl, type CardProfile } from "@/lib/card";

export const dynamic = "force-dynamic";

/**
 * The step between having a free page and owning a card.
 *
 * Nothing previously showed a customer what the physical product looks like,
 * so the paid plans were two lines of text beside something they already had
 * for nothing. This draws both options with their own card and their own link.
 */
export default async function GetNfcCard({
  searchParams,
}: {
  searchParams: Promise<{ card?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Which of the account's (possibly several) cards this is for. Absent
  // means "their first" — the original, single-card-per-account default.
  const { card: requestedCardId } = await searchParams;

  const [{ data: card }, { data: plans }] = await Promise.all([
    user
      ? requestedCardId
        ? supabase
            .from("card_profiles")
            .select("*")
            .eq("id", requestedCardId)
            .eq("user_id", user.id)
            .maybeSingle()
        : supabase
            .from("card_profiles")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("plans").select("id, name, price_pkr, blurb").eq("enabled", true),
  ]);

  // A printed card is a chip pointing at a page. Without the page there is
  // nothing to program, so this asks for that first rather than selling into
  // a dead link.
  if (!card?.username) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="app-h1">make your card first</h1>
        <p className="app-sub mx-auto mt-3 max-w-sm">
          A printed card is a chip that opens your page. Build the page and
          this is the next step.
        </p>
        <Link href="/dashboard/card" className="app-btn app-btn-primary mt-7 inline-flex px-7">
          build my card
        </Link>
      </div>
    );
  }

  const find = (id: string) => plans?.find((p) => p.id === id) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="app-h1">put it on a card.</h1>
        <p className="app-sub mt-2 max-w-xl">
          Your page is live and free. This is the card you hand over — tap it on
          any phone and the page opens, no app on either side.
        </p>
      </div>

      <NfcChooser
        card={card as CardProfile}
        cardId={(card as { id: string }).id}
        profileUrl={cardLinkUrl(card as CardProfile, "https://tap.scorlyn.com")}
        blank={find("printed")}
        custom={find("custom")}
      />
    </div>
  );
}
