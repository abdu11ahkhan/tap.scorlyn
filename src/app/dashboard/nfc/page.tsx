import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NfcChooser from "./NfcChooser";
import type { CardProfile } from "@/lib/card";

export const dynamic = "force-dynamic";

/**
 * The step between having a free page and owning a card.
 *
 * Nothing previously showed a customer what the physical product looks like,
 * so the paid plans were two lines of text beside something they already had
 * for nothing. This draws both options with their own card and their own link.
 */
export default async function GetNfcCard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: card }, { data: plans }] = await Promise.all([
    user
      ? supabase.from("card_profiles").select("*").eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("plans").select("id, name, price_pkr, blurb").eq("enabled", true),
  ]);

  // A printed card is a chip pointing at a page. Without the page there is
  // nothing to program, so this asks for that first rather than selling into
  // a dead link.
  if (!card?.username) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-3xl font-black tracking-tighter text-white">
          make your card first
        </h1>
        <p className="mt-3 text-[15px] font-semibold text-white/50">
          A printed card is a chip that opens your page. Build the page and
          this is the next step.
        </p>
        <Link
          href="/dashboard/card"
          className="sticker sticker-press mt-7 inline-flex h-13 items-center rounded-full border-2 border-ink bg-acid px-7 text-sm font-black uppercase tracking-tight text-ink"
        >
          build my card
        </Link>
      </div>
    );
  }

  const find = (id: string) => plans?.find((p) => p.id === id) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-white">
          put it on a card.
        </h1>
        <p className="mt-2 max-w-xl text-[15px] font-semibold text-white/50">
          Your page is live and free. This is the card you hand over — tap it on
          any phone and the page opens, no app on either side.
        </p>
      </div>

      <NfcChooser
        card={card as CardProfile}
        profileUrl={`https://tap.scorlyn.com/u/${card.username}`}
        blank={find("printed")}
        custom={find("custom")}
      />
    </div>
  );
}
