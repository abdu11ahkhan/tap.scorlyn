import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveButton, type CardButton } from '@/lib/card';
import { clientIp, visitorHash } from '@/lib/referral';

export const dynamic = 'force-dynamic';

/**
 * What a physical tap hits.
 *
 * The tag stores this URL rather than the profile URL directly, so a card can
 * be reassigned to a different person later without rewriting the chip.
 *
 * A single-purpose card (is_single_purpose) skips the profile page entirely —
 * the tap redirects straight to its one action (a WhatsApp chat, a review
 * link, ...), in one hop.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const supabase = await createClient();
    // Which channel the visit came through: tagged chips and QRs say so;
    // older cards carry no tag and are recorded as 'card' (NFC or QR).
    const via = new URL(request.url).searchParams.get('src');
    const source = via === 'nfc' || via === 'qr' ? via : 'card';

    // Not a plain table select: nfc_cards has no public SELECT policy (only
    // its owner or an admin can read it directly), and a physical tap is
    // always anonymous. resolve_nfc_card() is a SECURITY DEFINER RPC that
    // hands back only the fields this redirect needs for one code at a time,
    // without opening the whole table to public reads.
    const { data: rows } = await supabase.rpc('resolve_nfc_card', { code: cardId });
    const card = rows?.[0];

    // A suspended or retired card must stop opening its business, even though
    // the assignment is still on record. `status` is absent until migration
    // 061 has run, which reads as "live" — the behaviour before it existed.
    if (card?.status === 'suspended' || card?.status === 'retired') {
      // A dedicated page, not the homepage: whoever tapped is usually not the
      // owner, and needs to be told what's going on.
      return NextResponse.redirect(new URL('/card/inactive', request.url));
    }

    // Stock released for sale, or a card its new owner hasn't set up yet:
    // the activate page handles sign-in, claiming and choosing what it opens.
    if (card && !card.card_profile_id && (card.status === 'claimed' || (card.status === 'in_stock' && card.claimable))) {
      return NextResponse.redirect(new URL(`/activate/${encodeURIComponent(cardId)}`, request.url));
    }

    if (!card?.card_profile_id || !card?.username) {
      // Either an unknown code or blank stock that hasn't been assigned yet.
      // The code is passed on only when it's a real card, so the owner's
      // "Activate my card" button can go straight to it.
      const target = card ? `/card/not-set-up?c=${encodeURIComponent(cardId)}` : '/card/not-set-up';
      return NextResponse.redirect(new URL(target, request.url));
    }

    if (card.is_single_purpose) {
      const resolved = resolveButton({
        label: '',
        kind: card.redirect_kind as CardButton['kind'],
        value: card.redirect_value ?? '',
        message: card.redirect_message ?? undefined,
      });
      if (resolved) {
        // A direct card never loads a Scorlyn page, so there is no page to
        // record the tap from — it's recorded here or not at all.
        const userAgent = request.headers.get('user-agent') ?? '';
        await supabase
          .from('card_taps')
          .insert({
            card_profile_id: card.card_profile_id,
            nfc_card_id: card.nfc_card_id,
            source,
            event_type: 'view',
            user_agent: userAgent.slice(0, 500),
            visitor_hash: visitorHash(clientIp(request.headers), userAgent),
          })
          .then(
            () => undefined,
            () => undefined
          );
        return NextResponse.redirect(resolved.href);
      }
    }

    // src lets the profile page tell a physical tap or scan from a shared link;
    // nfc={cardId} is the same public code already printed on the tag, now
    // forwarded so the page can attribute whatever it does next (the view
    // itself, and any outbound click) back to this specific physical card.
    return NextResponse.redirect(
      new URL(`/u/${card.username}?src=${source}&nfc=${encodeURIComponent(cardId)}`, request.url)
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
