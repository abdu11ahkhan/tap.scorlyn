import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            // Not needed for a GET request
          }
        }
      }
    );

    // 1. Look up the card in the database
    const { data: cardData, error: cardError } = await supabase
      .from('nfc_cards')
      .select('website_id, card_profile_id')
      .eq('card_url', cardId)
      .single();

    if (cardError || !cardData) {
      return NextResponse.json({ error: "Card not found in database or RLS blocked read.", details: cardError });
    }

    // A card assigned to a digital business card wins over a portfolio site:
    // it's the fast, tap-optimised destination.
    if (cardData.card_profile_id) {
      const { data: profile } = await supabase
        .from('card_profiles')
        .select('username')
        .eq('id', cardData.card_profile_id)
        .maybeSingle();

      if (profile?.username) {
        // src=nfc lets the profile page tell a physical tap from a shared link.
        return NextResponse.redirect(new URL(`/u/${profile.username}?src=nfc`, request.url));
      }
    }

    if (!cardData.website_id) {
      return NextResponse.json({ error: "Card is not assigned to a profile or website." });
    }

    // 2. Look up the assigned website to get its template or slug
    const { data: websiteData, error: websiteError } = await supabase
      .from('websites')
      .select('template_name, slug')
      .eq('id', cardData.website_id)
      .single();

    if (websiteError || !websiteData) {
      return NextResponse.json({ error: "Website not found or RLS blocked read.", details: websiteError });
    }

    // 3. Dynamic Redirect
    const destinationPath = websiteData.slug 
      ? `/${websiteData.slug}` 
      : `/preview/${websiteData.template_name}`;

    return NextResponse.redirect(new URL(destinationPath, request.url));

  } catch (error: any) {
    console.error('NFC Redirect Error:', error);
    return NextResponse.json({ error: "Server caught an exception", details: error.message || error });
  }
}
