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

    const { data: card } = await supabase
      .from('nfc_cards')
      .select('card_profile_id')
      .eq('card_url', cardId)
      .maybeSingle();

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

    // src=nfc lets the profile page tell a physical tap from a shared link.
    return NextResponse.redirect(new URL(`/u/${profile.username}?src=nfc`, request.url));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
