import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveButtons, type CardProfile } from "@/lib/card";
import { renderCardTemplate } from "@/components/card-templates";
import TapTracker from "@/components/nfc/TapTracker";
import ReferralBanner from "@/components/nfc/ReferralBanner";
import ProfileExtras from "@/components/nfc/ProfileExtras";
import ShareButton from "@/components/nfc/ShareButton";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

async function getCard(username: string): Promise<CardProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("card_profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .eq("published", true)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const card = await getCard(username);

  if (!card) return { title: "Card not found" };

  const title = card.headline ? `${card.full_name} — ${card.headline}` : card.full_name;
  const description = card.bio ?? `Contact ${card.full_name}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: card.avatar_url ? [card.avatar_url] : undefined,
    },
  };
}

export default async function CardProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ src?: string }>;
}) {
  const { username } = await params;
  const { src } = await searchParams;

  const card = await getCard(username);
  if (!card) return notFound();

  // `src=nfc` is appended by the NFC redirect handler, so a physical tap is
  // distinguishable from someone who was sent the link.
  const source: "nfc" | "qr" | "link" =
    src === "nfc" ? "nfc" : src === "qr" ? "qr" : "link";

  const buttons = resolveButtons(card.buttons);

  // Nobody needs selling their own card back to them.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = Boolean(user && user.id === card.user_id);

  // Built from the request so the share link is right on any host.
  const host = (await headers()).get("host") ?? "";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const shareUrl = `${proto}://${host}/u/${card.username}`;

  return (
    <>
      <TapTracker username={card.username} source={source} />

      <ShareButton
        url={shareUrl}
        name={card.full_name}
        accent={card.accent_color || "#111111"}
      />

      {renderCardTemplate({ card, buttons })}

      <ProfileExtras card={card} />

      <ReferralBanner
        refCode={card.referral_code}
        cardProfileId={card.id}
        ownerName={card.full_name}
        isOwner={isOwner}
      />
    </>
  );
}
