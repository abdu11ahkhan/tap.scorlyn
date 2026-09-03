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
 * The customer's own editor, driven by admin.
 *
 * Support here works over WhatsApp: people send their details and expect the
 * card to exist. Impersonating the account works but signs admin out of their
 * own session and leaves no trace of who made the change, so this edits the
 * card directly instead. The fields are the customer's, not a second
 * admin-only copy that would drift from what they see.
 */
export default function AdminCardEditor({
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
  // previously blind, so a change only became visible after saving and
  // opening the live card in a second tab.
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

    const { data, error: saveError } = await createClient()
      .from("card_profiles")
      .update({
        ...form,
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
      // Confirm a row actually changed: RLS refuses by matching nothing rather
      // than erroring, so without this a blocked save reports success.
      .select("id");

    setSaving(false);
    if (saveError) {
      setError(
        saveError.code === "23505"
          ? "That username is already taken by another card."
          : saveError.message
      );
      return;
    }
    if (!data?.length) {
      setError("Nothing was saved — this card may have been deleted.");
      return;
    }
    setSaved(true);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="app-h1">Editing @{username}</h1>
            <p className="app-sub mt-1">
              Changes go straight to the customer&apos;s live card.
            </p>
          </div>
          <Link
            href={`/u/${form.username || username}`}
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
          // Admin is exactly who should be able to fix a handle — the lock is
          // there to stop a customer breaking cards already handed out.
          lockUsername={false}
          ownHandle={username}
        />

        <div className="sticky bottom-4 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-ink bg-acid px-7 text-sm font-black uppercase tracking-tight text-ink disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : null}
            {saved ? "saved" : "save changes"}
          </button>
          <Link href="/admin/cards" className="text-sm font-bold text-sc-text-dim">
            back to cards
          </Link>
        </div>
      </div>

      {/* Live preview — re-renders as admin types, the same component the
          customer's own editors use. Previously the only way to see a change
          was to save it and open the live card in a second tab. */}
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
