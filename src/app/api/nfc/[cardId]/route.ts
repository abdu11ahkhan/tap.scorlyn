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
      return NextResponse.redirect(new URL('/?card=inactive', request.url));
    }

    if (!card?.card_profile_id || !card?.username) {
      // Either an unknown code or blank stock that hasn't been assigned yet.
      // Send them somewhere useful rather than showing a raw error.
      return NextResponse.redirect(new URL('/?card=unassigned', request.url));
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
        // record the tap from — it's recorded here or not at all. QR and NFC
        // share this URL and are counted together.
        const userAgent = request.headers.get('user-agent') ?? '';
        await supabase
          .from('card_taps')
          .insert({
            card_profile_id: card.card_profile_id,
            nfc_card_id: card.nfc_card_id,
            source: 'nfc',
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

    // src=nfc lets the profile page tell a physical tap from a shared link;
    // nfc={cardId} is the same public code already printed on the tag, now
    // forwarded so the page can attribute whatever it does next (the view
    // itself, and any outbound click) back to this specific physical card.
    return NextResponse.redirect(
      new URL(`/u/${card.username}?src=nfc&nfc=${encodeURIComponent(cardId)}`, request.url)
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
