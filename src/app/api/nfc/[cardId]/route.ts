import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * What a physical tap hits.
 *
 * The tag stores this URL rather than the profile URL directly, so a card can
 * be reassigned to a different person later without rewriting the chip.
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
    // hands back only {nfc_card_id, card_profile_id} for one code at a time,
    // without opening the whole table to public reads.
    const { data: rows } = await supabase.rpc('resolve_nfc_card', { code: cardId });
    const card = rows?.[0];

    if (!card?.card_profile_id) {
      // Either an unknown code or blank stock that hasn't been assigned yet.
      // Send them somewhere useful rather than showing a raw error.
      return NextResponse.redirect(new URL('/?card=unassigned', request.url));
    }

    const { data: profile } = await supabase
      .from('card_profiles')
      .select('username')
      .eq('id', card.card_profile_id)
      .maybeSingle();

    if (!profile?.username) {
      return NextResponse.redirect(new URL('/?card=unassigned', request.url));
    }

    // src=nfc lets the profile page tell a physical tap from a shared link;
    // nfc={cardId} is the same public code already printed on the tag, now
    // forwarded so the page can attribute whatever it does next (the view
    // itself, and any outbound click) back to this specific physical card.
    return NextResponse.redirect(
      new URL(`/u/${profile.username}?src=nfc&nfc=${encodeURIComponent(cardId)}`, request.url)
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
