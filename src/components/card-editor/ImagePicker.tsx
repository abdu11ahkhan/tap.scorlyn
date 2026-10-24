"use client";

import { useRef, useState } from "react";
import { Crop, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { uploadImage } from "@/lib/upload-image";
import ImageCropper, { type CropPreset } from "./ImageCropper";

/**
 * Pick an image from the device and keep it.
 *
 * Photos used to be a URL field, which quietly assumed the person already had
 * their picture hosted somewhere — almost nobody does. This takes the file off
 * the phone instead.
 *
 * Three things happen before it leaves the browser:
 *
 *  - The person crops it (ImageCropper) — a shape per photo, see CROP.
 *  - It's downscaled and re-encoded. A modern phone photo is 3–6MB and several
 *    thousand pixels wide; nothing here is shown above ~1600px, so sending the
 *    original would be slow on a Pakistani mobile connection for no visible
 *    gain.
 *  - If there's no account yet it stays as a data URL in the draft. The public
 *    editor deliberately works without signing in, so the upload has to wait
 *    for the account rather than forcing one.
 *
 * The upload itself goes browser -> Supabase. Storage policies restrict writes
 * to the signing-in user's own folder, so no elevated key is involved.
 */
// Avatars are drawn up to ~145px CSS, which is ~435px on a 3x phone — and
// several templates use the same image as a full-bleed header. 640 was below
// that on a modern screen, which is what made photos look soft.
//
// "scan" is its own preset, not a reuse of "cover" — the card-scan feature
// (src/lib/card-ocr.ts) was borrowing "cover" for convenience, but OCR wants
// something neither photo preset was tuned for: small printed text needs to
// survive the resize, where a cover photo just needs to look good. Bigger
// and less compressed than "cover" — this image is never stored, only read
// once by Tesseract, so the extra bytes cost nothing.
const MAX_EDGE = { avatar: 1024, cover: 2000, gallery: 1600, scan: 2600 };

/** Higher for the portrait, which is the one people look at closely. */
const QUALITY = { avatar: 0.92, cover: 0.86, gallery: 0.86, scan: 0.95 };

export type ImageKind = keyof typeof MAX_EDGE;

type CropArea = { x: number; y: number; width: number; height: number };

/** Crop shapes offered per photo; the first is the default. */
export type CropStyle = "avatar" | "logo" | "cover" | "gallery";
const CROP: Record<CropStyle, { presets: CropPreset[]; round?: boolean }> = {
  avatar: { presets: [{ label: "Square", aspect: 1 }], round: true },
  logo: { presets: [{ label: "Original", aspect: null }, { label: "Square", aspect: 1 }] },
  cover: {
    presets: [
      { label: "Wide 16:9", aspect: 16 / 9 },
      { label: "3:2", aspect: 3 / 2 },
      { label: "Square", aspect: 1 },
      { label: "Original", aspect: null },
    ],
  },
  gallery: {
    presets: [
      { label: "Original", aspect: null },
      { label: "Square", aspect: 1 },
      { label: "Portrait 4:5", aspect: 4 / 5 },
      { label: "Wide 16:9", aspect: 16 / 9 },
    ],
  },
};

/** Exported for the card-scan flow (src/app/templates/scan/page.tsx), which
 *  resizes a photographed card before running OCR on it — same reasoning as
 *  every other picked photo, no reason for a second implementation. */
export async function downscale(file: Blob, kind: ImageKind, crop?: CropArea): Promise<Blob> {
  let bitmap = await createImageBitmap(file);
  if (crop) {
    // Crop the already-oriented bitmap, so the rectangle (measured on the
    // on-screen, EXIF-rotated photo) means the same thing here.
    const x = Math.max(0, Math.round(crop.x));
    const y = Math.max(0, Math.round(crop.y));
    const w = Math.max(1, Math.min(bitmap.width - x, Math.round(crop.width)));
    const h = Math.max(1, Math.min(bitmap.height - y, Math.round(crop.height)));
    const cropped = await createImageBitmap(bitmap, x, y, w, h);
    bitmap.close?.();
    bitmap = cropped;
  }
  const limit = MAX_EDGE[kind];
  const scale = Math.min(1, limit / Math.max(bitmap.width, bitmap.height));

  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  // Halve at a time down to the target rather than one big jump. Canvas uses a
  // cheap filter for large reductions, so drawing a 4000px photo straight to
  // 640 samples a fraction of the pixels and throws away detail — which is the
  // aliased, soft result people were seeing. Each halving averages neighbours,
  // so the final step lands on an image that is already close to size.
  let source: ImageBitmap | HTMLCanvasElement = bitmap;
  let currentW = bitmap.width;
  let currentH = bitmap.height;

  while (currentW > width * 2 && currentH > height * 2) {
    const halfW = Math.max(width, Math.round(currentW / 2));
    const halfH = Math.max(height, Math.round(currentH / 2));
    const step = document.createElement("canvas");
    step.width = halfW;
    step.height = halfH;
    const stepCtx = step.getContext("2d");
    if (!stepCtx) break;
    stepCtx.imageSmoothingEnabled = true;
    stepCtx.imageSmoothingQuality = "high";
    stepCtx.drawImage(source, 0, 0, halfW, halfH);
    if (source !== bitmap) (source as HTMLCanvasElement).width = 0;
    source = step;
    currentW = halfW;
    currentH = halfH;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that image.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY[kind])
  );
  if (!blob) throw new Error("Could not process that image.");
  return blob;
}

