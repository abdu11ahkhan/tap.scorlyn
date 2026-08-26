"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Loader2 } from "lucide-react";
import { setHouseStyle } from "@/app/dashboard/team/actions";
import { downscale } from "@/components/card-editor/ImagePicker";
import { extractPalette, suggestTemplate } from "@/lib/card-scan-color";

/**
 * Sets the look new employee cards start from — read from a photo of the
 * company's own card, not typed in. Deliberately no OCR here (see
 * src/lib/card-ocr.ts / card-scan-color.ts): only the photo's colours and
 * mood matter for this, not its text.
 *
 * Shared between /dashboard/team (an established company changing its look)
 * and /onboarding/company-setup (a brand-new corporate account setting it
 * for the first time) — one implementation, so the two can't drift.
 */
export default function HouseStyleSection({
  houseTemplate,
  houseAccentColor,
  onError,
  onSaved,
}: {
  houseTemplate: string | null;
  houseAccentColor: string | null;
  onError: (message: string | null) => void;
  /** Called after a successful save. Defaults to router.refresh() — pass
   *  this to advance an onboarding step instead. */
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ template: string; accent: string; surface: string } | null>(
    null
  );

  const pick = async (file: File) => {
    setBusy(true);
    onError(null);
    try {
      const blob = await downscale(file, "cover");
      const bitmap = await createImageBitmap(blob);
      const vibe = extractPalette(bitmap);
      bitmap.close?.();
      setPreview({ template: suggestTemplate(vibe), accent: vibe.accent, surface: vibe.surface });
    } catch {
      onError("Couldn't read that photo — try a clearer, better-lit shot of the card.");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!preview) return;
    setBusy(true);
    const r = await setHouseStyle({
      template: preview.template,
      accentColor: preview.accent,
      surfaceColor: preview.surface,
    });
    setBusy(false);
    if (!r.ok) {
      onError(r.error ?? "That didn't save.");
      return;
    }
    setPreview(null);
    if (onSaved) onSaved();
    else router.refresh();
  };

  return (
    <div className="app-panel app-panel-pad space-y-3">
      <div>
        <p className="text-sm font-black text-sc-text">Company card</p>
        <p className="mt-1 text-xs font-semibold text-sc-text-dim">
          {houseTemplate ? (
            <>
              New employee cards start as{" "}
              <span className="font-black text-sc-text">{houseTemplate}</span>, coloured from
              your card. Upload a new photo any time to change it — only affects employees
              added afterward.
            </>
          ) : (
            "Photograph your company's card once to set the default look every new employee card starts from."
          )}
        </p>
      </div>

      {houseAccentColor && !preview && (
        <span
          className="inline-block h-6 w-6 rounded-full border-2 border-sc-border"
          style={{ background: houseAccentColor }}
        />
      )}

      {preview ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-sc-gold/30 bg-sc-gold/5 p-3">
          <span className="h-8 w-8 shrink-0 rounded-full border-2 border-sc-border" style={{ background: preview.accent }} />
          <p className="min-w-0 flex-1 text-xs font-semibold text-sc-text-dim">
            Looks like <span className="font-black text-sc-text">{preview.template}</span>
          </p>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sc-gold px-4 text-xs font-black uppercase tracking-tight text-sc-gold-ink disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            use this
          </button>
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="text-xs font-black uppercase tracking-widest text-sc-text-dimmer"
          >
            cancel
          </button>
        </div>
      ) : (
        <label className="flex h-12 w-fit cursor-pointer items-center gap-2 rounded-full border-2 border-sc-border px-4 text-xs font-black uppercase tracking-tight text-sc-text transition-colors hover:border-sc-gold hover:text-sc-gold-text">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) pick(file);
            }}
          />
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {houseTemplate ? "change the look" : "photograph company card"}
        </label>
      )}
    </div>
  );
}
