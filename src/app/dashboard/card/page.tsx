"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ExternalLink, Check, Nfc, ArrowRight } from "lucide-react";
import {
  TEMPLATE_IDS,
  cardLinkUrl,
  resolveButtonsForPreview,
  resolveGallery,
  type CardButton,
  type GalleryItem,
} from "@/lib/card";
import {
  EMPTY_CARD_FORM,
  USERNAME_PATTERN,
  clearDraft,
  clearEditDraft,
  draftToCardProfile,
  editDraftKey,
  loadDraft,
  loadEditDraft,
  saveEditDraft,
  type CardForm,
} from "@/lib/card-draft";
import CardEditorFields from "@/components/card-editor/CardEditorFields";
import NfcFormatPrompt from "@/components/card-design/NfcFormatPrompt";
import CardFeePanel from "@/components/dashboard/CardFeePanel";
import { type ExtrasState } from "@/components/card-editor/ProfileExtrasFields";
import DevicePreview from "@/components/card-editor/DevicePreview";
import { uploadPendingImages } from "@/lib/upload-drafts";
import CardDesigner from "@/components/card-design/CardDesigner";
import DeleteCardButton from "@/components/card-editor/DeleteCardButton";
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
  /** Which of their cards to edit. Absent means their first. */
  const requestedCardId = searchParams.get("id");

  const [form, setForm] = useState<CardForm>(EMPTY_CARD_FORM);
  const [buttons, setButtons] = useState<CardButton[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [extras, setExtras] = useState<ExtrasState>(EMPTY_EXTRAS);
  const [cardId, setCardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draftApplied, setDraftApplied] = useState(false);
  const [localEditsRestored, setLocalEditsRestored] = useState(false);
  /** Whether load() confirmed a signed-in user. Guards the autosave effect
   *  below — without it, a signed-out visit writes an empty draft over
   *  whatever real one is sitting in this slot. */
  const [authed, setAuthed] = useState(false);
  /** Set when a live card still has no printable design chosen. */
  const [askNfcFor, setAskNfcFor] = useState<string | null>(null);
  /** The one clean "your card is live" moment — replaces an auto-opened tab
   *  (silently blockable, and easy to miss) with an on-page panel that
   *  states the fact and offers one clear next action. Holds the pending
   *  NFC-design ask until this is dismissed, so the two don't compete for
   *  attention at once. */
  const [justPublished, setJustPublished] = useState<{ url: string; username: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [pendingNfcAsk, setPendingNfcAsk] = useState<string | null>(null);
  /** Approval state for this card. Extra cards are paid for before going live. */
  const [approval, setApproval] = useState<{
    status: string;
    fee: number | null;
    note: string | null;
  }>({ status: "approved", fee: null, note: null });
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
      setAuthed(true);

      // RLS scopes this to their own cards, so an id from the URL cannot
      // reach anyone else's — but it is still filtered by user_id so a wrong
      // id returns nothing rather than the first card of someone else's.
      const base = supabase.from("card_profiles").select("*").eq("user_id", user.id);
      const { data } = requestedCardId
        ? await base.eq("id", requestedCardId).maybeSingle()
        : await base.order("created_at", { ascending: true }).limit(1).maybeSingle();

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
            show_qr: data.show_qr !== false,
            surface_color: data.surface_color ?? "",
            background_effect: data.background_effect ?? "none",
            intro_style: data.intro_style ?? "rise",
            button_style: data.button_style ?? "default",
            published: data.published !== false,
            location: data.location ?? "",
            accent_color: data.accent_color ?? "#111111",
            template: data.template ?? "minimal",
            font: data.font ?? "sans",
            is_single_purpose: data.is_single_purpose ?? false,
          }
        : null;

      if (data) {
        setCardId(data.id);
        setApproval({
          status: data.approval_status ?? "approved",
          fee: data.approval_fee_pkr ?? null,
          note: data.approval_note ?? null,
        });
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

      // Typing that never made it to "save changes" — a tab closed, a call
      // came in, the browser back button. Only trusted if it postdates the
      // row actually on the server (loadEditDraft checks that), so a stale
      // local copy from another device can never roll a real save backwards.
      const localEdits = !draft
        ? loadEditDraft(editDraftKey(requestedCardId), data?.updated_at ?? null)
        : null;

      if (draft) {
        setForm({ ...draft.form, username: saved?.username ?? draft.form.username });
        setButtons(draft.buttons);
        setGallery(draft.gallery ?? []);
        setExtras({ ...EMPTY_EXTRAS, ...(draft.extras ?? {}) });
        setDraftApplied(true);
      } else if (localEdits) {
        setForm({ ...localEdits.form, template: presetTemplate ?? localEdits.form.template });
        setButtons(localEdits.buttons);
        setGallery(localEdits.gallery ?? []);
        setExtras({ ...EMPTY_EXTRAS, ...(localEdits.extras ?? {}) });
        setLocalEditsRestored(true);
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
  }, [requestedCardId]);

  // Autosaves as they type, so the work above has somewhere to come back
  // from. Gated on `loading`: without it, this fires once on mount with the
  // empty initial state and immediately stomps whatever load() is about to
  // restore.
  useEffect(() => {
    if (loading || !authed) return;
    saveEditDraft(editDraftKey(requestedCardId), { form, buttons, gallery, extras });
  }, [form, buttons, gallery, extras, loading, authed, requestedCardId]);

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
  const profileUrl = cardLinkUrl(previewCard, origin);

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
      const isFirstPublish = !cardId && data.published !== false;
      setCardId(data.id);
      setSaved(true);
      // Published — the local draft has served its purpose.
      clearDraft();
      setDraftApplied(false);
      // The server now matches what was just typed, so the local safety net
      // for *this* slot is stale by definition — clearing it stops a later
      // visit from restoring edits that are already saved (or, worse, from
      // reverting a save made from another device after this one).
      clearEditDraft(editDraftKey(requestedCardId));
      setLocalEditsRestored(false);

      // Tell them, on the page, that it worked — only on the first publish:
      // doing it on every save would interrupt someone editing a line.
      if (isFirstPublish) {
        setJustPublished({
          url: `${window.location.origin}/u/${data.username}`,
          username: data.username,
        });
      }

      // Ask which physical card they want, once, while the card is live.
      // Held back while the "published!" panel is still up so the two don't
      // both compete for the first thing the customer sees; asked
      // immediately on a later save (no publish panel in the way), and only
      // if it's still unanswered — never once they have chosen.
      if (data.published !== false && !data.nfc_finish) {
        if (isFirstPublish) {
          setPendingNfcAsk(data.id);
        } else {
          setAskNfcFor(data.id);
        }
      }
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-sc-gold-text" />
      </div>
    );
  }

  return (
    <div className="grid max-w-6xl gap-10 pb-20 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      <div className="min-w-0">
      <h1 className="app-h1 text-4xl">
        my <span className="text-sc-gold-text">card.</span>
      </h1>
      <p className="app-sub mt-2">
        This is what opens when someone taps your NFC card.
      </p>

      {cardId && form.username && (
        <Link
          href={`/u/${form.username}`}
          target="_blank"
          className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-sc-gold px-4 py-2 text-sm font-black text-sc-gold-text transition-colors hover:bg-sc-gold hover:text-sc-gold-ink"
        >
          <ExternalLink className="h-4 w-4" />
          /u/{form.username}
        </Link>
      )}

      {justPublished && (
        <div className="mt-6 rounded-2xl border-2 border-sc-gold/40 bg-sc-gold/5 p-5">
          <p className="font-black text-sc-text">Your card is live.</p>
          <p className="mt-1 text-sm font-semibold text-sc-text-dim">
            Share it now, or tap it any time from your dashboard.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={async () => {
                if (typeof navigator !== "undefined" && navigator.share) {
                  try {
                    await navigator.share({ title: "My digital card", url: justPublished.url });
                    return;
                  } catch {
                    // Cancelled or unsupported — fall through to copy.
                  }
                }
                try {
                  await navigator.clipboard.writeText(justPublished.url);
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 1800);
                } catch {
                  // Clipboard needs a secure context; nothing useful to do beyond this.
                }
              }}
              className="app-btn app-btn-primary rounded-full px-5"
            >
              {linkCopied ? <Check className="h-4 w-4" strokeWidth={3} /> : <ArrowRight className="h-4 w-4" />}
              {linkCopied ? "Link copied" : "Share your card"}
            </button>
            <Link
              href={`/u/${justPublished.username}`}
              target="_blank"
              className="app-btn app-btn-ghost rounded-full"
            >
              <ExternalLink className="h-4 w-4" />
              View it live
            </Link>
            <button
              type="button"
              onClick={() => {
                setJustPublished(null);
                // Held back until now — see the comment where pendingNfcAsk
                // is set, in handleSave.
                if (pendingNfcAsk) {
                  setAskNfcFor(pendingNfcAsk);
                  setPendingNfcAsk(null);
                }
              }}
              className="ml-auto text-xs font-bold uppercase tracking-widest text-sc-text-dimmer hover:text-sc-text-dim"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {draftApplied && (
        <div className="mt-6 rounded-2xl border-2 border-sc-gold/40 bg-sc-gold/5 p-5">
          <p className="font-black text-sc-text">We picked up where you left off.</p>
          <p className="mt-1 text-sm font-semibold text-sc-text-dim">
            Choose a username below, then publish to put your card live.
          </p>
        </div>
      )}

      {localEditsRestored && (
        <div className="mt-6 rounded-2xl border-2 border-sc-gold/40 bg-sc-gold/5 p-5">
          <p className="font-black text-sc-text">We restored your unsaved changes.</p>
          <p className="mt-1 text-sm font-semibold text-sc-text-dim">
            You had edits that never made it to &quot;save changes&quot; last time —
            they&apos;re back below.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border-2 border-sc-error/40 bg-sc-error/10 px-4 py-3 text-sm font-bold text-sc-error">
          {error}
        </div>
      )}

      {cardId && approval.status !== "approved" && (
        <div className="mt-6">
          <CardFeePanel
            cardId={cardId}
            status={approval.status}
            fee={approval.fee}
            note={approval.note}
            onSubmitted={() =>
              setApproval((prev) => ({ ...prev, status: "awaiting_review" }))
            }
          />
        </div>
      )}

      <form onSubmit={handleSave} className="mt-8 space-y-8">
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
          showUsername
          // Locked once saved — except for a card the "new card" quick-add
          // button just created, which starts with an auto-generated
          // "new-card-xxxxxx" placeholder nobody actually chose. Matches
          // the same carve-out in the lock_username() DB trigger
          // (056_allow_first_username_after_quick_create.sql) — the UI and
          // the trigger need to agree on this, or unlocking the field here
          // alone would just mean the save fails with the trigger's error
          // instead.
          lockUsername={Boolean(cardId) && !/^new-card-[a-z0-9]{1,8}$/.test(form.username)}
        />

        <button
          type="submit"
          disabled={saving}
          className="app-btn app-btn-primary h-14 w-full text-base"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : saved ? (
            <>
              <Check className="mr-2 h-5 w-5" strokeWidth={3.5} />
              saved
            </>
          ) : cardId ? (
            "save changes"
          ) : form.published ? (
            "publish my card"
          ) : (
            "save as draft"
          )}
        </button>

        {/* Draft vs live. The column and the RLS policy already enforce this —
            an unpublished card is not readable by anyone but its owner — there
            was simply no way to set it. */}
        {/* The moment the page exists is the moment the card makes sense.
            Before this, nothing in the dashboard showed the physical product
            at all, so the free page was the whole of what people saw. */}
        {cardId && form.published !== false && (
          <Link
            href="/dashboard/nfc"
            className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-sc-gold/40 bg-sc-gold/5 p-4 transition-colors hover:border-sc-gold"
          >
            <Nfc className="h-6 w-6 shrink-0 text-sc-gold-text" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black uppercase tracking-tight text-sc-text">
                put this on a real card
              </span>
              <span className="mt-0.5 block text-xs font-bold text-sc-text-dim">
                Blank from Rs.1,600, your design from Rs.2,200 — see both
              </span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-sc-gold-text" />
          </Link>
        )}

        {cardId && !saved && (
          <p className="mt-3 rounded-xl border-2 border-sc-warning/30 bg-sc-warning/5 px-4 py-3 text-center text-[13px] font-black uppercase tracking-widest text-sc-warning">
            unsaved changes
          </p>
        )}

        <div className="mt-3 app-panel app-panel-pad">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={form.published !== false}
              onChange={(e) => updateForm({ published: e.target.checked })}
              className="mt-0.5 h-4 w-4 accent-sc-gold"
            />
            <span className="min-w-0">
              <span className="block text-sm font-black text-sc-text">
                {form.published !== false ? "Live" : "Draft"}
              </span>
              <span className="mt-0.5 block text-xs font-semibold text-sc-text-dim">
                {form.published !== false
                  ? "Anyone with your link or your card can open it."
                  : "Only you can see it. Your link and NFC card will not open for anyone else until you publish."}
              </span>
            </span>
          </label>
        </div>

        {cardId && (
          <div className="mt-3">
            <DeleteCardButton
              cardId={cardId}
              username={form.username}
              onDeleted={() => {
                setCardId(null);
                setForm(EMPTY_CARD_FORM);
                setSaved(false);
              }}
            />
          </div>
        )}
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

      {askNfcFor && (
        <NfcFormatPrompt
          card={previewCard}
          cardId={askNfcFor}
          onDone={() => setAskNfcFor(null)}
        />
      )}
    </div>
  );
}

// useSearchParams() suspends, so the editor needs a boundary above it.
export default function MyCardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-sc-gold-text" />
        </div>
      }
    >
      <MyCardEditor />
    </Suspense>
  );
}
