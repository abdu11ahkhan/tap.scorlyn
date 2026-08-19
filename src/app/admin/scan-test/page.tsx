"use client";

/**
 * Admin's own window into the card-scan pipeline (src/lib/card-ocr.ts,
 * src/lib/card-scan-color.ts) — the same OCR and colour extraction
 * /templates/scan runs for a new signup, but with the working shown rather
 * than hidden behind a clean review screen.
 *
 * Two things this is for, matching what was asked:
 *   - upload: confirm the pipeline still behaves on a real card before
 *     pointing a customer at it, or build a card for someone from their photo
 *     the same way the public flow would.
 *   - test: see exactly what got read, how confident each line was, and
 *     which line lost out to which — the "why didn't this work" view that
 *     the customer-facing review screen deliberately doesn't surface.
 *
 * No account, draft or publish happens here unless "open in editor" is
 * pressed — everything above that is read-only inspection.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ExternalLink, Loader2, X } from "lucide-react";
import { KIND_LABELS, resolveButtonsForPreview, resolveGallery, type CardButton } from "@/lib/card";
import { EMPTY_CARD_FORM, draftToCardProfile, saveDraft, type CardForm } from "@/lib/card-draft";
import { downscale } from "@/components/card-editor/ImagePicker";
import { extractPalette, suggestTemplate, type CardVibe } from "@/lib/card-scan-color";
import { scanCardText, type ScanFields, type ScanLine } from "@/lib/card-ocr";
import { renderCardTemplate } from "@/components/card-templates";
import DevicePreview from "@/components/card-editor/DevicePreview";

function normalizeWebsite(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export default function AdminScanTest() {
  const router = useRouter();
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState("");
  const [backPreview, setBackPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  const [fields, setFields] = useState<ScanFields | null>(null);
  const [vibe, setVibe] = useState<CardVibe | null>(null);
  const [template, setTemplate] = useState("minimal");

  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  const pickFile = (file: File, side: "front" | "back") => {
    const url = URL.createObjectURL(file);
    if (side === "front") {
      setFrontFile(file);
      setFrontPreview(url);
    } else {
      setBackFile(file);
      setBackPreview(url);
    }
  };

  const run = async () => {
    if (!frontFile) return;
    setBusy(true);
    setError(null);
    setFields(null);
    setVibe(null);
    const started = performance.now();

    try {
      const frontBlob = await downscale(frontFile, "scan");
      const backBlob = backFile ? await downscale(backFile, "scan") : null;

      const frontBitmap = await createImageBitmap(frontBlob);
      const derivedVibe = extractPalette(frontBitmap);
      frontBitmap.close?.();

      const images = backBlob ? [frontBlob, backBlob] : [frontBlob];
      const extracted = await scanCardText(images);
      const suggested = suggestTemplate(derivedVibe);

      setFields(extracted);
      setVibe(derivedVibe);
      setTemplate(suggested);
      setName(extracted.full_name?.text ?? "");
      setHeadline(extracted.headline?.text ?? "");
      setCompany(extracted.company?.text ?? "");
      setPhone(extracted.phone?.text ?? "");
      setEmail(extracted.email?.text ?? "");
      setWebsite(extracted.website?.text ?? "");

      if (!extracted.ok) {
        setError("OCR reported a failure (bad image, or the worker didn't load) — see console for detail.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something threw during scanning — see console.");
    } finally {
      setElapsedMs(Math.round(performance.now() - started));
      setBusy(false);
    }
  };

  const buttons: CardButton[] = useMemo(() => {
    const list: CardButton[] = [];
    if (phone.trim()) list.push({ label: KIND_LABELS.phone, kind: "phone", value: phone.trim() });
    if (email.trim()) list.push({ label: KIND_LABELS.email, kind: "email", value: email.trim() });
    if (website.trim()) list.push({ label: "Website", kind: "link", value: normalizeWebsite(website) });
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

  const previewCard = useMemo(() => draftToCardProfile(form, buttons, resolveGallery([])), [form, buttons]);
  const previewButtons = useMemo(() => resolveButtonsForPreview(buttons), [buttons]);

  const openInEditor = () => {
    saveDraft({ form, buttons, gallery: [], extras: {} });
    router.push(`/templates/${template}/edit`);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="app-h1">Scan test</h1>
        <p className="app-sub mt-1 max-w-2xl">
          Runs the same OCR and colour pipeline a signup does (
          <code className="text-acid">src/lib/card-ocr.ts</code>,{" "}
          <code className="text-acid">src/lib/card-scan-color.ts</code>), with the raw
          detections shown rather than hidden. Nothing is saved unless you open the
          result in the editor.
        </p>
      </div>

      <div className="app-panel app-panel-pad space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
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

        <button
          onClick={run}
          disabled={!frontFile || busy}
          className="app-btn app-btn-primary disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {busy ? "scanning…" : "run scan"}
        </button>

        {error && (
          <p className="rounded-xl border-2 border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm font-bold text-rose-200">
            {error}
          </p>
        )}
      </div>

      {fields && vibe && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-5">
            {/* The diagnostic view — every line OCR found, what it was worth
                in height/confidence, and which field (if any) claimed it. */}
            <div className="app-panel app-panel-pad">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-black text-white">Raw OCR lines</p>
                <p className="text-xs font-semibold text-white/40">
                  {fields.allLines.length} found
                  {elapsedMs !== null && ` · ${elapsedMs}ms`}
                </p>
              </div>
              <div className="mt-3 space-y-1.5">
                {fields.allLines.length === 0 && (
                  <p className="text-xs text-white/40">Nothing detected.</p>
                )}
                {fields.allLines
                  .slice()
                  .sort((a, b) => b.height - a.height)
                  .map((line, i) => (
                    <LineRow key={i} line={line} tag={tagFor(line, fields)} />
                  ))}
              </div>
            </div>

            <div className="app-panel app-panel-pad">
              <p className="text-sm font-black text-white">Derived colour</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-white/60">
                <Swatch label="accent" hex={vibe.accent} />
                <Swatch label="surface" hex={vibe.surface} />
                <span>{vibe.dark ? "dark" : "light"}</span>
                <span>{vibe.vivid ? "vivid" : "muted"}</span>
                <span>
                  → suggested{" "}
                  <span className="font-black text-acid">{template}</span>
                </span>
              </div>
            </div>

            <div className="app-panel app-panel-pad space-y-3">
              <p className="text-sm font-black text-white">Fields (editable before opening)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="full name" value={name} onChange={setName} />
                <Field label="headline" value={headline} onChange={setHeadline} />
                <Field label="company" value={company} onChange={setCompany} />
                <Field label="phone" value={phone} onChange={setPhone} />
                <Field label="email" value={email} onChange={setEmail} />
                <Field label="website" value={website} onChange={setWebsite} />
              </div>
              <button
                onClick={openInEditor}
                disabled={!name.trim()}
                className="app-btn app-btn-primary disabled:opacity-50"
              >
                <ExternalLink className="h-4 w-4" />
                open in editor
              </button>
            </div>
          </div>

          <div className="min-w-0 lg:sticky lg:top-6">
            <DevicePreview>{renderCardTemplate({ card: previewCard, buttons: previewButtons })}</DevicePreview>
          </div>
        </div>
      )}
    </div>
  );
}

