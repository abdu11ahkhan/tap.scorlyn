import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, Nfc } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CARD_TEMPLATES } from "@/lib/card";
import { formatSerial } from "@/lib/card-codes";
import MyCardRow, { type MyCard, type MyPageOption } from "./MyCardRow";

export const dynamic = "force-dynamic";

/**
 * The physical cards this account owns: what each one opens, a nickname,
 * and a pause switch for a lost card. Changes go live on the next tap —
 * the QR and the chip never change.
 */
export default async function MyCards() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/cards");

  const [{ data: cards }, { data: pages }, { data: claims }] = await Promise.all([
    supabase
      .from("nfc_cards")
      .select("id, serial, card_url, nickname, status, owner_paused, card_profile_id, card_profiles(full_name, username)")
      .eq("user_id", user.id)
      .order("serial"),
    supabase
      .from("card_profiles")
      .select("id, full_name, username, template, is_single_purpose")
      .eq("user_id", user.id)
      .order("created_at"),
    supabase
      .from("card_claims")
      .select("id, created_at, nfc_cards(serial)")
      .eq("user_id", user.id)
      .eq("status", "pending"),
  ]);

  const options: MyPageOption[] = (pages ?? []).map((p) => ({
    id: p.id,
    label: `${p.full_name} · ${p.is_single_purpose ? "single link" : CARD_TEMPLATES.find((t) => t.id === p.template)?.name ?? p.template}`,
  }));

  const list: MyCard[] = (cards ?? []).map((c) => {
    const page = c.card_profiles as unknown as { full_name: string; username: string } | null;
    return {
      id: c.id,
      serial: formatSerial(c.serial),
      code: c.card_url,
      nickname: c.nickname ?? "",
      status: c.status,
      paused: c.owner_paused,
      profileId: c.card_profile_id,
      opens: page ? page.full_name : null,
    };
  });

  return (
    <div className="max-w-3xl space-y-5 pb-16">
      <div>
        <h1 className="app-h1">My cards</h1>
        <p className="app-sub mt-1">
          Your physical NFC + QR cards. Choose what each one opens — changes are live on the next tap, nothing to
          reprint.
        </p>
      </div>

      {(claims ?? []).map((c) => (
        <div key={c.id} className="app-panel app-panel-pad flex items-center gap-3">
          <Clock className="h-5 w-5 shrink-0 text-sc-text-dim" />
          <p className="text-sm font-semibold">
            Waiting for approval:{" "}
            <span className="font-mono">
              {formatSerial((c.nfc_cards as unknown as { serial: number } | null)?.serial)}
            </span>
            . We&apos;ll email you when it&apos;s ready.
          </p>
        </div>
      ))}

      {list.length === 0 && !(claims ?? []).length ? (
        <div className="app-panel app-panel-pad flex flex-col items-center gap-3 py-12 text-center">
          <Nfc className="h-6 w-6 text-sc-text-dim" />
          <p className="text-[15px] font-black">No physical cards yet</p>
          <p className="app-sub max-w-sm">Got a ScorlynTap card? Scan its QR code with your phone to activate it here.</p>
          <Link href="/dashboard/nfc" className="app-btn app-btn-primary mt-1">
            Order a printed card
          </Link>
        </div>
      ) : (
        list.map((card) => <MyCardRow key={card.id} card={card} pages={options} />)
      )}
    </div>
  );
}
