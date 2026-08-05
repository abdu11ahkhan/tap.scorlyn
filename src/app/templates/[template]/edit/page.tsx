"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Lock, Upload, Eye, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  resolveButtonsForPreview,
  resolveGallery,
  TEMPLATE_IDS,
  type CardButton,
  type GalleryItem,
} from "@/lib/card";
import {
  EMPTY_CARD_FORM,
  draftToCardProfile,
  loadDraft,
  saveDraft,
  type CardForm,
} from "@/lib/card-draft";
import { renderCardTemplate } from "@/components/card-templates";
import CardEditorFields from "@/components/card-editor/CardEditorFields";
import DevicePreview from "@/components/card-editor/DevicePreview";
import CardDesigner from "@/components/card-design/CardDesigner";

/** Sensible starting buttons so the preview isn't empty on first load. */
const STARTER_BUTTONS: CardButton[] = [
  { label: "WhatsApp", kind: "whatsapp", value: "" },
  { label: "Email", kind: "email", value: "" },
];

export default function PublicCardEditor({
  params,
}: {
  params: Promise<{ template: string }>;
}) {
  const { template } = use(params);
  const router = useRouter();

  const [form, setForm] = useState<CardForm>({ ...EMPTY_CARD_FORM, template });
  const [buttons, setButtons] = useState<CardButton[]>(STARTER_BUTTONS);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [ready, setReady] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");

  const isKnownTemplate = TEMPLATE_IDS.includes(template as (typeof TEMPLATE_IDS)[number]);

  // Pick up any work from a previous visit, but honour the template just picked.
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setForm({ ...draft.form, template: isKnownTemplate ? template : draft.form.template });
      setButtons(draft.buttons.length ? draft.buttons : STARTER_BUTTONS);
      setGallery(draft.gallery ?? []);
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist as they type so nothing is lost on the trip through login.
  useEffect(() => {
    if (!ready) return;
    saveDraft({ form, buttons, gallery });
  }, [form, buttons, gallery, ready]);

  const updateForm = (patch: Partial<CardForm>) => setForm((prev) => ({ ...prev, ...patch }));

  const previewCard = useMemo(
    () => draftToCardProfile(form, buttons, resolveGallery(gallery)),
    [form, buttons, gallery]
  );
  const previewButtons = useMemo(() => resolveButtonsForPreview(buttons), [buttons]);

  // Whatever host this is served from, so the QR works in dev and production.
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const profileUrl = `${origin}/u/${previewCard.username}`;

  /**
   * Publishing is the only gated step. The draft is already in localStorage, so
   * we just send them to log in and the dashboard editor picks it up after.
   */
  const handlePublish = async () => {
    setPublishing(true);
    saveDraft({ form, buttons, gallery });

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const target = "/dashboard/card?from=draft";
    router.push(user ? target : `/login?next=${encodeURIComponent(target)}`);
  };

  if (!isKnownTemplate) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <p className="text-slate-400">That template doesn&apos;t exist.</p>
        <Link href="/templates" className="text-cyan-400 font-semibold hover:text-cyan-300">
          Browse templates
        </Link>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="grain relative min-h-screen bg-ink text-white">
      <div className="float-orb pointer-events-none absolute -left-40 top-40 h-[460px] w-[460px] rounded-full bg-violet-pop/15 blur-[140px]" />

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b-2 border-white/10 bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/templates"
            className="flex shrink-0 items-center gap-2 rounded-full border-2 border-white/20 px-4 py-2 text-sm font-black lowercase text-white/70 transition-colors hover:border-acid hover:text-acid"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">templates</span>
          </Link>

          <p className="hidden text-xs font-bold text-white/40 md:block">
            editing freely — no account needed until you publish
          </p>

          <button
            onClick={handlePublish}
            disabled={publishing}
            className="sticker sticker-press flex shrink-0 items-center gap-2 rounded-full border-2 border-ink bg-acid px-6 py-3 text-sm font-black uppercase tracking-tight text-ink disabled:opacity-60"
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            publish
          </button>
        </div>

        {/* Mobile edit/preview toggle */}
        <div className="flex border-t-2 border-white/10 lg:hidden">
          {(["edit", "preview"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-black lowercase transition-colors ${
                mobileTab === tab
                  ? "border-b-[3px] border-acid text-acid"
                  : "text-white/40"
              }`}
            >
              {tab === "edit" ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="relative mx-auto grid max-w-7xl items-start gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_400px]">
        {/* Fields */}
        <div className={mobileTab === "edit" ? "" : "hidden lg:block"}>
          <h1 className="mb-7 text-4xl font-black tracking-tighter">
            make it <span className="text-acid">yours.</span>
          </h1>
          <CardEditorFields
            form={form}
            onFormChange={updateForm}
            buttons={buttons}
            onButtonsChange={setButtons}
            gallery={gallery}
            onGalleryChange={setGallery}
            // Username is claimed at publish time, once there's an account.
            showUsername={false}
          />

          <div className="sticker-lg mt-10 flex items-start gap-4 rounded-2xl border-2 border-ink bg-acid p-5 text-ink">
            <Lock className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-[15px] font-black">Your work is saved in this browser.</p>
              <p className="mt-1 text-sm font-semibold opacity-70">
                Hit Publish when you&apos;re ready. You&apos;ll log in once, and your card
                comes with you.
              </p>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className={`lg:sticky lg:top-28 ${mobileTab === "preview" ? "" : "hidden lg:block"}`}>
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
            {/* The real template component, re-rendering as they type. */}
            {renderCardTemplate({ card: previewCard, buttons: previewButtons })}
          </DevicePreview>
        </div>
      </div>
    </div>
  );
}