/** Which field, if any, ended up with this exact line — read straight off
 *  the ScanFields result rather than re-guessing, so this can never disagree
 *  with what the pipeline actually decided. */
function tagFor(line: ScanLine, fields: ScanFields): string | null {
  if (fields.email === line) return "email";
  if (fields.phone === line) return "phone";
  if (fields.website === line) return "website";
  if (fields.full_name === line) return "name";
  if (fields.headline === line) return "headline";
  if (fields.company === line) return "company";
  return null;
}

function LineRow({ line, tag }: { line: ScanLine; tag: string | null }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
      <span className="min-w-0 flex-1 truncate font-semibold text-white/80">{line.text}</span>
      <span className="shrink-0 font-mono text-white/35">h{Math.round(line.height)}</span>
      <span className="shrink-0 font-mono text-white/35">{Math.round(line.confidence)}%</span>
      {tag && (
        <span className="shrink-0 rounded-full bg-acid/15 px-2 py-0.5 font-black uppercase tracking-tight text-acid">
          {tag}
        </span>
      )}
    </div>
  );
}

function Swatch({ label, hex }: { label: string; hex: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-4 w-4 rounded-full border border-white/20" style={{ background: hex }} />
      {label} <span className="font-mono text-white/40">{hex}</span>
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wide text-white/50">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="app-input" />
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
    <label className="relative flex aspect-[16/10] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] text-center transition-colors hover:border-acid/60">
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
          <Camera className="h-6 w-6 text-white/30" />
          <span className="text-xs font-black uppercase tracking-widest text-white/40">{label}</span>
        </>
      )}
    </label>
  );
}
