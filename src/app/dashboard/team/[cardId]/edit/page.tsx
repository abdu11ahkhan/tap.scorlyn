import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EmployeeCardEditor from "./EmployeeCardEditor";
import { EMPTY_CARD_FORM, type CardForm } from "@/lib/card-draft";
import type { CardButton, GalleryItem } from "@/lib/card";
import type { ExtrasState } from "@/components/card-editor/ProfileExtrasFields";

export const dynamic = "force-dynamic";

/**
 * Open an employee's card and change anything on it — the corporate-owner
 * equivalent of src/app/admin/cards/[id]/edit/page.tsx.
 *
 * Read under the owner's own session, not service role: the RLS policy
 * "Corporate owners can view their employees' cards." (see
 * supabase/migrations/040_corporate_accounts.sql) already scopes this to
 * exactly the rows this owner is allowed to see, so a card belonging to
 * someone else's company resolves to nothing rather than needing a manual
 * check here.
 */
export default async function EditEmployeeCard({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  const supabase = await createClient();

  const { data: card } = await supabase
    .from("card_profiles")
    .select("*")
    .eq("id", cardId)
    .maybeSingle();

  if (!card) notFound();

  const form: CardForm = {
    ...EMPTY_CARD_FORM,
    username: card.username ?? "",
    full_name: card.full_name ?? "",
    headline: card.headline ?? "",
    company: card.company ?? "",
    bio: card.bio ?? "",
    avatar_url: card.avatar_url ?? "",
    cover_url: card.cover_url ?? "",
    logo_url: card.logo_url ?? "",
    show_qr: card.show_qr !== false,
    surface_color: card.surface_color ?? "",
    background_effect: card.background_effect ?? "none",
    intro_style: card.intro_style ?? "rise",
    button_style: card.button_style ?? "default",
    published: card.published !== false,
    location: card.location ?? "",
    accent_color: card.accent_color ?? "#111111",
    template: card.template ?? "minimal",
    font: card.font ?? "sans",
    is_single_purpose: card.is_single_purpose ?? false,
  };

  const extras: ExtrasState = {
    available_for_work: card.available_for_work ?? false,
    availability_note: card.availability_note ?? "",
    business_hours: Array.isArray(card.business_hours) ? card.business_hours : [],
    video_url: card.video_url ?? "",
    payment_enabled: card.payment_enabled ?? false,
    payment_methods: Array.isArray(card.payment_methods) ? card.payment_methods : [],
  };

  return (
    <EmployeeCardEditor
      cardId={card.id}
      username={card.username}
      initialForm={form}
      initialButtons={(Array.isArray(card.buttons) ? card.buttons : []) as CardButton[]}
      initialGallery={(Array.isArray(card.gallery) ? card.gallery : []) as GalleryItem[]}
      initialExtras={extras}
    />
  );
}
