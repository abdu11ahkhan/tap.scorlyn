"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ExternalLink, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TEMPLATE_IDS,
  resolveButtonsForPreview,
  resolveGallery,
  type CardButton,
  type GalleryItem,
} from "@/lib/card";
import {
  EMPTY_CARD_FORM,
  USERNAME_PATTERN,
  clearDraft,
  draftToCardProfile,
  loadDraft,
  type CardForm,
} from "@/lib/card-draft";
import CardEditorFields from "@/components/card-editor/CardEditorFields";
import { type ExtrasState } from "@/components/card-editor/ProfileExtrasFields";
import DevicePreview from "@/components/card-editor/DevicePreview";
import { uploadPendingImages } from "@/lib/upload-drafts";
import CardDesigner from "@/components/card-design/CardDesigner";
import { renderCardTemplate } from "@/components/card-templates";

const EMPTY_EXTRAS: ExtrasState = {
  available_for_work: false,
  availability_note: "",
  business_hours: [],
  video_url: "",
  payment_enabled: false,
  payment_methods: [],
};

function MyCardEditor() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  // Set when arriving from the public gallery's "Use this template".
  const requestedTemplate = searchParams.get("template");
  const presetTemplate =
    requestedTemplate && TEMPLATE_IDS.includes(requestedTemplate as (typeof TEMPLATE_IDS)[number])
      ? requestedTemplate
      : null;

  // Set when arriving from the public editor via Publish.
  const fromDraft = searchParams.get("from") === "draft";

  const [form, setForm] = useState<CardForm>(EMPTY_CARD_FORM);
  const [buttons, setButtons] = useState<CardButton[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [extras, setExtras] = useState<ExtrasState>(EMPTY_EXTRAS);
  const [cardId, setCardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draftApplied, setDraftApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("card_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const saved: CardForm | null = data
        ? {
            username: data.username ?? "",
            full_name: data.full_name ?? "",
            headline: data.headline ?? "",
            company: data.company ?? "",
            bio: data.bio ?? "",
            avatar_url: data.avatar_url ?? "",
            cover_url: data.cover_url ?? "",
            logo_url: data.logo_url ?? "",
            location: data.location ?? "",
            accent_color: data.accent_color ?? "#111111",
            template: data.template ?? "minimal",
            font: data.font ?? "sans",
          }
        : null;

      if (data) {
        setCardId(data.id);
        setExtras({
          available_for_work: data.available_for_work ?? false,
          availability_note: data.availability_note ?? "",
          business_hours: Array.isArray(data.business_hours) ? data.business_hours : [],
          video_url: data.video_url ?? "",
          payment_enabled: data.payment_enabled ?? false,
          payment_methods: Array.isArray(data.payment_methods) ? data.payment_methods : [],
        });
      }

      // Work done before signing up wins — it's what they just built, and the
      // username is the one thing the anonymous editor couldn't collect.
      const draft = fromDraft ? loadDraft() : null;

      if (draft) {
        setForm({ ...draft.form, username: saved?.username ?? draft.form.username });
        setButtons(draft.buttons);
        setGallery(draft.gallery ?? []);
        setExtras({ ...EMPTY_EXTRAS, ...(draft.extras ?? {}) });
        setDraftApplied(true);
      } else if (saved) {
        setForm({ ...saved, template: presetTemplate ?? saved.template });
        setButtons(Array.isArray(data!.buttons) ? data!.buttons : []);
        setGallery(Array.isArray(data!.gallery) ? data!.gallery : []);
      } else if (presetTemplate) {
        setForm((prev) => ({ ...prev, template: presetTemplate }));
      }

      setLoading(false);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateForm = (patch: Partial<CardForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  };

  // Same live preview the public editor has — editing here was previously blind.
  const previewCard = useMemo(
    () => draftToCardProfile(form, buttons, resolveGallery(gallery), extras),
    [form, buttons, gallery, extras]
  );
  const previewButtons = useMemo(() => resolveButtonsForPreview(buttons), [buttons]);

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const profileUrl = `${origin}/u/${previewCard.username}`;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setSaving(false);
      return;
    }

    const username = form.username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(username)) {
      setError("Username must be 3–30 characters: lowercase letters, numbers, - and _ only.");
      setSaving(false);
      return;
    }

    if (!form.full_name.trim()) {
      setError("Your card needs a name.");
      setSaving(false);
      return;
    }

    const cleanButtons = buttons.filter((b) => b.value?.trim());

    // Photos picked before signing in are still inline in the draft. There's an
    // account now, so they become real uploads before anything is written.
    let uploadedForm = form;
    let uploadedGallery = gallery;
    try {
      const done = await uploadPendingImages(form, gallery);
      uploadedForm = done.form;
      uploadedGallery = done.gallery;
      setForm(done.form);
      setGallery(done.gallery);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload your photos."
      );
      setSaving(false);
      return;
    }

    const payload = {
      ...uploadedForm,
      username,
      user_id: user.id,
      buttons: cleanButtons,
      gallery: uploadedGallery.filter((g) => g.url?.trim()),
      available_for_work: extras.available_for_work,
      availability_note: extras.availability_note?.trim() || null,
      business_hours: extras.business_hours.filter((h) => h.day?.trim() && h.hours?.trim()),
      video_url: extras.video_url?.trim() || null,
      payment_enabled: extras.payment_enabled,
      payment_methods: extras.payment_methods.filter(
        (m) => m.account_number?.trim() || m.iban?.trim()
      ),
      // Kept in sync so the vCard export and any legacy reads still work.
      whatsapp: cleanButtons.find((b) => b.kind === "whatsapp")?.value ?? null,
      phone: cleanButtons.find((b) => b.kind === "phone")?.value ?? null,
      email: cleanButtons.find((b) => b.kind === "email")?.value ?? null,
    };

    const { data, error: saveError } = cardId
      ? await supabase.from("card_profiles").update(payload).eq("id", cardId).select().single()
      : await supabase.from("card_profiles").insert(payload).select().single();

    if (saveError) {
      setError(saveError.code === "23505" ? "That username is already taken." : saveError.message);
    } else {
      setCardId(data.id);
      setSaved(true);
      // Published — the local draft has served its purpose.
      clearDraft();
      setDraftApplied(false);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-acid" />
      </div>
    );
  }

  return (
    <div className="grid max-w-6xl gap-10 pb-20 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      <div className="min-w-0">
      <h1 className="text-4xl font-black tracking-tighter text-white">
        my <span className="text-acid">card.</span>
      </h1>
      <p className="mt-2 font-medium text-white/50">
        This is what opens when someone taps your NFC card.
      </p>

      {cardId && form.username && (
        <Link
          href={`/u/${form.username}`}
          target="_blank"
          className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-acid px-4 py-2 text-sm font-black text-acid transition-colors hover:bg-acid hover:text-ink"
        >
          <ExternalLink className="h-4 w-4" />
          /u/{form.username}
        </Link>
      )}

      {draftApplied && (
        <div className="sticker-lg mt-6 rounded-2xl border-2 border-ink bg-acid p-5 text-ink">
          <p className="font-black">We picked up where you left off.</p>
          <p className="mt-1 text-sm font-semibold opacity-70">
            Choose a username below, then publish to put your card live.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border-2 border-ink bg-hotpink px-4 py-3 text-sm font-bold text-white">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="mt-8 space-y-8">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={form.username}
            onChange={(e) => updateForm({ username: e.target.value })}
            placeholder="abdullah"
            required
            autoFocus={draftApplied}
            className="border-2 border-white/15 bg-white/[0.04] font-semibold text-white placeholder:text-white/25 focus-visible:border-acid focus-visible:ring-0"
          />
          <p className="text-xs font-semibold text-white/40">
            Your card will live at /u/{form.username || "username"}
          </p>
        </div>

        <CardEditorFields
          form={form}
          onFormChange={updateForm}
          buttons={buttons}
          onButtonsChange={(next) => {
            setButtons(next);
            setSaved(false);
          }}
          gallery={gallery}
          onGalleryChange={(next) => {
            setGallery(next);
            setSaved(false);
          }}
          extras={extras}
          onExtrasChange={(patch) => {
            setExtras((prev) => ({ ...prev, ...patch }));
            setSaved(false);
          }}
          showUsername={false}
        />

        <button
          type="submit"
          disabled={saving}
          className="sticker sticker-press flex h-14 w-full items-center justify-center rounded-full border-2 border-ink bg-acid text-base font-black uppercase tracking-tight text-ink disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : saved ? (
            <>
              <Check className="mr-2 h-5 w-5" strokeWidth={3.5} />
              published
            </>
          ) : cardId ? (
            "save changes"
          ) : (
            "publish my card"
          )}
        </button>
      </form>
      </div>

      {/* Sticky beside the fields on desktop, stacked underneath on mobile —
          the card designer and its settings live in here, so hiding it on
          small screens meant phones couldn't configure the card at all. */}
      <div className="min-w-0 lg:sticky lg:top-6">
        <DevicePreview
          cardView={
            <CardDesigner
              card={previewCard}
              profileUrl={profileUrl}
              width={340}
              compact
            />
          }
        >
          {renderCardTemplate({ card: previewCard, buttons: previewButtons })}
        </DevicePreview>
      </div>
    </div>
  );
}

// useSearchParams() suspends, so the editor needs a boundary above it.
export default function MyCardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-acid" />
        </div>
      }
    >
      <MyCardEditor />
    </Suspense>
  );
}
