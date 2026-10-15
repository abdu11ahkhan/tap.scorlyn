import { resolveButton, type CardButton } from "./card";

/**
 * Where a physical tap or scan of /api/nfc/<code> should go — the decision
 * only, with no database or HTTP, so every branch can be unit-tested
 * (tests/unit/nfc-route.test.ts). The route resolves the card through the
 * resolve_nfc_card() RPC and acts on what this returns.
 */

/** One row of resolve_nfc_card(); undefined when the code is unknown. */
export type ResolvedNfcCard = {
  nfc_card_id: string;
  card_profile_id: string | null;
  username: string | null;
  is_single_purpose: boolean | null;
  redirect_kind: string | null;
  redirect_value: string | null;
  redirect_message: string | null;
  status?: string | null;
  claimable?: boolean | null;
};

export type TapSource = "nfc" | "qr" | "card";

export type NfcDecision =
  | { type: "redirect"; location: string }
  /** A one-link card: straight to its action, recording the tap here. */
  | { type: "direct"; location: string; source: TapSource };

/**
 * Tagged chips carry ?src=nfc and printed QRs ?src=qr. Cards made before the
 * tags have neither and are recorded as "card" (NFC or QR, unknown).
 */
export function nfcSource(src: string | null | undefined): TapSource {
  return src === "nfc" || src === "qr" ? src : "card";
}

export function decideNfcRoute(
  card: ResolvedNfcCard | undefined,
  cardId: string,
  src: string | null | undefined
): NfcDecision {
  const source = nfcSource(src);

  // A suspended or retired card must stop opening its business, even though
  // the assignment is still on record. `status` is absent until migration
  // 061 has run, which reads as "live" — the behaviour before it existed.
  if (card?.status === "suspended" || card?.status === "retired") {
    return { type: "redirect", location: "/card/inactive" };
  }

  // Stock released for sale, or a card its new owner hasn't set up yet:
  // the activate page handles sign-in, claiming and choosing what it opens.
  if (card && !card.card_profile_id && (card.status === "claimed" || (card.status === "in_stock" && card.claimable))) {
    return { type: "redirect", location: `/activate/${encodeURIComponent(cardId)}` };
  }

  if (!card?.card_profile_id || !card?.username) {
    // Either an unknown code or blank stock that hasn't been assigned yet.
    // The code is passed on only when it's a real card, so the owner's
    // "Activate my card" button can go straight to it.
    return {
      type: "redirect",
      location: card ? `/card/not-set-up?c=${encodeURIComponent(cardId)}` : "/card/not-set-up",
    };
  }

  if (card.is_single_purpose) {
    const resolved = resolveButton({
      label: "",
      kind: card.redirect_kind as CardButton["kind"],
      value: card.redirect_value ?? "",
      message: card.redirect_message ?? undefined,
    });
    if (resolved) return { type: "direct", location: resolved.href, source };
  }

  // src lets the profile page tell a physical tap or scan from a shared link;
  // nfc={cardId} is the same public code already printed on the tag, now
  // forwarded so the page can attribute whatever it does next (the view
  // itself, and any outbound click) back to this specific physical card.
  return {
    type: "redirect",
    location: `/u/${card.username}?src=${source}&nfc=${encodeURIComponent(cardId)}`,
  };
}
