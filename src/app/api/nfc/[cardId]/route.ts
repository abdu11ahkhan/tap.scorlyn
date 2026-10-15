import { NextResponse, after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clientIp, visitorHash } from '@/lib/referral';
import { decideNfcRoute, type ResolvedNfcCard } from '@/lib/nfc-route';
import { LIMITS, checkLimits, defaultRpc, limitIdentity, serviceClient } from '@/lib/rate-limit';

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
 *
 * Where to send the visitor is decided by decideNfcRoute() (src/lib/nfc-route.ts),
 * which is unit-tested branch by branch.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const supabase = await createClient();
    const via = new URL(request.url).searchParams.get('src');

    // Not a plain table select: nfc_cards has no public SELECT policy (only
    // its owner or an admin can read it directly), and a physical tap is
    // always anonymous. resolve_nfc_card() is a SECURITY DEFINER RPC that
    // hands back only the fields this redirect needs for one code at a time,
    // without opening the whole table to public reads.
    const { data: rows } = await supabase.rpc('resolve_nfc_card', { code: cardId });
    const card = rows?.[0] as ResolvedNfcCard | undefined;

    const decision = decideNfcRoute(card, cardId, via);

    if (decision.type === 'direct' && card) {
      // A direct card never loads a Scorlyn page, so there is no page to
      // record the tap from — it's recorded here or not at all. Done after
      // the redirect is sent (so the tap itself is never slowed down), and
      // under the same limits as /api/tap so a script can't write rows
      // without bound by hammering a card URL.
      const userAgent = request.headers.get('user-agent') ?? '';
      const who = limitIdentity(request.headers);
      after(async () => {
        const limit = await checkLimits([
          { key: `tap:ip:${who.ip}`, windowSeconds: 60, max: LIMITS.tap.ipPerMinute },
          { key: `tap:v:${who.visitor}`, windowSeconds: 60, max: LIMITS.tap.visitorPerMinute },
        ]);
        if (!limit.allowed) return;
        // Service role when configured (migration 070 removes anonymous
        // inserts). The old insert policy only accepted taps on live cards,
        // so that check is made here explicitly before writing.
        const admin = serviceClient();
        if (admin) {
          const { data: live } = await defaultRpc()!('is_live_card', { p_id: card.card_profile_id });
          if (live !== true) return;
        }
        await (admin ?? supabase)
          .from('card_taps')
          .insert({
            card_profile_id: card.card_profile_id,
            nfc_card_id: card.nfc_card_id,
            source: decision.source,
            event_type: 'view',
            user_agent: userAgent.slice(0, 500),
            visitor_hash: visitorHash(clientIp(request.headers), userAgent),
          })
          .then(
            () => undefined,
            () => undefined
          );
      });
      return NextResponse.redirect(decision.location);
    }

    return NextResponse.redirect(new URL(decision.location, request.url));
  } catch {
    // Never echo internal detail to whoever tapped. Not a redirect to
    // /card/not-set-up: a lookup failure says nothing about the card itself.
    return new NextResponse("Couldn't open this card right now. Please try again in a moment.", {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '5' },
    });
  }
}
