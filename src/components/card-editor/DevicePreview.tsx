"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard, Smartphone } from "lucide-react";
import IframeStage from "./IframeStage";

type Tab = "mobile" | "card";

/**
 * Live preview of the profile as it appears on a phone.
 *
 * A second tab appears when `cardView` is supplied: the physical NFC card.
 */
const FRAME = { w: 390, h: 720 };
/** Frame width including its 12px padding and 2px border on each side. */
const OUTER = FRAME.w + 28;

export default function DevicePreview({
  children,
  cardView,
}: {
  children: React.ReactNode;
  /** Optional second tab: the physical NFC card designed from this profile. */
  cardView?: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("mobile");

  const stage = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const measure = () => setFit(Math.min(1, el.clientWidth / OUTER));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const showingCard = tab === "card" && Boolean(cardView);

  const tabs: { key: Tab; label: string; Icon: typeof Smartphone }[] = [
    { key: "mobile", label: "mobile", Icon: Smartphone },
    ...(cardView
      ? [{ key: "card" as Tab, label: "nfc card", Icon: CreditCard }]
      : []),
  ];

  return (
    <div>
      {/* Toggle — only worth showing when there's something to toggle to. */}
      {tabs.length > 1 && (
        <div className="mx-auto mb-4 flex w-fit gap-1 rounded-full border-2 border-white/15 bg-white/[0.04] p-1">
          {tabs.map(({ key, label, Icon }) => {
            const isActive = key === "card" ? showingCard : !showingCard;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-pressed={isActive}
                className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-xs font-black lowercase transition-colors ${
                  isActive ? "bg-acid text-ink" : "text-white/50 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      )}

      {showingCard ? (
        <div className="rounded-3xl border-2 border-white/12 bg-white/[0.03] p-4 sm:p-6">
          {cardView}
        </div>
      ) : (
        <>
          {/* The iframe has to stay 390px wide — that's what makes its media
              queries resolve like a real phone. On a screen narrower than that
              the frame is scaled down rather than squeezed, so the layout
              inside stays honest. */}
          <div ref={stage} className="overflow-hidden">
            <div
              className="mx-auto origin-top rounded-[2.2rem] border-2 border-ink bg-white/[0.04] p-3 shadow-[7px_7px_0_0_theme(colors.hotpink)]"
              style={{
                width: OUTER,
                transform: fit < 1 ? `scale(${fit})` : undefined,
                marginBottom: fit < 1 ? -(FRAME.h + 30) * (1 - fit) : undefined,
              }}
            >
              <div
                className="relative overflow-hidden rounded-[1.6rem] bg-black"
                style={{ width: `${FRAME.w}px`, height: `${FRAME.h}px` }}
              >
                <IframeStage width={FRAME.w} height={FRAME.h}>
                  {children}
                </IframeStage>
              </div>
            </div>
          </div>

          <p className="mt-3 text-center text-[11px] font-black uppercase tracking-widest text-white/35">
            live preview · mobile
          </p>
        </>
      )}
    </div>
  );
}
