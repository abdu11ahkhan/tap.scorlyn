"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Check, Loader2, X } from "lucide-react";
import {
  KIND_LABELS,
  resolveButtonsForPreview,
  resolveGallery,
  type CardButton,
} from "@/lib/card";
import { EMPTY_CARD_FORM, draftToCardProfile, saveDraft, type CardForm } from "@/lib/card-draft";
import { downscale } from "@/components/card-editor/ImagePicker";
import { extractPalette, suggestTemplate, type CardVibe } from "@/lib/card-scan-color";
import { scanCardText, type ScanFields, type ScanLine } from "@/lib/card-ocr";
import { renderCardTemplate } from "@/components/card-templates";
import DevicePreview from "@/components/card-editor/DevicePreview";

type Stage = "capture" | "scanning" | "review";

/** A field the review screen shows: what OCR guessed, editable, with the
 *  source line kept around so the guess is visible rather than presented as
 *  fact — see the "never trusted silently" note in card-ocr.ts. */
function fieldValue(line: ScanLine | null): string {
  return line?.text ?? "";
}

function normalizeWebsite(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export default function ScanCardPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("capture");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>("");
  const [backPreview, setBackPreview] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [fields, setFields] = useState<ScanFields | null>(null);
  const [vibe, setVibe] = useState<CardVibe | null>(null);
  const [template, setTemplate] = useState("minimal");

  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  const pickFile = async (file: File, side: "front" | "back") => {
    const url = URL.createObjectURL(file);
    if (side === "front") {
      setFrontFile(file);
      setFrontPreview(url);
    } else {
      setBackFile(file);
      setBackPreview(url);
    }
  };

  const runScan = async () => {
    if (!frontFile) return;
    setStage("scanning");
    setError(null);

    try {
      // Same resize used for every other picked photo (ImagePicker.tsx) —
      // OCR wants a reasonably sized image, no reason for a second resizer.
      const frontBlob = await downscale(frontFile, "cover");
      const backBlob = backFile ? await downscale(backFile, "cover") : null;

      const frontBitmap = await createImageBitmap(frontBlob);
      const derivedVibe = extractPalette(frontBitmap);
      frontBitmap.close?.();

      const images = backBlob ? [frontBlob, backBlob] : [frontBlob];
      const extracted = await scanCardText(images);

      const suggested = suggestTemplate(derivedVibe);

      setFields(extracted);
      setVibe(derivedVibe);
      setTemplate(suggested);
      setName(fieldValue(extracted.full_name));
      setHeadline(fieldValue(extracted.headline));
      setCompany(fieldValue(extracted.company));
      setPhone(fieldValue(extracted.phone));
      setEmail(fieldValue(extracted.email));
      setWebsite(fieldValue(extracted.website));
      setStage("review");

      if (!extracted.ok) {
        setError(
          "Couldn't read that image automatically — the fields below are blank, but you can still type them in and continue."
        );
      }
    } catch {
      setError("Something went wrong reading that photo. You can still enter details manually.");
      setFields({
        full_name: null,
        headline: null,
        company: null,
        phone: null,
        email: null,
        website: null,
        allLines: [],
        ok: false,
      });
      setVibe(null);
      setStage("review");
    }
  };

  const buttons: CardButton[] = useMemo(() => {
    const list: CardButton[] = [];
    if (phone.trim()) list.push({ label: KIND_LABELS.phone, kind: "phone", value: phone.trim() });
    if (email.trim()) list.push({ label: KIND_LABELS.email, kind: "email", value: email.trim() });
    if (website.trim())
      list.push({ label: "Website", kind: "link", value: normalizeWebsite(website) });
    return list;
  }, [phone, email, website]);

  const form: CardForm = useMemo(
    () => ({
      ...EMPTY_CARD_FORM,
      full_name: name.trim(),
      headline: headline.trim(),
      company: company.trim(),
      template,
      accent_color: vibe?.accent ?? EMPTY_CARD_FORM.accent_color,
      surface_color: vibe?.surface ?? "",
    }),
    [name, headline, company, template, vibe]
  );

  const previewCard = useMemo(
    () => draftToCardProfile(form, buttons, resolveGallery([])),
    [form, buttons]
  );
  const previewButtons = useMemo(() => resolveButtonsForPreview(buttons), [buttons]);

  const useThisCard = () => {
    saveDraft({ form, buttons, gallery: [], extras: {} });
    router.push(`/templates/${template}/edit`);
  };

  return (
    <div className="grain relative min-h-screen bg-ink text-white">
      <div className="float-orb pointer-events-none absolute -left-40 top-40 h-[460px] w-[460px] rounded-full bg-violet-pop/15 blur-[140px]" />

      <header className="sticky top-0 z-30 border-b-2 border-white/10 bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/templates"
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border-2 border-white/20 px-4 text-sm font-black lowercase text-white/70 transition-colors hover:border-acid hover:text-acid"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">templates</span>
          </Link>
          <p className="text-sm font-black lowercase text-white/70">scan a card</p>
          <span className="w-11 shrink-0" />
        </div>
      </header>

      <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {stage === "capture" && (
          <div className="mx-auto max-w-lg">
            <h1 className="text-3xl font-black tracking-tighter sm:text-4xl">
              got a card <span className="text-acid">already?</span>
            </h1>
            <p className="mt-3 text-[15px] font-semibold text-white/60">
              Photograph it and we&apos;ll read the details onto a digital card —
              nothing is saved until you review and confirm it.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <PhotoSlot
                label="front (required)"
                preview={frontPreview}
                onPick={(f) => pickFile(f, "front")}
                onClear={() => {
                  setFrontFile(null);
                  setFrontPreview("");
                }}
              />
              <PhotoSlot
                label="back (optional)"
                preview={backPreview}
                onPick={(f) => pickFile(f, "back")}
                onClear={() => {
                  setBackFile(null);
                  setBackPreview("");
                }}
              />
            </div>

            {error && (
              <p className="mt-4 rounded-xl border-2 border-hotpink bg-hotpink/10 px-4 py-3 text-sm font-bold text-hotpink">
                {error}
              </p>
            )}

            <button
              onClick={runScan}
              disabled={!frontFile}
              className="sticker sticker-press mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-acid text-base font-black uppercase tracking-tight text-ink disabled:opacity-40"
            >
              read this card
            </button>

            <Link
              href="/templates"
              className="mt-4 block text-center text-[13px] font-black uppercase tracking-widest text-white/40"
            >
              or start blank instead
            </Link>
          </div>
        )}

        {stage === "scanning" && (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-acid" />
            <p className="text-[15px] font-bold text-white/70">Reading the card…</p>
            <p className="max-w-xs text-sm text-white/40">
              This runs right here in your browser — nothing leaves your device
              for this step. Usually takes a few seconds.
            </p>
          </div>
        )}

        {stage === "review" && fields && (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tighter sm:text-3xl">
                does this look right?
              </h1>
              <p className="mt-2 text-sm font-semibold text-white/50">
                We read these off the photo — check them over, anything can be
                fixed here or later.
              </p>

              {error && (
                <p className="mt-4 rounded-xl border-2 border-hotpink bg-hotpink/10 px-4 py-3 text-sm font-bold text-hotpink">
                  {error}
                </p>
              )}

              <div className="mt-6 space-y-4">
                <ReviewField label="full name" value={name} onChange={setName} />
                <ReviewField label="headline / title" value={headline} onChange={setHeadline} />
                <ReviewField label="company" value={company} onChange={setCompany} />
                <ReviewField label="phone" value={phone} onChange={setPhone} />
                <ReviewField label="email" value={email} onChange={setEmail} type="email" />
                <ReviewField label="website" value={website} onChange={setWebsite} />
              </div>

              <p className="mt-6 text-xs font-semibold text-white/40">
                Suggested look:{" "}
                <span className="font-black text-white/70">{template}</span>, coloured
                from the photo. Everything — including the template — can be changed
                on the next screen.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={useThisCard}
                  disabled={!name.trim()}
                  className="sticker sticker-press flex h-14 flex-1 items-center justify-center gap-2 rounded-full border-2 border-ink bg-acid text-base font-black uppercase tracking-tight text-ink disabled:opacity-40"
                >
                  <Check className="h-4 w-4" />
                  use this
                </button>
                <button
                  onClick={() => setStage("capture")}
                  className="flex h-14 items-center justify-center gap-2 rounded-full border-2 border-white/20 px-5 text-sm font-black uppercase tracking-tight text-white/70"
                >
                  rescan
                </button>
              </div>
            </div>

            <div className="min-w-0 lg:sticky lg:top-28">
              <DevicePreview>{renderCardTemplate({ card: previewCard, buttons: previewButtons })}</DevicePreview>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PhotoSlot({
  label,
  preview,
  onPick,
  onClear,
}: {
  label: string;
  preview: string;
  onPick: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <label className="relative flex aspect-[16/10] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.02] text-center transition-colors hover:border-acid/60">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
        }}
      />
      {preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="absolute inset-0 h-full w-full rounded-2xl object-cover" />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onClear();
            }}
            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-ink/80 text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <Camera className="h-6 w-6 text-white/40" />
          <span className="text-xs font-black uppercase tracking-widest text-white/40">
            {label}
          </span>
        </>
      )}
    </label>
  );
}

function ReviewField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wide text-white/50">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl border-2 border-white/15 bg-white/[0.03] px-4 text-[15px] font-semibold text-white outline-none focus:border-acid"
      />
    </div>
  );
}
