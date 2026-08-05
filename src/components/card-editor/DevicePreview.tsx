"use client";

import { useState } from "react";
import { CreditCard, Monitor, Smartphone } from "lucide-react";
import IframeStage from "./IframeStage";

export type Device = "mobile" | "desktop";
type Tab = Device | "card";

/**
 * Live preview with a device toggle.
 *
 * Several templates change shape at `md:` — Split goes side-by-side, Stack and
 * Agency lay out wider — so a phone-only preview hid half of what people were
 * choosing. Desktop renders at a real 1280px width and is scaled down to fit,
 * which is the one place scaling is worth the softness: it's the only way to
 * show a desktop layout inside a sidebar.
 *
 * A third tab appears when `cardView` is supplied: the physical NFC card.
 */
const FRAMES: Record<Device, { w: number; h: number; scale: number; label: string }> = {
  mobile: { w: 390, h: 720, scale: 1, label: "mobile" },
  desktop: { w: 1280, h: 800, scale: 0.32, label: "desktop" },
};

export default function DevicePreview({
  children,
  device,
  onDeviceChange,
  cardView,
}: {
  children: React.ReactNode;
  device?: Device;
  onDeviceChange?: (device: Device) => void;
  /** Optional third tab: the physical NFC card designed from this profile. */
  cardView?: React.ReactNode;
}) {
  const [internal, setInternal] = useState<Device>("mobile");
  const [tab, setTab] = useState<Tab>("mobile");

  const activeDevice = device ?? internal;
  const setDevice = onDeviceChange ?? setInternal;

  const frame = FRAMES[activeDevice];
  const showingCard = tab === "card" && Boolean(cardView);

  const tabs: { key: Tab; label: string; Icon: typeof Monitor }[] = [
    { key: "mobile", label: "mobile", Icon: Smartphone },
    { key: "desktop", label: "desktop", Icon: Monitor },
    ...(cardView
      ? [{ key: "card" as Tab, label: "nfc card", Icon: CreditCard }]
      : []),
  ];

  return (
    <div>
      {/* Toggle */}
      <div className="mx-auto mb-4 flex w-fit gap-1 rounded-full border-2 border-white/15 bg-white/[0.04] p-1">
        {tabs.map(({ key, label, Icon }) => {
          const isActive = key === "card" ? showingCard : !showingCard && key === activeDevice;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTab(key);
                if (key !== "card") setDevice(key);
              }}
              aria-pressed={isActive}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black lowercase transition-colors ${
                isActive ? "bg-acid text-ink" : "text-white/50 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {showingCard ? (
        <div className="rounded-3xl border-2 border-white/12 bg-white/[0.03] p-6">
          {cardView}
        </div>
      ) : (
        <>
          <div
            className={`mx-auto w-fit border-2 border-ink bg-white/[0.04] p-3 shadow-[7px_7px_0_0_theme(colors.hotpink)] ${
              activeDevice === "mobile" ? "rounded-[2.2rem]" : "rounded-2xl"
            }`}
          >
            <div
              className={`relative overflow-hidden bg-black ${
                activeDevice === "mobile" ? "rounded-[1.6rem]" : "rounded-lg"
              }`}
              style={{
                width: `${frame.w * frame.scale}px`,
                height: `${frame.h * frame.scale}px`,
              }}
            >
              {/* An iframe, not a div: media queries resolve against the
                  viewport, so a narrow container would still match `md:` and
                  show desktop layouts under a "mobile" label. */}
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
        </>
      )}
    </div>
  );
}
