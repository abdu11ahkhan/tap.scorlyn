"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area } from "react-easy-crop";
import { Check, Minus, Plus, X } from "lucide-react";

export type CropPreset = { label: string; /** null = the photo's own shape */ aspect: number | null };

/**
 * Full-screen crop step shown after a photo is picked (or when re-cropping
 * one already on the card). Drag to move, pinch or use the slider to zoom.
 * Rendered into <body> so it sits above the editor sheet it is opened from.
 */
export default function ImageCropper({
  src,
  presets,
  round = false,
  onCancel,
  onDone,
}: {
  src: string;
  presets: CropPreset[];
  round?: boolean;
  onCancel: () => void;
  /** Crop rectangle in the photo's own pixels. */
  onDone: (area: Area) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [presetIndex, setPresetIndex] = useState(0);
  const [natural, setNatural] = useState<number | null>(null);
  const [area, setArea] = useState<Area | null>(null);

  const preset = presets[presetIndex];
  const aspect = preset.aspect ?? natural ?? 1;

  useEffect(() => {
    // Capture on window so Escape cancels the crop without also closing the
    // editor sheet underneath, which listens on document.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onCancel();
    };
    window.addEventListener("keydown", onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [onCancel]);

  const onComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  const choosePreset = (i: number) => {
    setPresetIndex(i);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex flex-col bg-[#0b1214]" role="dialog" aria-modal="true" aria-label="Crop photo">
      <div className="flex h-14 shrink-0 items-center gap-2 px-3 pt-[env(safe-area-inset-top)] text-white">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel crop"
          className="flex h-11 w-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <p className="flex-1 text-[15px] font-black">Crop photo</p>
        <button
          type="button"
          onClick={() => area && onDone(area)}
          disabled={!area}
          className="app-btn app-btn-primary min-h-11 disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          Use photo
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          maxZoom={5}
          aspect={aspect}
          cropShape={round ? "round" : "rect"}
          showGrid={!round}
          objectFit="contain"
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onComplete}
          onMediaLoaded={({ naturalWidth, naturalHeight }) => setNatural(naturalWidth / naturalHeight)}
        />
      </div>

      <div className="shrink-0 space-y-4 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 text-white">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}
            aria-label="Zoom out"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="range"
            min={1}
            max={5}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Zoom"
            className="h-11 flex-1 accent-[var(--color-sc-gold)]"
          />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(5, +(z + 0.25).toFixed(2)))}
            aria-label="Zoom in"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {presets.length > 1 && (
          <div className="mx-auto flex max-w-md flex-wrap justify-center gap-2" role="radiogroup" aria-label="Crop shape">
            {presets.map((p, i) => (
              <button
                key={p.label}
                type="button"
                role="radio"
                aria-checked={i === presetIndex}
                onClick={() => choosePreset(i)}
                className={`min-h-11 rounded-full px-4 text-[13px] font-black transition-colors ${
                  i === presetIndex ? "bg-sc-gold text-sc-gold-ink" : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        <p className="text-center text-xs font-semibold text-white/60">Drag to move · pinch or slide to zoom</p>
      </div>
    </div>,
    document.body
  );
}
