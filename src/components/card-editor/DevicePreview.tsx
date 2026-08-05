"use client";

import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import IframeStage from "./IframeStage";

export type Device = "mobile" | "desktop";

/**
 * Live preview with a device toggle.
 *
 * Several templates change shape at `md:` — Split goes side-by-side, Stack and
 * Agency lay out wider — so a phone-only preview hid half of what people were
 * choosing. Desktop renders at a real 1280px width and is scaled down to fit,
 * which is the one place scaling is worth the softness: it's the only way to
 * show a desktop layout inside a sidebar.
 */
const FRAMES: Record<Device, { w: number; h: number; scale: number; label: string }> = {
  mobile: { w: 390, h: 720, scale: 1, label: "mobile" },
  desktop: { w: 1280, h: 800, scale: 0.32, label: "desktop" },
};

export default function DevicePreview({
  children,
  device,
  onDeviceChange,
}: {
  children: React.ReactNode;
  device?: Device;
  onDeviceChange?: (device: Device) => void;
}) {
  const [internal, setInternal] = useState<Device>("mobile");
  const active = device ?? internal;
  const setActive = onDeviceChange ?? setInternal;

  const frame = FRAMES[active];

  return (
    <div>
      {/* Toggle */}
      <div className="mx-auto mb-4 flex w-fit gap-1 rounded-full border-2 border-white/15 bg-white/[0.04] p-1">
        {(Object.keys(FRAMES) as Device[]).map((key) => {
          const Icon = key === "mobile" ? Smartphone : Monitor;
          const isActive = key === active;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              aria-pressed={isActive}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black lowercase transition-colors ${
                isActive ? "bg-acid text-ink" : "text-white/50 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {FRAMES[key].label}
            </button>
          );
        })}
      </div>

      <div
        className={`mx-auto w-fit border-2 border-ink bg-white/[0.04] p-3 shadow-[7px_7px_0_0_theme(colors.hotpink)] ${
          active === "mobile" ? "rounded-[2.2rem]" : "rounded-2xl"
        }`}
      >
        <div
          className={`relative overflow-hidden bg-black ${
            active === "mobile" ? "rounded-[1.6rem]" : "rounded-lg"
          }`}
          style={{
            width: `${frame.w * frame.scale}px`,
            height: `${frame.h * frame.scale}px`,
          }}
        >
          {/* An iframe, not a div: media queries resolve against the viewport,
              so a narrow container would still match `md:` and show desktop
              layouts under a "mobile" label. */}
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{ transform: `scale(${frame.scale})` }}
          >
            <IframeStage width={frame.w} height={frame.h}>
              {children}
            </IframeStage>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] font-black uppercase tracking-widest text-white/35">
        live preview · {frame.label}
      </p>
    </div>
  );
}
