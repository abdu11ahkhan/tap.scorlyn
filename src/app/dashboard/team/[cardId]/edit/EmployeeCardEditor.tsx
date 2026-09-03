"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CardEditorFields from "@/components/card-editor/CardEditorFields";
import { type ExtrasState } from "@/components/card-editor/ProfileExtrasFields";
import { draftToCardProfile, type CardForm } from "@/lib/card-draft";
import { cardLinkUrl, resolveButtonsForPreview, resolveGallery, type CardButton, type GalleryItem } from "@/lib/card";
import { renderCardTemplate } from "@/components/card-templates";
import CardDesigner from "@/components/card-design/CardDesigner";
import DevicePreview from "@/components/card-editor/DevicePreview";

/**
 * An employee's own editor, driven by the company that owns their card —
 * the corporate-owner equivalent of
 * src/app/admin/cards/[id]/edit/AdminCardEditor.tsx, and for the same
 * reason: the fields are the employee's own, not a second copy that would
 * drift from what they see.
 *
 * The one departure from that admin version: lockUsername is always true
 * here. Admin is exempted from the username-lock trigger
 * (lock_username() — see supabase/migrations/032_admin_can_rename.sql);
 * a corporate owner is an ordinary authenticated user and is not, so the
 * database would silently reject a username change from this form anyway —
 * better the field never invites one.
 */
export default function EmployeeCardEditor({
  cardId,
  username,
  initialForm,
  initialButtons,
  initialGallery,
  initialExtras,
}: {
  cardId: string;
  username: string;
  initialForm: CardForm;
  initialButtons: CardButton[];
  initialGallery: GalleryItem[];
  initialExtras: ExtrasState;
}) {
  const [form, setForm] = useState<CardForm>(initialForm);
  const [buttons, setButtons] = useState<CardButton[]>(initialButtons);
  const [gallery, setGallery] = useState<GalleryItem[]>(initialGallery);
  const [extras, setExtras] = useState<ExtrasState>(initialExtras);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const touch = () => {
    setSaved(false);
    setError(null);
  };

  // Same live preview the customer's own editors have — this one was
  // previously blind, same as its admin equivalent.
  const previewCard = useMemo(
    () => draftToCardProfile(form, buttons, resolveGallery(gallery), extras),
    [form, buttons, gallery, extras]
  );
  const previewButtons = useMemo(() => resolveButtonsForPreview(buttons), [buttons]);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const profileUrl = cardLinkUrl(previewCard, origin);

  const save = async () => {
    setSaving(true);
    setError(null);

    const cleanButtons = buttons.filter((b) => b.value?.trim());

    // The caller's own session — the RLS policy "Corporate owners can edit
    // their employees' cards." (040_corporate_accounts.sql) is what scopes
    // this write to a row this account actually owns.
    const { data, error: saveError } = await createClient()
      .from("card_profiles")
      .update({
        // username deliberately excluded: see the lockUsername note above.
        full_name: form.full_name,
        headline: form.headline,
        company: form.company,
        bio: form.bio,
        avatar_url: form.avatar_url,
        cover_url: form.cover_url,
        logo_url: form.logo_url,
        show_qr: form.show_qr,
        surface_color: form.surface_color,
        published: form.published,
        location: form.location,
        accent_color: form.accent_color,
        template: form.template,
        font: form.font,
        buttons: cleanButtons,
        gallery: gallery.filter((g) => g.url?.trim()),
        available_for_work: extras.available_for_work,
        availability_note: extras.availability_note?.trim() || null,
        business_hours: extras.business_hours.filter(
          (h) => h.day?.trim() && h.hours?.trim()
        ),
        video_url: extras.video_url?.trim() || null,
        payment_enabled: extras.payment_enabled,
        payment_methods: extras.payment_methods.filter(
          (m) => m.account_number?.trim() || m.iban?.trim()
        ),
        // Kept in sync so the vCard export and any legacy reads still work.
        whatsapp: cleanButtons.find((b) => b.kind === "whatsapp")?.value ?? null,
        phone: cleanButtons.find((b) => b.kind === "phone")?.value ?? null,
        email: cleanButtons.find((b) => b.kind === "email")?.value ?? null,
      })
      .eq("id", cardId)
      // Confirm a row actually changed: RLS refuses by matching nothing
      // rather than erroring, so without this a blocked save would report
      // success.
      .select("id");

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    if (!data?.length) {
      setError("Nothing was saved — this card may have been removed.");
      return;
    }
    setSaved(true);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-sc-text">
              Editing @{username}
            </h1>
            <p className="mt-1 text-sm font-medium text-sc-text-dim">
              Changes go straight to their live card.
            </p>
          </div>
          <Link
            href={"/u/" + username}
            target="_blank"
            className="app-pill inline-flex items-center gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            view card
          </Link>
        </div>

        {error && (
          <p className="rounded-xl border-2 border-sc-error/40 bg-sc-error/10 px-4 py-3 text-sm font-bold text-sc-error">
            {error}
          </p>
        )}

        <CardEditorFields
          form={form}
          onFormChange={(patch) => {
            setForm((prev) => ({ ...prev, ...patch }));
            touch();
          }}
          buttons={buttons}
          onButtonsChange={(next) => {
            setButtons(next);
            touch();
          }}
          gallery={gallery}
          onGalleryChange={(next) => {
            setGallery(next);
            touch();
          }}
          extras={extras}
          onExtrasChange={(patch) => {
            setExtras((prev) => ({ ...prev, ...patch }));
            touch();
          }}
          showUsername
          lockUsername
          ownHandle={username}
        />

        <div className="sticky bottom-4 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="app-btn app-btn-primary px-7"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : null}
            {saved ? "saved" : "save changes"}
          </button>
          <Link href="/dashboard/team" className="text-sm font-bold text-sc-text-dim">
            back to team
          </Link>
        </div>
      </div>

      <div className="min-w-0 lg:sticky lg:top-6">
        <DevicePreview
          cardView={
            <CardDesigner card={previewCard} profileUrl={profileUrl} width={340} compact />
          }
        >
          {renderCardTemplate({ card: previewCard, buttons: previewButtons })}
        </DevicePreview>
      </div>
    </div>
  );
}
