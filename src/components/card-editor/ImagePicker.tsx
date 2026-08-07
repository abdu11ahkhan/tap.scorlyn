"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { uploadImage } from "@/lib/upload-image";

/**
 * Pick an image from the device and keep it.
 *
 * Photos used to be a URL field, which quietly assumed the person already had
 * their picture hosted somewhere — almost nobody does. This takes the file off
 * the phone instead.
 *
 * Two things happen before it leaves the browser:
 *
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
const MAX_EDGE = { avatar: 1024, cover: 2000, gallery: 1600 };

/** Higher for the portrait, which is the one people look at closely. */
const QUALITY = { avatar: 0.92, cover: 0.86, gallery: 0.86 };

export type ImageKind = keyof typeof MAX_EDGE;

async function downscale(file: File, kind: ImageKind): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
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

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(blob);
  });
}

export default function ImagePicker({
  value,
  onChange,
  kind = "avatar",
  label,
  hint,
}: {
  value: string;
  onChange: (url: string) => void;
  kind?: ImageKind;
  label: string;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      const blob = await downscale(file, kind);
      const url = await uploadImage(blob);

      // null means no account yet — carry it in the draft, upload on publish.
      onChange(url ?? (await toDataUrl(blob)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not use that image.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="min-w-0 space-y-2">
      <p className="text-sm font-bold text-white">{label}</p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-white/20 bg-white/[0.04] transition-colors hover:border-acid disabled:opacity-60"
          aria-label={value ? `Replace ${label}` : `Choose ${label}`}
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin text-white/50" />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-5 w-5 text-white/40" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-white/20 px-4 text-sm font-black lowercase text-white/70 transition-colors hover:border-acid hover:text-acid disabled:opacity-60"
          >
            <ImagePlus className="h-4 w-4" />
            {busy ? "working…" : value ? "change photo" : "choose photo"}
          </button>

          {hint && !error && (
            <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
          )}
          {error && <p className="mt-1.5 text-xs font-semibold text-hotpink">{error}</p>}
        </div>

        {value && !busy && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-red-400"
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
          if (file) void pick(file);
        }}
      />
    </div>
  );
}