export function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(url: string): Blob {
  const [head, body] = url.split(",", 2);
  const type = head.match(/^data:([^;]+)/)?.[1] ?? "image/jpeg";
  const bytes = head.includes(";base64") ? Uint8Array.from(atob(body), (c) => c.charCodeAt(0)) : new TextEncoder().encode(decodeURIComponent(body));
  return new Blob([bytes], { type });
}

export default function ImagePicker({
  value,
  onChange,
  kind = "avatar",
  crop: cropStyle,
  label,
  hint,
}: {
  value: string;
  onChange: (url: string) => void;
  kind?: Exclude<ImageKind, "scan">;
  /** Which crop shapes to offer; defaults to the one matching `kind`. */
  crop?: CropStyle;
  label: string;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The photo waiting in the crop screen, plus an object URL for showing it.
  const [pending, setPending] = useState<{ blob: Blob; url: string } | null>(null);
  const cropConfig = CROP[cropStyle ?? kind];

  const openCrop = (blob: Blob) => {
    setError(null);
    setPending({ blob, url: URL.createObjectURL(blob) });
  };

  const closeCrop = () => {
    if (pending) URL.revokeObjectURL(pending.url);
    setPending(null);
    if (input.current) input.current.value = "";
  };

  const save = async (area: CropArea) => {
    if (!pending) return;
    const { blob: source } = pending;
    closeCrop();
    setBusy(true);
    try {
      const blob = await downscale(source, kind, area);
      const url = await uploadImage(blob);

      // null means no account yet — carry it in the draft, upload on publish.
      onChange(url ?? (await toDataUrl(blob)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not use that image.");
    } finally {
      setBusy(false);
    }
  };

  // Re-crop the photo already on the card: a draft's data: URL is decoded in
  // place (the CSP's connect-src doesn't allow fetching data: URLs), an
  // uploaded one is fetched back from storage.
  const recrop = async () => {
    setError(null);
    setBusy(true);
    try {
      if (value.startsWith("data:")) {
        openCrop(dataUrlToBlob(value));
        return;
      }
      const res = await fetch(value);
      if (!res.ok) throw new Error();
      openCrop(await res.blob());
    } catch {
      setError("Couldn't open this photo to crop. Choose it again from your phone.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-w-0 space-y-2">
      <p className="text-sm font-bold text-sc-text">{label}</p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-sc-border bg-sc-surface-2 transition-colors hover:border-sc-gold disabled:opacity-60"
          aria-label={value ? `Replace ${label}` : `Choose ${label}`}
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin text-sc-text-dim" />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-5 w-5 text-sc-text-dimmer" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-sc-border px-4 text-sm font-black lowercase text-sc-text-dim transition-colors hover:border-sc-gold hover:text-sc-gold-text disabled:opacity-60"
          >
            <ImagePlus className="h-4 w-4" />
            {busy ? "working…" : value ? "change photo" : "choose photo"}
          </button>

          {hint && !error && (
            <p className="mt-1.5 text-xs text-sc-text-dimmer">{hint}</p>
          )}
          {error && <p className="mt-1.5 text-xs font-semibold text-sc-error">{error}</p>}
        </div>

        {value && !busy && (
          <button
            type="button"
            onClick={() => void recrop()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sc-text-dimmer transition-colors hover:text-sc-gold-text"
            aria-label={`Crop ${label}`}
            title="Crop"
          >
            <Crop className="h-4 w-4" />
          </button>
        )}
        {value && !busy && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sc-text-dimmer transition-colors hover:text-sc-error"
            aria-label={`Remove ${label}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) openCrop(file);
        }}
      />

      {pending && (
        <ImageCropper
          src={pending.url}
          presets={cropConfig.presets}
          round={cropConfig.round}
          onCancel={closeCrop}
          onDone={(area) => void save(area)}
        />
      )}
    </div>
  );
}
